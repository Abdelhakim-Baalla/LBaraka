import { Module } from '@nestjs/common';
import { ContratService } from './contrat.service';
import { ContratController } from './contrat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ContratController],
  providers: [ContratService],
  exports: [ContratService],
})
export class ContratModule {}
