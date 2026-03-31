import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TypeMouvementWallet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { UtilisateurService } from '../utilisateur/utilisateur.service';
// @ts-ignore
import * as html_to_pdf from 'html-pdf-node';

type WalletHistoryFilters = {
  type?: TypeMouvementWallet;
  dateFrom?: string;
  dateTo?: string;
  limit?: string;
};

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
  async getMyWallet(userId: string, filters?: WalletHistoryFilters) {
    const wallet = await this.getOrCreateWallet(userId);
    const mouvements = await this.getMouvementsWithFilters(userId, filters);

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

  // Exporter les mouvements en CSV
  async exportMouvementsCsv(userId: string, filters?: WalletHistoryFilters) {
    const mouvements = await this.getMouvementsWithFilters(userId, {
      ...filters,
      limit: undefined,
    });

    const header = 'id,type,montant,date';
    const lines = mouvements.map((m) => {
      const dateIso = new Date(m.date).toISOString();
      return `${m.id},${m.type},${Number(m.montant).toFixed(2)},${dateIso}`;
    });

    const csv = [header, ...lines].join('\n');

    return {
      fileName: `wallet-mouvements-${Date.now()}.csv`,
      contentType: 'text/csv',
      total: mouvements.length,
      csv,
    };
  }

  // Générer un reçu d'un mouvement
  async getMouvementReceipt(userId: string, mouvementId: string) {
    const mouvement = await this.prisma.mouvementWallet.findFirst({
      where: {
        id: mouvementId,
        utilisateurId: userId,
      },
      include: {
        portefeuille: true,
      },
    });

    if (!mouvement) {
      throw new NotFoundException('Mouvement introuvable');
    }

    const reference = `LBW-${new Date(mouvement.date).getFullYear()}-${mouvement.id.slice(0, 8).toUpperCase()}`;

    return {
      receipt: {
        reference,
        mouvementId: mouvement.id,
        type: mouvement.type,
        montant: Number(mouvement.montant),
        date: mouvement.date,
        devise: mouvement.portefeuille.devise,
        utilisateurId: mouvement.utilisateurId,
      },
    };
  }

  // Générer un reçu PDF d'un mouvement
  async getMouvementReceiptPdf(userId: string, mouvementId: string) {
    const data = await this.getMouvementReceipt(userId, mouvementId);
    const receipt = data.receipt;

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; }
            .title { font-size: 20px; font-weight: 700; color: #1B4332; margin-bottom: 12px; }
            .line { margin: 8px 0; font-size: 14px; }
            .label { font-weight: 700; }
            .foot { margin-top: 16px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">Reçu Wallet LBaraka</div>
            <div class="line"><span class="label">Référence:</span> ${receipt.reference}</div>
            <div class="line"><span class="label">Type:</span> ${receipt.type}</div>
            <div class="line"><span class="label">Montant:</span> ${Number(receipt.montant).toFixed(2)} ${receipt.devise}</div>
            <div class="line"><span class="label">Date:</span> ${new Date(receipt.date).toLocaleString('fr-FR')}</div>
            <div class="line"><span class="label">Mouvement ID:</span> ${receipt.mouvementId}</div>
            <div class="foot">Document généré automatiquement (mode démonstration).</div>
          </div>
        </body>
      </html>
    `;

    const options = {
      format: 'A4',
      printBackground: true,
    };

    const file = { content: html };

    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      html_to_pdf.generatePdf(file, options, (err: any, buffer: Buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    return {
      fileName: `recu-wallet-${receipt.reference}.pdf`,
      contentType: 'application/pdf',
      base64: pdfBuffer.toString('base64'),
      reference: receipt.reference,
    };
  }

  // Récupérer les mouvements avec filtres simples
  private async getMouvementsWithFilters(userId: string, filters?: WalletHistoryFilters) {
    const dateFilter: any = {};

    if (filters?.dateFrom) {
      const parsedFrom = new Date(filters.dateFrom);
      if (!isNaN(parsedFrom.getTime())) {
        dateFilter.gte = parsedFrom;
      }
    }

    if (filters?.dateTo) {
      const parsedTo = new Date(filters.dateTo);
      if (!isNaN(parsedTo.getTime())) {
        dateFilter.lte = parsedTo;
      }
    }

    let take = 20;
    if (filters?.limit) {
      const limitParsed = Number(filters.limit);
      if (Number.isFinite(limitParsed) && limitParsed > 0) {
        take = Math.min(limitParsed, 200);
      }
    }

    const where: any = {
      utilisateurId: userId,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    return this.prisma.mouvementWallet.findMany({
      where,
      orderBy: { date: 'desc' },
      take,
    });
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
