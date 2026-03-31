import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PointRelaisService } from './point-relais.service';
import { PointRelaisController } from './point-relais.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PointRelaisController],
  providers: [PointRelaisService],
  exports: [PointRelaisService],
})
export class PointRelaisModule {}
