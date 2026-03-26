import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    // 1. Nombre total d'utilisateurs
    const totalUsers = await this.prisma.user.count();

    // 2. Nombre total de points relais
    const totalPointsRelais = await this.prisma.pointRelais.count();

    // 3. Transactions Terminées (Impact Réel)
    const transactionsTerminees = await this.prisma.transaction.count({
      where: { statut: 'TERMINEE' },
    });

    // 4. Nourriture sauvée (en tranches de 1kg par don alimentaire)
    const foodRescueCount = await this.prisma.transaction.count({
      where: {
        statut: 'TERMINEE',
        annonce: { categorie: 'NOURRITURE' },
      },
    });

    // On estime que chaque "sauvetage" pèse environ 2kg de nourriture
    const tonsFoodSaved = (foodRescueCount * 2) / 1000;

    // 5. Impact CO2 (0.5kg CO2 par transaction d'économie circulaire)
    const co2PreventedKg = transactionsTerminees * 0.5;

    // 6. Impact Économique (Somme des cautions bloquées x0.1 pour estimation service)
    const walletStats = await this.prisma.portefeuille.aggregate({
        _sum: {
            soldeReel: true,
            soldeBloque: true
        }
    });

    // 7. Dernières transactions pour le flux d'activité
    const lastTransactions = await this.prisma.transaction.findMany({
        take: 5,
        orderBy: { dateDebut: 'desc' },
        include: {
            annonce: { select: { titre: true } },
            emprunteur: { select: { email: true } }
        }
    });

    return {
      overview: {
        totalUsers,
        totalPointsRelais,
        transactionsCount: transactionsTerminees,
      },
      impact: {
        tonsFoodSaved: Math.round(tonsFoodSaved * 100) / 100,
        co2PreventedKg: Math.round(co2PreventedKg),
        totalPeopleHelped: transactionsTerminees,
      },
      financial: {
        totalCirculatingMad: walletStats._sum.soldeReel || 0,
        currentlyLockedMad: walletStats._sum.soldeBloque || 0,
      },
      recentActivity: lastTransactions.map(t => ({
          id: t.id,
          title: t.annonce.titre,
          user: t.emprunteur.email,
          status: t.statut
      }))
    };
  }
}
