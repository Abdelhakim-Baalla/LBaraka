import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profil } from './profils.entity';
import { NiveauTier } from '../../common/enums/niveau.tier.enum';
import { TypeBadge } from '../../common/enums/type.badge.enum';


@Injectable()
export class ProfilsService {
    constructor(
        @InjectRepository(Profil)
        private profilsRepository: Repository<Profil>,
    ) {}

    // Créer un profil vide avec score = 0
    async createProfilInitial(nom: string, prenom: string): Promise<Profil> {
        const profil = this.profilsRepository.create({
            nom,
            prenom,
            LBarakaScore: 0,
            palier: NiveauTier.BRONZE,
            badges: [TypeBadge.BIENVENUE],
        });
        return this.profilsRepository.save(profil);
    }
}