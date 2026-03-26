import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NiveauTier } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async notifyFoodRescuePriority(annonceId: string, titre: string, ville?: string) {
    // 1. Chercher les profils prioritaires (OR et LEGENDE) DANS LA MÊME VILLE
    const priorityUsers = await this.prisma.profil.findMany({
      where: {
        palier: {
          in: [NiveauTier.OR, NiveauTier.LEGENDE],
        },
        // --- NOUVEAUTÉ : FILTRE PAR VILLE SI DISPONIBLE ---
        ...(ville ? { ville: { equals: ville, mode: 'insensitive' } } : {}),
      },
      select: {
          utilisateurId: true,
          palier: true,
          ville: true,
          utilisateur: { select: { email: true } }
      }
    });

    if (priorityUsers.length > 0) {
        // --- NOUVEAUTÉ : PERSISTANCE EN BASE ---
        await this.prisma.notification.createMany({
            data: priorityUsers.map(p => ({
                utilisateurId: p.utilisateurId,
                titre: '🚀 Surplus Alimentaire Proche !',
                message: `L'annonce "${titre}" vient d'être publiée dans votre ville (${ville || 'votre zone'}). En tant que membre ${p.palier}, vous êtes prioritaire !`,
            }))
        });

        this.logger.log(`🚨 FOOD RESCUE ALERTE LOCALE [${ville || '??'}] : Annonce [${titre}]`);
        this.logger.log(`📢 Diffusion et ENREGISTREMENT pour ${priorityUsers.length} VIP à proximité.`);
    }

    return priorityUsers.length;
  }

  /**
   * Créer une notification simple en base de données.
   * Utilisation : notify('user_id', 'Titre', 'Message')
   */
  async create(utilisateurId: string, titre: string, message: string) {
    try {
      return await this.prisma.notification.create({
        data: {
          utilisateurId,
          titre,
          message,
        },
      });
    } catch (error: any) {
      this.logger.error(`Erreur lors de la création de la notification: ${error.message}`);
    }
  }
}
