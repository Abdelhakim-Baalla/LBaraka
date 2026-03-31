import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CategorieAnnonce, Prisma, RoleUtilisateur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { StorageService } from '../storage/storage.service';
import { haversineKm } from '../common/utils/geo.util';
import { NotificationService } from '../notification/notification.service';
import { UtilisateurService } from '../utilisateur/utilisateur.service';

// Service pour gérer les annonces
@Injectable()
export class AnnonceService {
    private readonly logger = new Logger(AnnonceService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly notificationService: NotificationService,
        private readonly utilisateurService: UtilisateurService,
    ) { }

    // Tâche qui expire automatiquement les anciennes annonces
    @Cron('0 */15 * * * *')
    async handleCron() {
        this.logger.debug('Vérification des annonces expirées...');

        try {
            const now = new Date();
            const result = await this.prisma.annonce.updateMany({
                where: {
                    statut: 'DISPONIBLE',
                    dateExpiration: {
                        not: null,
                        lt: now,
                    },
                },
                data: {
                    statut: 'EXPIREE',
                },
            });

            if (result.count > 0) {
                this.logger.log(`${result.count} annonces marquées comme expirées.`);
            }
        } catch (error) {
            this.logger.error('Erreur lors de l\'expiration automatique des annonces', error);
        }
    }

    // Créer une nouvelle annonce
    async create(createurId: string, role: RoleUtilisateur, dto: CreateAnnonceDto) {
        try {
            // Les partenaires peuvent créer des Food Rescue, pas les autres
            if (dto.isFoodRescue && role !== 'PARTENAIRE') {
                throw new ForbiddenException(
                    'Seuls les PARTENAIRES peuvent publier des annonces Food Rescue.'
                );
            }

            // Upload les photos
            const photos = await this.storageService.uploadAnnoncePhotosBase64(dto.photosBase64 || []);

            // Calcul de la date d'expiration pour Food Rescue
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

            // Notification pour Food Rescue
            if (annonce.estFoodRescue) {
                const creatorProfile = await this.prisma.profil.findUnique({
                    where: { utilisateurId: createurId },
                    select: { ville: true }
                });
                const creatorVille = creatorProfile?.ville || undefined;

                this.notificationService.notifyFoodRescuePriority(annonce.id, annonce.titre, creatorVille);
            }

            return { annonce };
        } catch (error: any) {
            if (error instanceof ForbiddenException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('ERREUR CREATION ANNONCE:', error.message);
            throw new InternalServerErrorException('Erreur lors de la création de l\'annonce');
        }
    }

    // Créer une annonce Food Rescue (nourriture)
    async createFoodRescue(createurId: string, role: RoleUtilisateur, dto: CreateAnnonceDto) {
        try {
            // Vérification du rôle partenaire
            if (role !== 'PARTENAIRE') {
                throw new ForbiddenException(
                    'Seuls les PARTENAIRES peuvent publier des surplus alimentaires.'
                );
            }

            dto.isFoodRescue = true;

            const photos = await this.storageService.uploadAnnoncePhotosBase64(dto.photosBase64 || []);

            // Expiration 4h par défaut pour la nourriture
            let finalExpiration = dto.expirationDate ? new Date(dto.expirationDate) : null;
            if (!finalExpiration) {
                finalExpiration = new Date(Date.now() + 4 * 60 * 60 * 1000);
            }

            const annonce = await this.prisma.annonce.create({
                data: {
                    titre: dto.titre,
                    description: dto.description,
                    categorie: 'NOURRITURE',
                    mode: 'DON_GRATUIT',
                    condition: dto.condition || 'BON_ETAT',
                    geolocalisation: dto.geolocalisation,
                    prixSymbolique: null,
                    montantCaution: null,
                    estFoodRescue: true,
                    dateExpiration: finalExpiration,
                    photos,
                    createurId,
                },
            });

            // Notification pour les utilisateurs proches
            const creatorProfile = await this.prisma.profil.findUnique({
                where: { utilisateurId: createurId },
                select: { ville: true }
            });
            const creatorVille = creatorProfile?.ville || undefined;

            this.notificationService.notifyFoodRescuePriority(annonce.id, annonce.titre, creatorVille);

            // Ajout de points pour le créateur
            await this.utilisateurService.updateScore(createurId, 50);

            return { annonce, message: 'Annonce Food Rescue publiée avec succès.' };
        } catch (error: any) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            console.error('ERREUR CREATION FOOD RESCUE:', error.message);
            throw new InternalServerErrorException('Erreur lors de la publication du Food Rescue');
        }
    }

    // Récupérer les Food Rescue actifs
    async findFoodRescue() {
        try {
            const now = new Date();
            const annonces = await this.prisma.annonce.findMany({
                where: {
                    estFoodRescue: true,
                    statut: 'DISPONIBLE',
                    dateExpiration: {
                        gt: now,
                    },
                },
                orderBy: { dateExpiration: 'asc' },
                include: {
                    createur: {
                        select: {
                            id: true,
                            email: true,
                            profil: { select: { nom: true, prenom: true } }
                        }
                    },
                },
            });

            return {
                count: annonces.length,
                annonces
            };
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la récupération des Food Rescue');
        }
    }

