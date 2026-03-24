import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.userId;
    return this.prisma.notification.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: 'desc' }
    });
  }
}
