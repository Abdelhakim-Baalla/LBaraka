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
      select: {
          utilisateurId: true,
          palier: true,
          utilisateur: { select: { email: true } }
      }
    });

    if (priorityUsers.length > 0) {
        // --- NOUVEAUTÉ : PERSISTANCE EN BASE ---
        await this.prisma.notification.createMany({
            data: priorityUsers.map(p => ({
                utilisateurId: p.utilisateurId,
                titre: '🚀 Surplus Alimentaire Prioritaire !',
                message: `L'annonce "${titre}" vient d'être publiée. En tant que membre ${p.palier}, vous êtes prioritaire !`,
            }))
        });

        this.logger.log(`🚨 FOOD RESCUE ALERTE : Annonce [${titre}]`);
        this.logger.log(`📢 Diffusion et ENREGISTREMENT pour ${priorityUsers.length} comptes VIP.`);
    }

    return priorityUsers.length;
  }
}
