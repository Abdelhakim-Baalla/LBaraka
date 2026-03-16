import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UtilisateurService } from './utilisateur.service';

@Module({
    imports: [PrismaModule],
    providers: [UtilisateurService],
    exports: [UtilisateurService],
})
export class UtilisateurModule {}
