import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UtilisateurService } from './utilisateur.service';
import { UtilisateurController } from './utilisateur.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [PrismaModule, forwardRef(() => NotificationModule)],
    controllers: [UtilisateurController],
    providers: [UtilisateurService],
    exports: [UtilisateurService],
})
export class UtilisateurModule {}
