import { Module } from '@nestjs/common';
import { AnnonceController } from './annonce.controller';
import { AnnonceService } from './annonce.service';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [StorageModule],
    controllers: [AnnonceController],
    providers: [AnnonceService],
})
export class AnnonceModule {}

