import { Module } from '@nestjs/common';
import { AnnonceController } from './annonce.controller';
import { AnnonceService } from './annonce.service';
import { StorageModule } from '../storage/storage.module';
import { UtilisateurModule } from '../utilisateur/utilisateur.module';

@Module({
    imports: [StorageModule, UtilisateurModule],
    controllers: [AnnonceController],
    providers: [AnnonceService],
})
export class AnnonceModule {}

