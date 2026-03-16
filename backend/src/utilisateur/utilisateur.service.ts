import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class UtilisateurService {
    constructor(private readonly prisma: PrismaService) {}

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
                        lBarakaScore: 0,
                        palier: 'BRONZE',
                        langueInterface: 'FRANCAIS',
                        badges: [],
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
}
