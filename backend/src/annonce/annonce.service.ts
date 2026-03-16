import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';

@Injectable()
export class AnnonceService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createurId: string, dto: CreateAnnonceDto, photos: string[]) {
        const annonce = await this.prisma.annonce.create({
            data: {
                titre: dto.titre,
                description: dto.description,
                categorie: dto.categorie,
                mode: dto.mode,
                condition: dto.condition,
                geolocalisation: dto.geolocalisation,
                photos,
                createurId,
            },
        });

        return { annonce };
    }
}

