import { Controller, Get, Patch, UseGuards, Req, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly prisma: PrismaService) { }

  // Récupérer mes notifications
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer mes notifications' })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  @Get()
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.userId;
    return this.prisma.notification.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: 'desc' }
    });
  }

  // Marquer une notification comme lue
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiResponse({ status: 200, description: 'Toutes les notifications marquées comme lues' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer le nombre de notifications non lues' })
  @ApiResponse({ status: 200, description: 'Nombre de notifications non lues' })
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
