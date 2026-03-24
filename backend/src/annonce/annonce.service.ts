import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CategorieAnnonce, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { StorageService } from '../storage/storage.service';
import { haversineKm } from '../common/utils/geo.util';

@Injectable()
export class AnnonceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) { }

    async create(createurId: string, dto: CreateAnnonceDto) {
        try {
            const photos = await this.storageService.uploadAnnoncePhotosBase64(dto.photosBase64 || []);
            
            // Logique Food Rescue : Expiration automatique dans 4 heures par défaut
            let finalExpiration = dto.expirationDate ? new Date(dto.expirationDate) : null;
            if (dto.isFoodRescue && !finalExpiration) {
                finalExpiration = new Date(Date.now() + 4 * 60 * 60 * 1000);
            }

            const annonce = await this.prisma.annonce.create({
                data: {
                    titre: dto.titre,
                    description: dto.description,
                    categorie: dto.categorie,
                    mode: dto.mode,
                    condition: dto.condition,
                    geolocalisation: dto.geolocalisation,
                    prixSymbolique: dto.prixSymbolique ? new Prisma.Decimal(dto.prixSymbolique) : null,
                    montantCaution: dto.montantCaution ? new Prisma.Decimal(dto.montantCaution) : null,
                    estFoodRescue: dto.isFoodRescue ?? false,
                    dateExpiration: finalExpiration,
                    photos,
                    createurId,
                },
            });

            return { annonce };
        } catch (error: any) {
            console.error('ERREUR CREATION ANNONCE:', error.message);
            throw new InternalServerErrorException('Erreur lors de la création de l\'annonce');
        }
    }

    async findAll(categorie?: CategorieAnnonce) {
        try {
            const annonces = await this.prisma.annonce.findMany({
                where: {
                    statut: 'DISPONIBLE',
                    ...(categorie && { categorie }),
                    // Ne pas afficher les annonces expirées
                    OR: [
                        { dateExpiration: null },
                        { dateExpiration: { gt: new Date() } }
                    ]
                },
                orderBy: { dateCreation: 'desc' },
            });

            return { annonces };
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la récupération des annonces');
        }
    }

    async findNearby(lat: number, lng: number, rayonKm: number, categorie?: CategorieAnnonce) {
        try {
            const annonces = await this.prisma.annonce.findMany({
                where: {
                    statut: 'DISPONIBLE',
                    ...(categorie && { categorie }),
                    // Ne pas afficher les annonces expirées
                    OR: [
                        { dateExpiration: null },
                        { dateExpiration: { gt: new Date() } }
                    ]
                },
                select: {
                    id: true,
                    titre: true,
                    description: true,
                    categorie: true,
                    mode: true,
                    condition: true,
                    photos: true,
                    geolocalisation: true,
                    prixSymbolique: true,
                    montantCaution: true,
                    dateCreation: true,
                    createur: { select: { id: true, email: true } },
                },
            });

            const result = annonces
                .filter((a) => a.geolocalisation && a.geolocalisation.length >= 2)
                .map((a) => ({
                    ...a,
                    distance: Math.round(haversineKm(lat, lng, a.geolocalisation[0], a.geolocalisation[1]) * 10) / 10,
                }))
                .filter((a) => a.distance <= rayonKm)
                .sort((a, b) => a.distance - b.distance);

            return { annonces: result };
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la récupération des annonces à proximité');
        }
    }
}

