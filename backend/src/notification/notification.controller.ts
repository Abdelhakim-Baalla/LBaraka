import { Controller, Get, Patch, UseGuards, Req, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Routes pour les notifications
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly prisma: PrismaService) { }

  // Récupérer mes notifications
  @Get()
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.userId;
    return this.prisma.notification.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: 'desc' }
    });
  }

  // Marquer une notification comme lue
  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req.user.userId;

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        utilisateurId: userId
      }
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { lu: true }
    });
  }

  // Marquer toutes les notifications comme lues
  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.userId;
    return this.prisma.notification.updateMany({
      where: {
        utilisateurId: userId,
        lu: false
      },
      data: { lu: true }
    });
  }

  // Récupérer le nombre de notifications non lues
  @Get('count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.userId;
    const count = await this.prisma.notification.count({
      where: {
        utilisateurId: userId,
        lu: false
      }
    });
    return { unreadCount: count };
  }
}
