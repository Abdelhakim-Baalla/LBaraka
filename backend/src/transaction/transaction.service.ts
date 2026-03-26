import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ContratService } from '../contrat/contrat.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly contratService: ContratService,
    private readonly utilisateurService: UtilisateurService,
    private readonly notificationService: NotificationService,
  ) { }

  /**
   * Réserver une annonce avec vérification complète du wallet.
   * PROTECTION : Vérifie que l'utilisateur a assez de fonds avant de bloquer.
   */
  async reserve(userId: string, annonceId: string) {
    try {
      const annonce = await this.prisma.annonce.findUnique({
        where: { id: annonceId },
      });

      if (!annonce) throw new NotFoundException('Annonce introuvable');
      if (annonce.statut !== 'DISPONIBLE') throw new BadRequestException('Cette annonce n\'est plus disponible');
      if (annonce.createurId === userId) throw new BadRequestException('Vous ne pouvez pas reserver votre propre annonce');

      const montantCaution = Number(annonce.montantCaution || 0);
      const prixSymbolique = Number(annonce.prixSymbolique || 0);
      const montantTotal = montantCaution + prixSymbolique;

      // PROTECTION CRITIQUE : Vérifier le solde disponible AVANT de créer la transaction
      if (montantTotal > 0) {
        const walletInfo = await this.walletService.getWalletInfo(userId);
        const soldeDisponible = walletInfo.soldeReel;

        if (soldeDisponible < montantTotal) {
          throw new BadRequestException(
            `Solde insuffisant pour effectuer cette réservation. ` +
            `Montant nécessaire : ${montantTotal} MAD ` +
            `(Caution : ${montantCaution} + Prix : ${prixSymbolique}). ` +
            `Votre solde disponible : ${soldeDisponible} MAD. ` +
            `Veuillez déposer des fonds dans votre wallet.`
          );
        }
      }

      const transaction = await this.prisma.$transaction(async (tx) => {
        if (montantCaution > 0) {
          await this.walletService.blocage(userId, montantCaution, tx);
        }

        if (prixSymbolique > 0 && annonce.mode === 'LOCATION_SOLIDAIRE') {
          await this.walletService.retrait(userId, prixSymbolique, tx);
        }

        const newTx = await tx.transaction.create({
          data: {
            annonceId: annonce.id,
            emprunteurId: userId,
            preteurId: annonce.createurId,
            montantCautionBloquee: annonce.montantCaution,
            statut: 'EN_ATTENTE_RECEPTION',
          },
        });

        await tx.annonce.update({
          where: { id: annonce.id },
          data: { statut: 'RESERVEE' },
        });

        return newTx;
      });

      await this.contratService.generateContrat(transaction.id);

      // --- NOUVEAUTÉ : NOTIFICATION RÉSERVATION ---
      await this.notificationService.create(
        annonce.createurId,
        '📅 Objet réservé !',
        `Votre objet "${annonce.titre}" a été réservé. Attendez le scan du QR code pour la remise.`
      );

      return {
        transaction,
        message: 'Réservation effectuée avec succès. Votre caution a été bloquée.'
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la réservation de l\'annonce');
    }
  }

  async generateReceptionQR(userId: string, transactionId: string): Promise<string> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundException('Transaction introuvable');
    if (transaction.emprunteurId !== userId) throw new UnauthorizedException('Seul l\'emprunteur peut générer son QR Code de réception');

    const secret = crypto.randomBytes(16).toString('hex');

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { qrCodeReception: secret },
    });

    return QRCode.toDataURL(JSON.stringify({ transactionId, secret }));
  }

  async validateReceptionQR(userId: string, transactionId: string, secret: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) throw new NotFoundException('Transaction introuvable');
        if (transaction.preteurId !== userId) throw new UnauthorizedException('Seul le prêteur peut scanner ce code pour valider la remise');
        if (transaction.qrCodeReception !== secret) throw new BadRequestException('Code QR invalide ou l\'emprunteur n\'est pas celui attendu');
        if (transaction.statut !== 'EN_ATTENTE_RECEPTION') throw new BadRequestException('Transaction déjà en cours ou terminée');

        const updated = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            statut: 'EN_COURS',
            scannedReception: true,
            dateDebut: new Date(),
          },
        });

        return updated;
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erreur lors de la validation du QR Code');
    }
  }

  /**
   * Générer un QR Code pour le RETOUR de l'objet.
   * C'est le prêteur qui génère ce QR pour que l'emprunteur le scanne au moment du retour.
   */
  async generateRetourQR(userId: string, transactionId: string): Promise<string> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundException('Transaction introuvable');
    if (transaction.preteurId !== userId) throw new UnauthorizedException('Seul le prêteur peut générer le QR Code de retour');
    if (transaction.statut !== 'EN_COURS') throw new BadRequestException('La transaction doit être EN_COURS pour générer un QR de retour');

    const secret = crypto.randomBytes(16).toString('hex');

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { qrCodeRetour: secret },
    });

    return QRCode.toDataURL(JSON.stringify({ transactionId, type: 'RETOUR', secret }));
  }

  /**
   * Valider le QR Code de retour.
   * L'emprunteur scanne ce code pour confirmer qu'il rend l'objet.
   */
  async validateRetourQR(userId: string, transactionId: string, secret: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
          include: { annonce: true },
        });

        if (!transaction) throw new NotFoundException('Transaction introuvable');
        if (transaction.emprunteurId !== userId) throw new UnauthorizedException('Seul l\'emprunteur peut scanner ce code pour confirmer le retour');
        if (transaction.qrCodeRetour !== secret) throw new BadRequestException('Code QR de retour invalide');
        if (transaction.statut !== 'EN_COURS') throw new BadRequestException('Transaction doit être EN_COURS');
        if (transaction.scannedRetour) throw new BadRequestException('Le retour a déjà été confirmé');

        const updated = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            scannedRetour: true,
          },
        });

        return updated;
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erreur lors de la validation du QR Code de retour');
    }
  }

  async validerRetour(userId: string, transactionId: string) {
    try {
      const resultTx = await this.prisma.$transaction(async (tx) => {
        const currentTx = await tx.transaction.findUnique({
          where: { id: transactionId },
          include: { annonce: true },
        });

        if (!currentTx) throw new NotFoundException('Transaction introuvable');
        if (currentTx.preteurId !== userId) throw new BadRequestException('Seul le prêteur peut valider le retour');
        if (currentTx.statut === 'TERMINEE') throw new BadRequestException('Cette transaction est déjà terminée');

        let joursRetard = 0;
        if (currentTx.dateFinPrevue) {
          const now = new Date();
          const finPrevue = new Date(currentTx.dateFinPrevue);
          if (now > finPrevue) {
            const diffMs = now.getTime() - finPrevue.getTime();
            joursRetard = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          }
        }

        const montantCautionBloquee = Number(currentTx.montantCautionBloquee || 0);
        if (montantCautionBloquee > 0) {
          if (joursRetard > 0) {
            const penalite = joursRetard * 30;
            const montantApresPenalite = Math.max(0, montantCautionBloquee - penalite);

            if (montantApresPenalite > 0) {
              await this.walletService.deblocage(currentTx.emprunteurId, montantApresPenalite, tx);
            }

            await tx.transaction.update({
              where: { id: transactionId },
              data: { retard: joursRetard },
            });
          } else {
            await this.walletService.deblocage(currentTx.emprunteurId, montantCautionBloquee, tx);
          }
        }

        const prixSymbolique = Number(currentTx.annonce.prixSymbolique || 0);
        if (currentTx.annonce.mode === 'LOCATION_SOLIDAIRE' && prixSymbolique > 0) {
          await this.walletService.retrait(currentTx.emprunteurId, prixSymbolique, tx);
          await this.walletService.depot(currentTx.preteurId, prixSymbolique, tx);
        }

        const updatedTx = await tx.transaction.update({
          where: { id: transactionId },
          data: { statut: 'TERMINEE', dateFinReelle: new Date() },
        });

        await tx.annonce.update({
          where: { id: currentTx.annonceId },
          data: { statut: 'DISPONIBLE' },
        });

        // NOUVEAUTÉ GAMIFICATION (LBAR-20)
        // 1. Si c'est un DON, on récompense le donneur (+100)
        if (currentTx.annonce.mode === 'DON_GRATUIT') {
          await this.utilisateurService.updateScore(currentTx.preteurId, 100, tx);
        } 
        // 2. Si c'est un PRÊT ou une LOCATION, on récompense aussi le service rendu (+20)
        else {
          await this.utilisateurService.updateScore(currentTx.preteurId, 20, tx);
        }

        // 3. Vérifier les badges pour l'emprunteur aussi (même si score inchangé, le compteur de transactions a bougé)
        await this.utilisateurService.checkAndAwardBadges(currentTx.emprunteurId, tx);

        return updatedTx;
      });

      return { transaction: resultTx };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la validation du retour');
    }
  }

  async getMyTransactions(userId: string) {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [
            { emprunteurId: userId },
            { preteurId: userId },
          ],
        },
        include: {
          annonce: true,
          emprunteur: { select: { email: true } },
          preteur: { select: { email: true } },
        },
        orderBy: { id: 'desc' },
      });

      return { transactions };
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération des transactions');
    }
  }

  /**
   * SIGNALER UNE DÉGRADATION (LBAR-20)
   * Le prêteur signale un problème : l'emprunteur perd 200 points.
   */
  async signalerDegradation(userId: string, transactionId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) throw new NotFoundException('Transaction introuvable');
        if (transaction.preteurId !== userId) throw new UnauthorizedException('Seul le prêteur peut signaler une dégradation');
        if (transaction.statut !== 'TERMINEE') throw new BadRequestException('Vous ne pouvez signaler une dégradation que sur une transaction terminée');

        // On passe la transaction en LITIGE_DEGRADATION
        const updated = await tx.transaction.update({
          where: { id: transactionId },
          data: { 
            statut: 'LITIGE_DEGRADATION',
            degats: true
          },
        });

        // SANCTION GAMIFICATION (-200 points)
        await this.utilisateurService.updateScore(transaction.emprunteurId, -200, tx);

        return updated;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erreur lors du signalement de la dégradation');
    }
  }
}
