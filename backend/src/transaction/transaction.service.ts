import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async reserve(userId: string, annonceId: string) {
    try {
      const annonce = await this.prisma.annonce.findUnique({
        where: { id: annonceId },
      });

      if (!annonce) throw new NotFoundException('Annonce introuvable');
      if (annonce.statut !== 'DISPONIBLE') throw new BadRequestException('Cette annonce n\'est plus disponible');
      if (annonce.createurId === userId) throw new BadRequestException('Vous ne pouvez pas reserver votre propre annonce');

      const montantCaution = Number(annonce.montantCaution || 0);

      if (montantCaution > 0) {
        await this.walletService.blocage(userId, montantCaution);
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          annonceId: annonce.id,
          emprunteurId: userId,
          preteurId: annonce.createurId,
          montantCautionBloquee: annonce.montantCaution,
          statut: 'EN_ATTENTE_RECEPTION',
        },
      });

      await this.prisma.annonce.update({
        where: { id: annonce.id },
        data: { statut: 'RESERVEE' },
      });

      return { transaction };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la réservation de l\'annonce');
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
