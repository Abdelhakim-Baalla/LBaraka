import { Module } from '@nestjs/common';
import { PointRelaisController } from './point-relais.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PointRelaisController],
})
export class PointRelaisModule { }
