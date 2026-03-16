import { Module } from '@nestjs/common';
import { AnnonceController } from './annonce.controller';
import { AnnonceService } from './annonce.service';

@Module({
    controllers: [AnnonceController],
    providers: [AnnonceService],
})
export class AnnonceModule {}

