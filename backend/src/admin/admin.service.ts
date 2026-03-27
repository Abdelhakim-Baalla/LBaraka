import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleUtilisateur } from '@prisma/client';

// Service pour les fonctions admin
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Récupérer les statistiques générales
  async getStats() {
    // Compter les utilisateurs
    const totalUsers = await this.prisma.user.count();

    // Compter les points relais
    const totalPointsRelais = await this.prisma.pointRelais.count();

    // Compter les transactions terminées
    const transactionsTerminees = await this.prisma.transaction.count({
      where: { statut: 'TERMINEE' },
    });

    // Compter les Food Rescue
    const foodRescueCount = await this.prisma.transaction.count({
      where: {
        statut: 'TERMINEE',
        annonce: { categorie: 'NOURRITURE' },
      },
    });

    // Calculer la nourriture sauvée en kg
    const tonsFoodSaved = (foodRescueCount * 2) / 1000;

    // Calculer l'impact CO2
    const co2PreventedKg = transactionsTerminees * 0.5;

    // Récupérer les stats du portefeuille
    const walletStats = await this.prisma.portefeuille.aggregate({
        _sum: {
            soldeReel: true,
            soldeBloque: true
        }
    });

    // Récupérer les dernières transactions
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
        totalCirculatingMad: Number(walletStats._sum.soldeReel || 0),
        currentlyLockedMad: Number(walletStats._sum.soldeBloque || 0),
      },
      recentActivity: lastTransactions.map(t => ({
          id: t.id,
          title: t.annonce.titre,
          user: t.emprunteur.email,
          status: t.statut
      }))
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;

      const where = search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { telephone: { contains: search, mode: 'insensitive' as const } },
          { profil: { OR: [
              { nom: { contains: search, mode: 'insensitive' as const } },
              { prenom: { contains: search, mode: 'insensitive' as const } },
              { cin: { contains: search, mode: 'insensitive' as const } }
            ] } },
        ]
      } : {};

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: { profil: true, portefeuille: true },
          orderBy: { dateInscription: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          telephone: u.telephone,
          role: u.role,
          dateInscription: u.dateInscription,
          isBlocked: u.isBlocked,
          profil: u.profil,
          solde: Number(u.portefeuille?.soldeReel || 0),
        })),
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Impossible de récupérer la liste des utilisateurs');
    }
  }

  // Modifier le rôle d'un utilisateur
  async updateUserRole(id: string, role: RoleUtilisateur) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Utilisateur non trouvé');

      return await this.prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, role: true }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de modifier le rôle de l\'utilisateur');
    }
  }

  // Bloquer ou débloquer un utilisateur
  async updateUserStatus(id: string, isBlocked: boolean) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Utilisateur non trouvé');

      return await this.prisma.user.update({
        where: { id },
        data: { isBlocked },
        select: { id: true, email: true, isBlocked: true }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de modifier le statut de l\'utilisateur');
    }
  }
}
