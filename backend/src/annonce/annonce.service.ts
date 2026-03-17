import { BadRequestException, Injectable } from '@nestjs/common';
import { CategorieAnnonce, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { StorageService } from '../storage/storage.service';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const BLOCKED_DEFAULT_LAT = 33.5731;
const BLOCKED_DEFAULT_LNG = -7.5898;
const EPSILON = 0.000001;

@Injectable()
export class AnnonceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) {}

    async create(createurId: string, dto: CreateAnnonceDto, files: Express.Multer.File[]) {
        this.assertValidGeoLocation(dto.geolocalisation);
        const photos = await this.storageService.uploadAnnoncePhotos(files);

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
                estFoodRescue: dto.estFoodRescue ?? false,
                dateExpiration: dto.dateExpiration ? new Date(dto.dateExpiration) : null,
                photos,
                createurId,
            },
        });

        return { annonce };
    }

    private assertValidGeoLocation(geolocalisation: number[]) {
        const [lat, lng] = geolocalisation ?? [];

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new BadRequestException('La geolocalisation doit contenir des coordonnees GPS valides');
        }

        const isBlockedDefault =
            Math.abs(lat - BLOCKED_DEFAULT_LAT) < EPSILON &&
            Math.abs(lng - BLOCKED_DEFAULT_LNG) < EPSILON;

        if (isBlockedDefault) {
            throw new BadRequestException('La position par defaut est interdite, utilisez votre position reelle');
        }
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

    async findNearby(lat: number, lng: number, rayonKm: number, categorie?: CategorieAnnonce) {
        const annonces = await this.prisma.annonce.findMany({
            where: {
                statut: 'DISPONIBLE',
                ...(categorie && { categorie }),
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

        // Filtrer et enrichir avec la distance
        const result = annonces
            .filter((a) => a.geolocalisation.length >= 2)
            .map((a) => ({
                ...a,
                distance: Math.round(haversineKm(lat, lng, a.geolocalisation[0], a.geolocalisation[1]) * 10) / 10,
            }))
            .filter((a) => a.distance <= rayonKm)
            .sort((a, b) => a.distance - b.distance);

        return { annonces: result };
    }
}

