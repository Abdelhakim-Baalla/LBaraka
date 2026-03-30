import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ContratService } from '../contrat/contrat.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { NotificationService } from '../notification/notification.service';

// Service pour gérer les transactions
@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly contratService: ContratService,
    private readonly utilisateurService: UtilisateurService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) { }

  private buildShortCode(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('hex')
      .toUpperCase()
      .slice(0, 6);
  }

  // Réserver une annonce
  async reserve(userId: string, annonceId: string) {
    try {
      const annonce = await this.prisma.annonce.findUnique({
        where: { id: annonceId },
      });

      if (!annonce) throw new NotFoundException('Annonce introuvable');
      if (annonce.statut !== 'DISPONIBLE') throw new BadRequestException('Cette annonce n\'est plus disponible');
      if (annonce.createurId === userId) throw new BadRequestException('Vous ne pouvez pas reserver votre propre annonce');

      // Calculer le montant total à payer
      const montantCaution = Number(annonce.montantCaution || 0);
      const prixSymbolique = Number(annonce.prixSymbolique || 0);
      const montantTotal = montantCaution + prixSymbolique;

      // Vérifier si l'utilisateur a assez de solde
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

      // Créer la transaction et bloquer la caution
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

      // Générer le contrat
      await this.contratService.generateContrat(transaction.id);

      // Envoyer une notification au propriétaire
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

  // Générer un QR code sécurisé pour la réception avec JWT
  async generateReceptionQR(userId: string, transactionId: string) {
    // Récupérer la transaction depuis la base
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    // Vérifier que la transaction existe
    if (!transaction) {
      throw new NotFoundException('Transaction introuvable');
    }

    // Vérifier que l'utilisateur est bien l'emprunteur
    if (transaction.emprunteurId !== userId) {
      throw new UnauthorizedException('Seul l\'emprunteur peut générer le QR Code de réception');
    }

    // Vérifier que le QR n'a pas déjà été utilisé
    if (transaction.isQrUsed) {
      throw new BadRequestException('Ce QR Code a déjà été utilisé');
    }

    // Générer un payload JWT contenant transactionId, userId et le type QR_RECEPTION
    const payload = {
      transactionId,
      userId,
      type: 'QR_RECEPTION',
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes d'expiration
    };

    // Signe ce payload avec le secret QR_JWT_SECRET
    const token = this.jwtService.sign(payload, {
      secret: process.env.QR_JWT_SECRET || 'lbaraka_qr_super_secret_2026',
    });

    // Sauvegarder le token en base de données avec isQrUsed à false
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        qrCodeToken: token,
        isQrUsed: false,
      },
    });

    // Retourner le QR code encodé en base64 + le token brut (fallback sans caméra)
    const qrCode = await QRCode.toDataURL(token);
    return {
      qrCode,
      code: this.buildShortCode(token),
    };
  }

  // Valider le QR code de réception sécurisé avec JWT
  async validateReceptionQR(userId: string, transactionId: string, token: string) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction introuvable');
      }

      if (transaction.isQrUsed) {
        throw new BadRequestException('Ce QR Code a déjà été utilisé');
      }

      if (userId !== transaction.preteurId) {
        throw new UnauthorizedException('Seul le prêteur peut scanner ce QR Code');
      }

      let tokenToVerify = String(token || '').trim();
      const normalizedInput = tokenToVerify.toUpperCase();
      const isShortCode = /^[A-Z0-9]{4,8}$/.test(normalizedInput);

      if (isShortCode) {
        if (!transaction.qrCodeToken) {
          throw new BadRequestException('QR Code introuvable pour cette transaction');
        }

        const expectedShortCode = this.buildShortCode(transaction.qrCodeToken);
        if (expectedShortCode !== normalizedInput) {
          throw new BadRequestException('Code court invalide');
        }

        tokenToVerify = transaction.qrCodeToken;
      }

      // Vérifier et décoder le token JWT avec le secret QR_JWT_SECRET
      const decoded = this.jwtService.verify(tokenToVerify, {
        secret: process.env.QR_JWT_SECRET || 'lbaraka_qr_super_secret_2026',
      });

      // Récupérer le transactionId du payload
      if (decoded.transactionId !== transactionId) {
        throw new BadRequestException('Token QR invalide pour cette transaction');
      }

      // Utiliser une transaction Prisma pour:
      // - Marquer le QR comme utilisé
      // - Changer le statut de la transaction à EN_COURS
      // - Ajouter 100 points au score de l'emprunteur via utilisateurService
      const updated = await this.prisma.$transaction(async (tx) => {
        // Marquer le QR comme utilisé
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            isQrUsed: true,
            statut: 'EN_COURS',
            scannedReception: true,
            dateDebut: new Date(),
          },
        });

        // Ajouter 100 points au score de l'emprunteur
        await this.utilisateurService.updateScore(transaction.emprunteurId, 100, tx);

        // Récupérer la transaction mise à jour
        return tx.transaction.findUnique({
          where: { id: transactionId },
        });
      });

      // Retourner un message de confirmation
      return {
        message: 'Réception validée avec succès ! L\'emprunteur a reçu 100 points.',
        transaction: updated,
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          throw new BadRequestException('QR Code expiré ou invalide');
        }
      }
      throw new InternalServerErrorException('Erreur lors de la validation du QR Code');
    }
  }

  // Générer un QR code pour le retour
  async generateRetourQR(userId: string, transactionId: string) {
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

    const payload = JSON.stringify({ transactionId, type: 'RETOUR', secret });
    const qrCode = await QRCode.toDataURL(payload);

    return {
      qrCode,
      code: this.buildShortCode(secret),
    };
  }

  // Valider le QR code de retour
  async validateRetourQR(userId: string, transactionId: string, secret: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
          include: { annonce: true },
        });

        if (!transaction) throw new NotFoundException('Transaction introuvable');
        if (transaction.emprunteurId !== userId) throw new UnauthorizedException('Seul l\'emprunteur peut scanner ce code pour confirmer le retour');
        if (!transaction.qrCodeRetour) throw new BadRequestException('QR retour introuvable');

        const incomingValue = String(secret || '').trim();
        const normalizedInput = incomingValue.toUpperCase();
        const isShortCode = /^[A-Z0-9]{4,8}$/.test(normalizedInput);

        let secretToCompare = incomingValue;
        if (isShortCode) {
          const expectedShortCode = this.buildShortCode(transaction.qrCodeRetour);
          if (expectedShortCode !== normalizedInput) {
            throw new BadRequestException('Code court invalide');
          }
          secretToCompare = transaction.qrCodeRetour;
        }

        if (transaction.qrCodeRetour !== secretToCompare) throw new BadRequestException('Code QR de retour invalide');
        if (transaction.statut !== 'EN_COURS') throw new BadRequestException('Transaction doit être EN_COURS');
        if (transaction.scannedRetour) throw new BadRequestException('Le retour a déjà été confirmé');

        const updated = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            scannedRetour: true,
            statut: 'EN_ATTENTE_RETOUR',
          },
        });

        return updated;
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erreur lors de la validation du QR Code de retour');
    }
  }

  // Valider le retour et libérer la caution
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
        if (!currentTx.scannedRetour) {
          throw new BadRequestException('Le retour doit être confirmé par scan QR avant finalisation');
        }
        if (currentTx.statut !== 'EN_ATTENTE_RETOUR') {
          throw new BadRequestException('La transaction doit être EN_ATTENTE_RETOUR pour être finalisée');
        }

        // Calcul du malus de retard
        const maintenant = new Date();
        const dateFinPrevue = currentTx.dateFinPrevue ? new Date(currentTx.dateFinPrevue) : null;
        let joursRetard = 0;

        if (dateFinPrevue && maintenant > dateFinPrevue) {
          const diffMs = maintenant.getTime() - dateFinPrevue.getTime();
          joursRetard = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (joursRetard > 0) {
            const malusPoints = joursRetard * 30;
            await this.utilisateurService.updateScore(currentTx.emprunteurId, -malusPoints, tx);

            // Enregistrer le retard en base
            await tx.transaction.update({
              where: { id: transactionId },
              data: { retard: joursRetard },
            });
          }
        }

        // +50 points pour retour conforme (score de l'emprunteur)
        await this.utilisateurService.updateScore(currentTx.emprunteurId, 50, tx);

        // Libérer la caution (toujours débloquer le montant total ici, sauf si litige séparé)
        const montantCautionBloquee = Number(currentTx.montantCautionBloquee || 0);
        if (montantCautionBloquee > 0) {
          await this.walletService.deblocage(currentTx.emprunteurId, montantCautionBloquee, tx);
        }

        // Payer le prix symbolique au propriétaire
        // Le montant a déjà été retiré de l'emprunteur pendant la réservation.
        const prixSymbolique = Number(currentTx.annonce.prixSymbolique || 0);
        if (currentTx.annonce.mode === 'LOCATION_SOLIDAIRE' && prixSymbolique > 0) {
          await this.walletService.depot(currentTx.preteurId, prixSymbolique, tx);
        }

        // Terminer la transaction
        const updatedTx = await tx.transaction.update({
          where: { id: transactionId },
          data: { statut: 'TERMINEE', dateFinReelle: new Date() },
        });

        // Remettre l'annonce en disponible
        await tx.annonce.update({
          where: { id: currentTx.annonceId },
          data: { statut: 'DISPONIBLE' },
        });

        // Ajouter des points au propriétaire selon le type d'annonce
        if (currentTx.annonce.mode === 'DON_GRATUIT') {
          await this.utilisateurService.updateScore(currentTx.preteurId, 100, tx);
        } else {
          await this.utilisateurService.updateScore(currentTx.preteurId, 20, tx);
        }

        // Vérifier les badges pour l'emprunteur
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

  // Récupérer les transactions de l'utilisateur
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
          contrat: true,
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

  // Signaler une dégradation
  async signalerDegradation(userId: string, transactionId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) throw new NotFoundException('Transaction introuvable');
        if (transaction.preteurId !== userId) throw new UnauthorizedException('Seul le prêteur peut signaler une dégradation');
        if (transaction.statut !== 'TERMINEE') throw new BadRequestException('Vous ne pouvez signaler une dégradation que sur une transaction terminée');

        // Mettre la transaction en litige
        const updated = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            statut: 'LITIGE_DEGRADATION',
            degats: true
          },
        });

        // Retirer des points à l'emprunteur
        await this.utilisateurService.updateScore(transaction.emprunteurId, -200, tx);

        return updated;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erreur lors du signalement de la dégradation');
    }
  }

  // Annuler une réservation
  async annuler(userId: string, transactionId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { id: transactionId },
          include: { annonce: true },
        });

        if (!transaction) {
          throw new NotFoundException('Transaction introuvable');
        }

        // Seul l'emprunteur peut annuler
        if (transaction.emprunteurId !== userId) {
          throw new BadRequestException('Seul l\'emprunteur peut annuler cette réservation');
        }

        // On ne peut annuler que si EN_ATTENTE_RECEPTION
        if (transaction.statut !== 'EN_ATTENTE_RECEPTION') {
          throw new BadRequestException(
            'Impossible d\'annuler : la transaction est déjà en cours ou terminée'
          );
        }

        // Débloquer la caution
        const montantCaution = Number(transaction.montantCautionBloquee || 0);
        if (montantCaution > 0) {
          await this.walletService.deblocage(userId, montantCaution, tx);
        }

        // Mettre à jour la transaction
        const updated = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            statut: 'ANNULEE',
            dateFinReelle: new Date(),
          },
        });

        // Remettre l'annonce en disponible
        await tx.annonce.update({
          where: { id: transaction.annonceId },
          data: { statut: 'DISPONIBLE' },
        });

        // Notification au propriétaire
        await this.notificationService.create(
          transaction.preteurId,
          '❌ Réservation annulée',
          `La réservation de votre objet "${transaction.annonce.titre}" a été annulée par l'emprunteur.`
        );

        return {
          transaction: updated,
          message: 'Réservation annulée. Votre caution a été débloquée.',
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de l\'annulation');
    }
  }
}
