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

@Injectable()
export class AnnonceService {
    private readonly logger = new Logger(AnnonceService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly notificationService: NotificationService,
        private readonly utilisateurService: UtilisateurService,
    ) { }

    /**
     * Tâche planifiée : Expire les annonces toutes les 15 minutes (ex: Food Rescue).
     */
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
            this.logger.error('Erreur lors de l’expiration automatique des annonces', error);
        }
    }

    /**
     * Créer une annonce standard (Don, Prêt, Location).
     * Les citoyens ne peuvent PAS créer d'annonce Food Rescue via cette méthode.
     */
    async create(createurId: string, role: RoleUtilisateur, dto: CreateAnnonceDto) {
        try {
            // SÉCURITÉ : Empêcher les citoyens de créer des Food Rescue
            // (La route est aussi protégée par @Roles('PARTENAIRE') mais double vérification)
            if (dto.isFoodRescue && role !== 'PARTENAIRE') {
                throw new ForbiddenException(
                    'Seuls les PARTENAIRES peuvent publier des annonces Food Rescue pour des raisons d\'hygiène et de sécurité alimentaire.'
                );
            }

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

            // --- NOUVEAUTÉ : NOTIFICATION PRIORITAIRE ET LOCALE ---
            if (annonce.estFoodRescue) {
                // On cherche la ville du créateur pour cibler les voisins
                const creatorProfile = await this.prisma.profil.findUnique({
                    where: { utilisateurId: createurId },
                    select: { ville: true }
                });
                const creatorVille = creatorProfile?.ville || undefined;

                // On notifie en priorité les profils OR et LEGENDE de la mème ville
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

    /**
     * Créer une annonce Food Rescue (SURPLUS ALIMENTAIRE).
     * EXCLUSIVEMENT pour les PARTENAIRES (restaurants, traiteurs, associations).
     * Sécurité alimentaire : on ne laisse pas les citoyens lambda publier de la nourriture.
     */
    async createFoodRescue(createurId: string, role: RoleUtilisateur, dto: CreateAnnonceDto) {
        try {
            // Vérification supplémentaire : doit être PARTENAIRE
            if (role !== 'PARTENAIRE') {
                throw new ForbiddenException(
                    'Seuls les PARTENAIRES peuvent publier des surplus alimentaires.'
                );
            }

            // Forcer le flag Food Rescue
            dto.isFoodRescue = true;

            const photos = await this.storageService.uploadAnnoncePhotosBase64(dto.photosBase64 || []);

            // Expiration par défaut : 4 heures pour les aliments périssables
            let finalExpiration = dto.expirationDate ? new Date(dto.expirationDate) : null;
            if (!finalExpiration) {
                finalExpiration = new Date(Date.now() + 4 * 60 * 60 * 1000);
            }

            const annonce = await this.prisma.annonce.create({
                data: {
                    titre: dto.titre,
                    description: dto.description,
                    categorie: 'NOURRITURE', // Forcé pour Food Rescue
                    mode: 'DON_GRATUIT',      // Food Rescue = toujours don gratuit
                    condition: dto.condition || 'BON_ETAT',
                    geolocalisation: dto.geolocalisation,
                    prixSymbolique: null,     // Food Rescue = gratuit
                    montantCaution: null,      // Pas de caution pour Food Rescue
                    estFoodRescue: true,
                    dateExpiration: finalExpiration,
                    photos,
                    createurId,
                },
            });

            // --- NOUVEAUTÉ : NOTIFICATION PRIORITAIRE ET LOCALE ---
            // On cherche la ville du créateur pour cibler les voisins
            const creatorProfile = await this.prisma.profil.findUnique({
                where: { utilisateurId: createurId },
                select: { ville: true }
            });
            const creatorVille = creatorProfile?.ville || undefined;

            // On notifie en priorité les profils OR et LEGENDE de la mème ville
            this.notificationService.notifyFoodRescuePriority(annonce.id, annonce.titre, creatorVille);

            // NOUVEAUTÉ GAMIFICATION (LBAR-20)
            // Bonus immédiat pour la publication solidaire Food Rescue
            await this.utilisateurService.updateScore(createurId, 50);

            return { annonce, message: 'Annonce Food Rescue publiée avec succès. Les utilisateurs proches ont été notifiés.' };
        } catch (error: any) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            console.error('ERREUR CREATION FOOD RESCUE:', error.message);
            throw new InternalServerErrorException('Erreur lors de la publication du Food Rescue');
        }
    }

    /**
     * Récupérer uniquement les Food Rescue actifs (non expirés).
     */
    async findFoodRescue() {
        try {
            const now = new Date();
            const annonces = await this.prisma.annonce.findMany({
                where: {
                    estFoodRescue: true,
                    statut: 'DISPONIBLE',
                    dateExpiration: {
                        gt: now, // Non expirés
                    },
                },
                orderBy: { dateExpiration: 'asc' }, // Plus urgent en premier
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

    /**
     * Récupérer une annonce par son ID.
     */
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

            // Incrémenter le nombre de vues
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

    /**
     * Récupérer les annonces de l'utilisateur connecté.
     */
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

    /**
     * Modifier une annonce (seulement par le créateur).
     */
    async update(userId: string, annonceId: string, dto: UpdateAnnonceDto) {
        try {
            const annonce = await this.prisma.annonce.findUnique({
                where: { id: annonceId },
            });

            if (!annonce) {
                throw new NotFoundException('Annonce introuvable');
            }

            if (annonce.createurId !== userId) {
                throw new ForbiddenException('Vous ne pouvez modifier que vos propres annonces');
            }

            if (annonce.statut !== 'DISPONIBLE') {
                throw new BadRequestException('Impossible de modifier une annonce qui n\'est pas disponible');
            }

            const updatedAnnonce = await this.prisma.annonce.update({
                where: { id: annonceId },
                data: {
                    titre: dto.titre !== undefined ? dto.titre : annonce.titre,
                    description: dto.description !== undefined ? dto.description : annonce.description,
                    categorie: dto.categorie ? dto.categorie as any : annonce.categorie,
                    mode: dto.mode ? dto.mode as any : annonce.mode,
                    condition: dto.condition ? dto.condition as any : annonce.condition,
                    prixSymbolique: dto.prixSymbolique !== undefined ? new Prisma.Decimal(dto.prixSymbolique) : annonce.prixSymbolique,
                    montantCaution: dto.montantCaution !== undefined ? new Prisma.Decimal(dto.montantCaution) : annonce.montantCaution,
                    geolocalisation: dto.geolocalisation !== undefined ? dto.geolocalisation : annonce.geolocalisation,
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

    /**
     * Supprimer une annonce (seulement par le créateur).
     */
    async remove(userId: string, annonceId: string) {
        try {
            const annonce = await this.prisma.annonce.findUnique({
                where: { id: annonceId },
            });

            if (!annonce) {
                throw new NotFoundException('Annonce introuvable');
            }

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
