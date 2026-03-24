import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
