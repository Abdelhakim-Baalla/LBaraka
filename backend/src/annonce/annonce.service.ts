import { Injectable } from '@nestjs/common';
import { CategorieAnnonce } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AnnonceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) {}

    async create(createurId: string, dto: CreateAnnonceDto, files: Express.Multer.File[]) {
        const photos = await this.storageService.uploadAnnoncePhotos(files);

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

    async findAll(categorie?: CategorieAnnonce) {
        const annonces = await this.prisma.annonce.findMany({
            where: {
                statut: 'DISPONIBLE',
                ...(categorie && { categorie }),
            },
            orderBy: { dateCreation: 'desc' },
        });

        return { annonces };
    }
}

