import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TypeMouvementWallet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { UtilisateurService } from '../utilisateur/utilisateur.service';

// Service pour gérer les wallets (portefeuilles)
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilisateurService: UtilisateurService,
  ) { }

  // Récupérer les infos du wallet (solde sans historique)
  async getWalletInfo(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      soldeReel: Number(wallet.soldeReel),
      soldeBloque: Number(wallet.soldeBloque),
      devise: wallet.devise,
    };
  }

  // Récupérer le wallet avec l'historique des mouvements
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

  // Déposer de l'argent
  async depot(userId: string, montant: number, tx?: Prisma.TransactionClient) {
    return this.applyMovement(userId, montant, 'DEPOT', tx);
  }

  // Retirer de l'argent
  async retrait(userId: string, montant: number, tx?: Prisma.TransactionClient) {
    return this.applyMovement(userId, montant, 'RETRAIT', tx);
  }

  // Bloquer de l'argent (caution)
  async blocage(userId: string, montant: number, tx?: Prisma.TransactionClient) {
    return this.applyMovement(userId, montant, 'BLOCAGE', tx);
  }

  // Débloquer de l'argent (caution)
  async deblocage(userId: string, montant: number, tx?: Prisma.TransactionClient) {
    return this.applyMovement(userId, montant, 'DEBLOCAGE', tx);
  }

  // Appliquer un mouvement sur le wallet
  private async applyMovement(
    userId: string,
    montant: number,
    type: TypeMouvementWallet,
    outerTx?: Prisma.TransactionClient,
  ) {
    const decimalAmount = new Prisma.Decimal(montant);

    const executor = outerTx ? (fn: (tx: Prisma.TransactionClient) => Promise<any>) => fn(outerTx) : this.prisma.$transaction.bind(this.prisma);

    const wallet = await executor(async (tx) => {
      const current = await this.getOrCreateWallet(userId, tx);

      // Vérifications selon le type de mouvement
      if (type === 'BLOCAGE' && current.soldeReel.lessThan(decimalAmount)) {
        throw new BadRequestException('Solde reel insuffisant pour bloquer cette caution');
      }

      if (type === 'DEBLOCAGE' && current.soldeBloque.lessThan(decimalAmount)) {
        throw new BadRequestException('Solde bloque insuffisant pour ce deblocage');
      }

      if (type === 'RETRAIT' && current.soldeReel.lessThan(decimalAmount)) {
        throw new BadRequestException('Solde reel insuffisant pour ce retrait');
      }

      // Mettre à jour les soldes selon le type
      let nextData = {};
      if (type === 'DEPOT') {
        nextData = { soldeReel: { increment: decimalAmount } };
      } else if (type === 'RETRAIT') {
        nextData = { soldeReel: { decrement: decimalAmount } };
      } else if (type === 'BLOCAGE') {
        nextData = { soldeReel: { decrement: decimalAmount }, soldeBloque: { increment: decimalAmount } };
      } else if (type === 'DEBLOCAGE') {
        nextData = { soldeReel: { increment: decimalAmount }, soldeBloque: { decrement: decimalAmount } };
      }

      const updated = await tx.portefeuille.update({
        where: { utilisateurId: userId },
        data: nextData,
      });

      // Enregistrer le mouvement
      await tx.mouvementWallet.create({
        data: {
          utilisateurId: userId,
          portefeuilleId: updated.id,
          type,
          montant: decimalAmount,
        },
      });

      // Ajouter des points quand l'utilisateur dépose de l'argent
      if (type === 'DEPOT') {
        await this.utilisateurService.updateScore(userId, montant, tx);
      }

      return updated;
    });

    return {
      wallet: this.toWalletResponse(wallet),
    };
  }

  // Récupérer ou créer un wallet pour l'utilisateur
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

  // Formater la réponse du wallet
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
