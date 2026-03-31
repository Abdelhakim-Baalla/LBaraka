import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfilDto } from './dto/update-profil.dto';
import { NotificationService } from '../notification/notification.service';

// Service pour gérer les utilisateurs
@Injectable()
export class UtilisateurService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) {}

    // Inscription d'un nouvel utilisateur
    async register(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();
        const telephone = this.normalizeTelephone(dto.telephone);
        const cin = dto.cin ? this.normalizeCin(dto.cin) : null;

        // Vérifier si l'email ou le téléphone existe déjà
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { telephone }] },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ConflictException('Cet email est déjà utilisé');
            }

            if (existingUser.telephone === telephone) {
                throw new ConflictException('Ce téléphone est déjà utilisé');
            }

        }

        // Vérifier si le CIN existe déjà
        if (cin) {
            const existingProfilCin = await this.prisma.profil.findUnique({
                where: { cin },
                select: { id: true },
            });

            if (existingProfilCin) {
                throw new ConflictException('Ce CIN est déjà utilisé');
            }
        }

        // Hasher le mot de passe
        const motDePasseHash = await bcrypt.hash(dto.motDePasse, 10);

        try {
            const utilisateur = await this.prisma.$transaction(async (tx) => {
                // Créer l'utilisateur
                const createdUser = await tx.user.create({
                    data: {
                        email,
                        telephone,
                        motDePasseHash,
                    },
                });

                // Créer le profil avec les données initiales
                const profil = await tx.profil.create({
                    data: {
                        utilisateurId: createdUser.id,
                        cin,
                        lBarakaScore: 50, // Bonus de bienvenue
                        palier: 'BRONZE',
                        langueInterface: 'FRANCAIS',
                        badges: ['BIENVENUE'],
                    },
                });

                // Créer le portefeuille vide
                await tx.portefeuille.create({
                    data: {
                        utilisateurId: createdUser.id,
                        soldeReel: 0,
                        soldeBloque: 0,
                        devise: 'MAD',
                    },
                });

                return {
                    ...createdUser,
                    profil,
                };
            });

            return this.sanitizeUser(utilisateur);
        } catch (error) {
            if (this.isUniqueConstraintError(error)) {
                throw new ConflictException('Email, téléphone ou CIN déjà utilisé');
            }

            throw error;
        }
    }

    // Rechercher un utilisateur par email
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            include: { profil: true },
        });
    }

    // Rechercher un utilisateur par ID
    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { profil: true },
        });
    }

    // Retirer le mot de passe de la réponse
    sanitizeUser(utilisateur: {
        motDePasseHash: string;
        [key: string]: unknown;
    }) {
        const { motDePasseHash, ...safeUser } = utilisateur;
        return safeUser;
    }

    // Normaliser le numéro de téléphone
    private normalizeTelephone(telephone: string): string {
        const cleanedTelephone = telephone.replace(/[\s-]/g, '');

        if (cleanedTelephone.startsWith('+212')) {
            return `0${cleanedTelephone.slice(4)}`;
        }

        return cleanedTelephone;
    }

    // Normaliser le CIN
    private normalizeCin(cin: string): string {
        return cin.trim().toUpperCase().replace(/\s+/g, '');
    }

    // Vérifier si c'est une erreur de contrainte unique
    private isUniqueConstraintError(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        );
    }

    // Calculer le palier selon le score (Seuils CDC)
    private calculatePalier(score: number): 'BRONZE' | 'ARGENT' | 'OR' | 'LEGENDE' {
        if (score >= 10000) return 'LEGENDE';
        if (score >= 2001) return 'OR';
        if (score >= 501) return 'ARGENT';
        return 'BRONZE';
    }

    // Mettre à jour le score de l'utilisateur
    async updateScore(userId: string, points: number, tx?: any) {
        const prisma = tx || this.prisma;

        try {
            // Récupérer le profil actuel
            const profil = await prisma.profil.findUnique({
                where: { utilisateurId: userId },
                select: { lBarakaScore: true, palier: true }
            });

            if (!profil) {
                // Si on est dans une transaction et que le profil n'existe pas encore (rare), on l'ignore ou log
                return;
            }

            // Calculer le nouveau score (minimum 0)
            const newScore = Math.max(0, profil.lBarakaScore + points);
            const newPalier = this.calculatePalier(newScore);

            // Mise à jour du profil
            await prisma.profil.update({
                where: { utilisateurId: userId },
                data: {
                    lBarakaScore: newScore,
                    palier: newPalier,
                }
            });

            // Vérifier et attribuer les badges
            await this.checkAndAwardBadges(userId, prisma);
        } catch (error) {
            // On ne bloque pas tout si c'est juste un score (sauf si on est en transaction critique)
            console.error('Erreur mise à jour score:', error);
            if (tx) throw error; // Relancer si on est dans une transaction pour rollback
        }
    }

    // Vérifier et attribuer les badges
    async checkAndAwardBadges(userId: string, tx?: any) {
        const prisma = tx || this.prisma;
        
        const profil = await prisma.profil.findUnique({
            where: { utilisateurId: userId },
        });

        if (!profil) return;

        const currentBadges = new Set(profil.badges);
        const nextBadges = new Set(profil.badges);

        // Badge pour score élevé
        if (profil.lBarakaScore >= 1000) {
            nextBadges.add('AMBASSADEUR_LOCAL');
        }

        // Récupérer les stats des transactions
        const stats = await prisma.transaction.aggregate({
            where: { 
                OR: [{ preteurId: userId }, { emprunteurId: userId }],
                statut: 'TERMINEE'
            },
            _count: true,
        });

        // Badge pour 10+ transactions
        if (stats._count >= 10) {
            nextBadges.add('CHAMPION_ECO');
        }

        // Badge pour les dons
        const donCount = await prisma.transaction.count({
            where: {
                preteurId: userId,
                statut: 'TERMINEE',
                annonce: { mode: 'DON_GRATUIT' }
            }
        });

        if (donCount >= 1) {
            nextBadges.add('DONATEUR_BARAKA');
        }

        // Badge pour Food Rescue
        const foodRescueCount = await prisma.transaction.count({
            where: {
                preteurId: userId,
                statut: 'TERMINEE',
                annonce: { estFoodRescue: true }
            }
        });

        if (foodRescueCount >= 1) {
            nextBadges.add('SAUVEUR_ALIMENTAIRE');
        }

        // Badge pour les emprunts sans problème
        const cleanEmprunts = await prisma.transaction.count({
            where: {
                emprunteurId: userId,
                statut: 'TERMINEE',
                retard: 0,
                degats: false
            }
        });

        if (cleanEmprunts >= 5) {
            nextBadges.add('VOISIN_DE_CONFIANCE');
        }

        // Badge pour location solidaire
        const locationCount = await prisma.transaction.count({
            where: {
                preteurId: userId,
                statut: 'TERMINEE',
                annonce: { mode: 'LOCATION_SOLIDAIRE' }
            }
        });

        if (locationCount >= 1) {
            nextBadges.add('GARANT_SOLIDAIRE');
        }

        // Mettre à jour si nouveaux badges
        if (nextBadges.size > currentBadges.size) {
            await prisma.profil.update({
                where: { utilisateurId: userId },
                data: {
                    badges: Array.from(nextBadges)
                }
            });

            // Envoyer une notification
            await this.notificationService.create(
                userId,
                '🎉 Bravo ! Nouveau badge débloqué !',
                `Félicitations ! Vous avez obtenu le badge "${Array.from(nextBadges).pop()}" pour votre activité sur LBaraka.`
            );
        }
    }

    // Récupérer le profil complet de l'utilisateur
    async getProfilComplet(userId: string) {
        const utilisateur = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profil: true,
                portefeuille: true,
            },
        });

        if (!utilisateur) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        return {
            utilisateur: this.sanitizeUser(utilisateur),
        };
    }

    // Modifier le profil de l'utilisateur
    async updateProfil(userId: string, dto: UpdateProfilDto) {
        const profil = await this.prisma.profil.findUnique({
            where: { utilisateurId: userId },
        });

        if (!profil) {
            throw new NotFoundException('Profil non trouvé');
        }

        const updatedProfil = await this.prisma.profil.update({
            where: { utilisateurId: userId },
            data: {
                nom: dto.nom !== undefined ? dto.nom : profil.nom,
                prenom: dto.prenom !== undefined ? dto.prenom : profil.prenom,
                adresseComplete: dto.adresseComplete !== undefined ? dto.adresseComplete : profil.adresseComplete,
                ville: dto.ville !== undefined ? dto.ville : profil.ville,
                photoProfil: dto.photoProfil !== undefined ? dto.photoProfil : profil.photoProfil,
                dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : profil.dateNaissance,
                langueInterface: dto.langueInterface ? dto.langueInterface as any : profil.langueInterface,
            },
        });

        return { profil: updatedProfil };
    }

    // Voir le profil public d'un utilisateur
    async getProfilPublic(userId: string) {
        const utilisateur = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                dateInscription: true,
                profil: {
                    select: {
                        nom: true,
                        prenom: true,
                        ville: true,
                        lBarakaScore: true,
                        palier: true,
                        badges: true,
                        photoProfil: true,
                    },
                },
            },
        });

        if (!utilisateur) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        return { utilisateur };
    }
}
