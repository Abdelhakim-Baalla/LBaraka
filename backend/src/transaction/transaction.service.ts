import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ContratService } from '../contrat/contrat.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly contratService: ContratService,
  ) {}

  async reserve(userId: string, annonceId: string) {
    try {
      const transaction = await this.prisma.$transaction(async (tx) => {
        const annonce = await tx.annonce.findUnique({
          where: { id: annonceId },
        });

        if (!annonce) throw new NotFoundException('Annonce introuvable');
        if (annonce.statut !== 'DISPONIBLE') throw new BadRequestException('Cette annonce n\'est plus disponible');
        if (annonce.createurId === userId) throw new BadRequestException('Vous ne pouvez pas reserver votre propre annonce');

        const montantCaution = Number(annonce.montantCaution || 0);

        if (montantCaution > 0) {
          await this.walletService.blocage(userId, montantCaution, tx);
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

      // Generation automatique du contrat (Wow Factor!)
      await this.contratService.generateContrat(transaction.id);

      return { transaction };
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

    // Générer un secret unique
    const secret = crypto.randomBytes(16).toString('hex');
    
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { qrCodeReception: secret },
    });

    // L'emprunteur génère le QR qu'il montrera au prêteur
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

        // Valider la remise physique
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

        const montantCautionBloquee = Number(currentTx.montantCautionBloquee || 0);
        if (montantCautionBloquee > 0) {
          await this.walletService.deblocage(currentTx.emprunteurId, montantCautionBloquee, tx);
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
          data: { statut: 'TERMINEE' },
        });

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
}
