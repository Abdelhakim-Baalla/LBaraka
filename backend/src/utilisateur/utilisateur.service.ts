import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UtilisateurService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) {}

    async register(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();
        const telephone = this.normalizeTelephone(dto.telephone);
        const cin = dto.cin ? this.normalizeCin(dto.cin) : null;

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

        if (cin) {
            const existingProfilCin = await this.prisma.profil.findUnique({
                where: { cin },
                select: { id: true },
            });

            if (existingProfilCin) {
                throw new ConflictException('Ce CIN est déjà utilisé');
            }
        }

        const motDePasseHash = await bcrypt.hash(dto.motDePasse, 10);

        try {
            const utilisateur = await this.prisma.$transaction(async (tx) => {
                const createdUser = await tx.user.create({
                    data: {
                        email,
                        telephone,
                        motDePasseHash,
                    },
                });

                const profil = await tx.profil.create({
                    data: {
                        utilisateurId: createdUser.id,
                        cin,
                        lBarakaScore: 50, // Bonus de bienvenue ! ✨🎉
                        palier: 'BRONZE',
                        langueInterface: 'FRANCAIS',
                        badges: ['BIENVENUE'],
                    },
                });

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

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            include: { profil: true },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { profil: true },
        });
    }

    sanitizeUser(utilisateur: {
        motDePasseHash: string;
        [key: string]: unknown;
    }) {
        const { motDePasseHash, ...safeUser } = utilisateur;
        return safeUser;
    }

    private normalizeTelephone(telephone: string): string {
        const cleanedTelephone = telephone.replace(/[\s-]/g, '');

        if (cleanedTelephone.startsWith('+212')) {
            return `0${cleanedTelephone.slice(4)}`;
        }

        return cleanedTelephone;
    }

    private normalizeCin(cin: string): string {
        return cin.trim().toUpperCase().replace(/\s+/g, '');
    }

    private isUniqueConstraintError(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        );
    }

    /**
     * Met à jour le score lBaraka et ajuste automatiquement le palier (Tier).
     * Logique : Bronze (0+), Argent (500+), Or (1000+), Legende (2000+)
     */
    async updateScore(userId: string, points: number, tx?: any) {
        const prisma = tx || this.prisma;
        
        // 1. Mise à jour atomique du score
        const updatedProfil = await prisma.profil.update({
            where: { utilisateurId: userId },
            data: {
                lBarakaScore: { increment: points }
            }
        });

        // 2. LOGIQUE IMPORTANTE : Sécurité anti-négatif
        // Si le score est descendu en dessous de 0, on le remet à 0 proprement
        let finalScore = updatedProfil.lBarakaScore;
        if (finalScore < 0) {
            finalScore = 0;
            await prisma.profil.update({
                where: { utilisateurId: userId },
                data: { lBarakaScore: 0 }
            });
        }
        
        // 3. SYNCHRONISATION DU PALIER (Tier)
        let nouveauPalier: 'BRONZE' | 'ARGENT' | 'OR' | 'LEGENDE' = 'BRONZE';
        if (finalScore >= 2000) nouveauPalier = 'LEGENDE';
        else if (finalScore >= 1000) nouveauPalier = 'OR';
        else if (finalScore >= 500) nouveauPalier = 'ARGENT';

        // 4. Mettre à jour le palier si nécessaire
        if (updatedProfil.palier !== nouveauPalier) {
            await prisma.profil.update({
                where: { utilisateurId: userId },
                data: { palier: nouveauPalier }
            });
        }

        // 5. Vérifier les badges (déclencheur score)
        await this.checkAndAwardBadges(userId, prisma);
    }

    /**
     * Vérifie et attribue les badges selon l'activité de l'utilisateur.
     * Cette méthode est appelée après chaque transaction importante ou changement de score.
     */
    async checkAndAwardBadges(userId: string, tx?: any) {
        const prisma = tx || this.prisma;
        
        const profil = await prisma.profil.findUnique({
            where: { utilisateurId: userId },
        });

        if (!profil) return;

        const currentBadges = new Set(profil.badges);
        const nextBadges = new Set(profil.badges);

        // --- RÈGLE 1 : AMBASSADEUR_LOCAL (Score > 1000) ---
        if (profil.lBarakaScore >= 1000) {
            nextBadges.add('AMBASSADEUR_LOCAL');
        }

        // --- RÈGLES BASÉES SUR L'HISTORIQUE DES TRANSACTIONS ---
        // On récupère quelques stats utiles
        const stats = await prisma.transaction.aggregate({
            where: { 
                OR: [{ preteurId: userId }, { emprunteurId: userId }],
                statut: 'TERMINEE'
            },
            _count: true,
        });

        // --- RÈGLE 2 : CHAMPION_ECO (10+ transactions terminées) ---
        if (stats._count >= 10) {
            nextBadges.add('CHAMPION_ECO');
        }

        // Vérification des dons en tant que prêteur
        const donCount = await prisma.transaction.count({
            where: {
                preteurId: userId,
                statut: 'TERMINEE',
                annonce: { mode: 'DON_GRATUIT' }
            }
        });

        // --- RÈGLE 3 : DONATEUR_BARAKA (1+ don terminé) ---
        if (donCount >= 1) {
            nextBadges.add('DONATEUR_BARAKA');
        }

        // Vérification Food Rescue
        const foodRescueCount = await prisma.transaction.count({
            where: {
                preteurId: userId,
                statut: 'TERMINEE',
                annonce: { estFoodRescue: true }
            }
        });

        // --- RÈGLE 4 : SAUVEUR_ALIMENTAIRE (1+ food rescue terminé) ---
        if (foodRescueCount >= 1) {
            nextBadges.add('SAUVEUR_ALIMENTAIRE');
        }

        // Vérification Voisin de Confiance (5+ emprunts sans retard ni dégats)
        const cleanEmprunts = await prisma.transaction.count({
            where: {
                emprunteurId: userId,
                statut: 'TERMINEE',
                retard: 0,
                degats: false
            }
        });

        // --- RÈGLE 5 : VOISIN_DE_CONFIANCE ---
        if (cleanEmprunts >= 5) {
            nextBadges.add('VOISIN_DE_CONFIANCE');
        }

        // Vérification Location Solidaire
        const locationCount = await prisma.transaction.count({
            where: {
                preteurId: userId,
                statut: 'TERMINEE',
                annonce: { mode: 'LOCATION_SOLIDAIRE' }
            }
        });

        // --- RÈGLE 6 : GARANT_SOLIDAIRE ---
        if (locationCount >= 1) {
            nextBadges.add('GARANT_SOLIDAIRE');
        }

        // Si de nouveaux badges ont été ajoutés, on met à jour le profil
        if (nextBadges.size > currentBadges.size) {
            await prisma.profil.update({
                where: { utilisateurId: userId },
                data: {
                    badges: Array.from(nextBadges)
                }
            });
            // déclencher une notification "Bravo, nouveau badge !"
            await this.notificationService.create(
                userId,
                '🎉 Bravo ! Nouveau badge débloqué !',
                `Félicitations ! Vous avez obtenu le badge "${Array.from(nextBadges).pop()}" pour votre activité sur LBaraka.`
            );

        }
    }
}
