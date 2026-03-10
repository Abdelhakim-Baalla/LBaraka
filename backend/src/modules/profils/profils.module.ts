import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profil } from './profils.entity';
import { ProfilsService } from './profils.service';

@Module({
    imports: [TypeOrmModule.forFeature([Profil])],
    providers: [ProfilsService],
    exports: [ProfilsService],
})
export class ProfilsModule {}