    // Récupérer toutes les annonces
    async findAll(categorie?: CategorieAnnonce) {
        try {
            const annonces = await this.prisma.annonce.findMany({
                where: {
                    statut: 'DISPONIBLE',
                    ...(categorie && { categorie }),
                    OR: [
                        { dateExpiration: null },
                        { dateExpiration: { gt: new Date() } }
                    ]
                },
                orderBy: { dateCreation: 'desc' },
                include: {
                    createur: {
                        select: {
                            id: true,
                            profil: {
                                select: {
                                    nom: true,
                                    prenom: true,
                                    ville: true,
                                    lBarakaScore: true,
                                    palier: true,
                                },
                            },
                        },
                    },
                },
            });

            return { annonces };
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la récupération des annonces');
        }
    }

    // Récupérer les annonces proches d'un point
    async findNearby(lat: number, lng: number, rayonKm: number, categorie?: CategorieAnnonce) {
        try {
            const annonces = await this.prisma.annonce.findMany({
                where: {
                    statut: 'DISPONIBLE',
                    ...(categorie && { categorie }),
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

            // Calcul des distances et tri
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

    // Récupérer une annonce par son ID
    async findById(annonceId: string) {
        try {
            const annonce = await this.prisma.annonce.findUnique({
                where: { id: annonceId },
                include: {
                    createur: {
                        select: {
                            id: true,
                            email: true,
                            profil: { select: { nom: true, prenom: true, ville: true, photoProfil: true, lBarakaScore: true, palier: true } },
                        },
                    },
                },
            });

            if (!annonce) {
                throw new NotFoundException('Annonce introuvable');
            }

            // On compte une vue
            await this.prisma.annonce.update({
                where: { id: annonceId },
                data: { nombreVues: { increment: 1 } },
            });

            return { annonce };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Erreur lors de la récupération de l\'annonce');
        }
    }

    // Récupérer les annonces de l'utilisateur connecté
    async findMyAnnonces(userId: string) {
        try {
            const annonces = await this.prisma.annonce.findMany({
                where: { createurId: userId },
                orderBy: { dateCreation: 'desc' },
            });

            return { annonces };
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la récupération de vos annonces');
        }
    }

    // Modifier une annonce
    async update(userId: string, annonceId: string, dto: UpdateAnnonceDto) {
        try {
            const annonce = await this.prisma.annonce.findUnique({
                where: { id: annonceId },
            });

            if (!annonce) {
                throw new NotFoundException('Annonce introuvable');
            }

            // Vérification que c'est bien le créateur
            if (annonce.createurId !== userId) {
                throw new ForbiddenException('Vous ne pouvez modifier que vos propres annonces');
            }

            if (annonce.statut !== 'DISPONIBLE') {
                throw new BadRequestException('Impossible de modifier une annonce qui n\'est pas disponible');
            }

            let photosToSave = [...annonce.photos];

            if (dto.photos && dto.photos.length > 0) {
                photosToSave = dto.photos.slice(0, 3);
            }

            if (dto.photosBase64 && dto.photosBase64.length > 0) {
                const uploadedPhotos = await this.storageService.uploadAnnoncePhotosBase64(dto.photosBase64);

                for (let i = 0; i < uploadedPhotos.length; i++) {
                    const targetIndex = Number(dto.photosBase64[i]?.index);

                    if (Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < 3) {
                        photosToSave[targetIndex] = uploadedPhotos[i];
                    } else {
                        photosToSave[i] = uploadedPhotos[i];
                    }
                }

                photosToSave = photosToSave.slice(0, 3);
            }

            photosToSave = photosToSave
                .filter((photo) => typeof photo === 'string' && photo.trim().length > 0)
                .slice(0, 3);

            if (photosToSave.length === 0) {
                photosToSave = [...annonce.photos].slice(0, 3);
            }

            const updatedAnnonce = await this.prisma.annonce.update({
                where: { id: annonceId },
                data: {
                    titre: dto.titre !== undefined ? dto.titre : annonce.titre,
                    description: dto.description !== undefined ? dto.description : annonce.description,
                    categorie: dto.categorie !== undefined ? dto.categorie : annonce.categorie,
                    mode: dto.mode !== undefined ? dto.mode : annonce.mode,
                    condition: dto.condition !== undefined ? dto.condition : annonce.condition,
                    prixSymbolique: dto.prixSymbolique !== undefined ? new Prisma.Decimal(dto.prixSymbolique) : annonce.prixSymbolique,
                    montantCaution: dto.montantCaution !== undefined ? new Prisma.Decimal(dto.montantCaution) : annonce.montantCaution,
                    geolocalisation: dto.geolocalisation !== undefined ? dto.geolocalisation : annonce.geolocalisation,
                    photos: photosToSave,
                },
            });

            return { annonce: updatedAnnonce };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la modification de l\'annonce');
        }
    }

    // Supprimer une annonce
    async remove(userId: string, annonceId: string) {
        try {
            const annonce = await this.prisma.annonce.findUnique({
                where: { id: annonceId },
            });

            if (!annonce) {
                throw new NotFoundException('Annonce introuvable');
            }

            // Vérification que c'est bien le créateur
            if (annonce.createurId !== userId) {
                throw new ForbiddenException('Vous ne pouvez supprimer que vos propres annonces');
            }

            if (annonce.statut === 'RESERVEE') {
                throw new BadRequestException('Impossible de supprimer une annonce réservée');
            }

            await this.prisma.annonce.delete({
                where: { id: annonceId },
            });

            return { message: 'Annonce supprimée avec succès' };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erreur lors de la suppression de l\'annonce');
        }
    }
}
