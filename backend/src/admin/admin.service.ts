import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleUtilisateur } from '@prisma/client';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

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

    // Compter toutes les transactions
    const totalTransactions = await this.prisma.transaction.count();

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
        totalTransactions,
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

  // Récupérer un utilisateur par ID avec tous les détails
  async getUserById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          profil: true,
          portefeuille: {
            include: {
              historique: {
                take: 10,
                orderBy: { date: 'desc' }
              }
            }
          },
          annonces: {
            take: 5,
            orderBy: { dateCreation: 'desc' }
          },
          transactionsPret: {
            take: 5,
            orderBy: { dateDebut: 'desc' },
            include: {
              annonce: { select: { titre: true } },
              emprunteur: { select: { email: true } }
            }
          },
          transactionsEmpr: {
            take: 5,
            orderBy: { dateDebut: 'desc' },
            include: {
              annonce: { select: { titre: true } },
              preteur: { select: { email: true } }
            }
          }
        }
      });

      if (!user) throw new NotFoundException('Utilisateur non trouvé');

      return {
        ...user,
        portefeuille: user.portefeuille ? {
          ...user.portefeuille,
          soldeReel: Number(user.portefeuille.soldeReel),
          soldeBloque: Number(user.portefeuille.soldeBloque),
          historique: user.portefeuille.historique.map(h => ({
            ...h,
            montant: Number(h.montant)
          }))
        } : null
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de récupérer l\'utilisateur');
    }
  }

  // Modifier le profil d'un utilisateur
  async updateUserProfile(id: string, dto: UpdateUserProfileDto) {
    try {
      const user = await this.prisma.user.findUnique({ 
        where: { id },
        include: { profil: true }
      });
      
      if (!user) throw new NotFoundException('Utilisateur non trouvé');

      // Mettre à jour le téléphone si fourni
      if (dto.telephone && dto.telephone !== user.telephone) {
        await this.prisma.user.update({
          where: { id },
          data: { telephone: dto.telephone }
        });
      }

      // Mettre à jour ou créer le profil
      const profileData: any = {};
      if (dto.nom) profileData.nom = dto.nom;
      if (dto.prenom) profileData.prenom = dto.prenom;
      if (dto.cin) profileData.cin = dto.cin;
      if (dto.adresseComplete) profileData.adresseComplete = dto.adresseComplete;
      if (dto.ville) profileData.ville = dto.ville;
      if (dto.dateNaissance) profileData.dateNaissance = new Date(dto.dateNaissance);

      if (user.profil) {
        await this.prisma.profil.update({
          where: { utilisateurId: id },
          data: profileData
        });
      } else {
        await this.prisma.profil.create({
          data: {
            ...profileData,
            utilisateurId: id
          }
        });
      }

      return this.getUserById(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de modifier le profil');
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

  // Supprimer un utilisateur
  async deleteUser(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Utilisateur non trouvé');

      await this.prisma.user.delete({ where: { id } });
      return { message: 'Utilisateur supprimé avec succès' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de supprimer l\'utilisateur');
    }
  }

  // Récupérer toutes les transactions
  async getAllTransactions(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          skip,
          take: limit,
          include: {
            annonce: { select: { titre: true, categorie: true, photos: true } },
            emprunteur: { select: { id: true, email: true, profil: true } },
            preteur: { select: { id: true, email: true, profil: true } },
            pointRelais: { select: { nom: true, adresse: true } }
          },
          orderBy: { dateDebut: 'desc' }
        }),
        this.prisma.transaction.count()
      ]);

      return {
        transactions: transactions.map(t => ({
          ...t,
          montantCautionBloquee: Number(t.montantCautionBloquee)
        })),
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Impossible de récupérer les transactions');
    }
  }

  // Récupérer une transaction par ID
  async getTransactionById(id: string) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id },
        include: {
          annonce: true,
          emprunteur: { include: { profil: true, portefeuille: true } },
          preteur: { include: { profil: true, portefeuille: true } },
          pointRelais: true,
          contrat: true
        }
      });

      if (!transaction) throw new NotFoundException('Transaction non trouvée');

      return {
        ...transaction,
        montantCautionBloquee: Number(transaction.montantCautionBloquee)
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de récupérer la transaction');
    }
  }

  // Récupérer toutes les annonces
  async getAllAnnonces(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [annonces, total] = await Promise.all([
        this.prisma.annonce.findMany({
          skip,
          take: limit,
          include: {
            createur: { select: { id: true, email: true, profil: true } },
            transactions: { select: { id: true, statut: true } }
          },
          orderBy: { dateCreation: 'desc' }
        }),
        this.prisma.annonce.count()
      ]);

      return {
        annonces: annonces.map(a => ({
          ...a,
          prixSymbolique: a.prixSymbolique ? Number(a.prixSymbolique) : null,
          montantCaution: a.montantCaution ? Number(a.montantCaution) : null
        })),
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Impossible de récupérer les annonces');
    }
  }

  // Supprimer une annonce
  async deleteAnnonce(id: string) {
    try {
      const annonce = await this.prisma.annonce.findUnique({ where: { id } });
      if (!annonce) throw new NotFoundException('Annonce non trouvée');

      await this.prisma.annonce.delete({ where: { id } });
      return { message: 'Annonce supprimée avec succès' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de supprimer l\'annonce');
    }
  }

  // Récupérer tous les points relais
  async getAllPointsRelais() {
    try {
      const pointsRelais = await this.prisma.pointRelais.findMany({
        include: {
          transactions: {
            select: { id: true, statut: true },
            take: 5,
            orderBy: { dateDebut: 'desc' }
          }
        },
        orderBy: { nom: 'asc' }
      });

      return { pointsRelais };
    } catch (error) {
      throw new InternalServerErrorException('Impossible de récupérer les points relais');
    }
  }
}
