import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TypeMouvementWallet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyWallet(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const mouvements = await this.prisma.mouvementWallet.findMany({
      where: { utilisateurId: userId },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return {
      wallet: this.toWalletResponse(wallet),
      mouvements: mouvements.map((m) => ({
        id: m.id,
        type: m.type,
        montant: Number(m.montant),
        date: m.date,
      })),
    };
  }

  async depot(userId: string, montant: number) {
    return this.applyMovement(userId, montant, 'DEPOT');
  }

  async blocage(userId: string, montant: number) {
    return this.applyMovement(userId, montant, 'BLOCAGE');
  }

  async deblocage(userId: string, montant: number) {
    return this.applyMovement(userId, montant, 'DEBLOCAGE');
  }

  private async applyMovement(
    userId: string,
    montant: number,
    type: TypeMouvementWallet,
  ) {
    const decimalAmount = new Prisma.Decimal(montant);

    const wallet = await this.prisma.$transaction(async (tx) => {
      const current = await this.getOrCreateWallet(userId, tx);

      if (type === 'BLOCAGE' && current.soldeReel.lessThan(decimalAmount)) {
        throw new BadRequestException('Solde reel insuffisant pour bloquer cette caution');
      }

      if (type === 'DEBLOCAGE' && current.soldeBloque.lessThan(decimalAmount)) {
        throw new BadRequestException('Solde bloque insuffisant pour ce deblocage');
      }

      const nextData =
        type === 'DEPOT'
          ? { soldeReel: { increment: decimalAmount } }
          : type === 'BLOCAGE'
            ? {
                soldeReel: { decrement: decimalAmount },
                soldeBloque: { increment: decimalAmount },
              }
            : {
                soldeReel: { increment: decimalAmount },
                soldeBloque: { decrement: decimalAmount },
              };

      const updated = await tx.portefeuille.update({
        where: { utilisateurId: userId },
        data: nextData,
      });

      await tx.mouvementWallet.create({
        data: {
          utilisateurId: userId,
          portefeuilleId: updated.id,
          type,
          montant: decimalAmount,
        },
      });

      return updated;
    });

    return {
      wallet: this.toWalletResponse(wallet),
    };
  }

  private async getOrCreateWallet(userId: string, tx: Prisma.TransactionClient = this.prisma) {
    const existing = await tx.portefeuille.findUnique({ where: { utilisateurId: userId } });
    if (existing) {
      return existing;
    }

    return tx.portefeuille.create({
      data: {
        utilisateurId: userId,
        soldeReel: new Prisma.Decimal(0),
        soldeBloque: new Prisma.Decimal(0),
        devise: 'MAD',
      },
    });
  }

  private toWalletResponse(wallet: {
    id: string;
    soldeReel: Prisma.Decimal;
    soldeBloque: Prisma.Decimal;
    devise: string;
    dateMiseAJour: Date;
  }) {
    return {
      id: wallet.id,
      soldeReel: Number(wallet.soldeReel),
      soldeBloque: Number(wallet.soldeBloque),
      devise: wallet.devise,
      dateMiseAJour: wallet.dateMiseAJour,
    };
  }
}

