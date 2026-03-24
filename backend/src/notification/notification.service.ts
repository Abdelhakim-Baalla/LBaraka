import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NiveauTier } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async notifyFoodRescuePriority(annonceId: string, titre: string) {
    // 1. Chercher les profils prioritaires (OR et LEGENDE)
    const priorityUsers = await this.prisma.profil.findMany({
      where: {
        palier: {
          in: [NiveauTier.OR, NiveauTier.LEGENDE],
        },
      },
      include: {
        utilisateur: {
          select: { email: true }
        }
      }
    });

    this.logger.log(`🚨 FOOD RESCUE ALERTE : Annonce [${titre}]`);
    this.logger.log(`📢 Diffusion prioritaire à ${priorityUsers.length} comptes de rang OR et LEGENDE.`);

    // Simulation de l'envoi (Push/Email)
    priorityUsers.forEach(profil => {
      this.logger.debug(`[NOTIFICATION] Envoyée à ${profil.utilisateur.email} (Rang: ${profil.palier})`);
    });

    return priorityUsers.length;
  }
}
