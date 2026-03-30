import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RoleUtilisateur, NiveauTier, Langue, TypeBadge } from '@prisma/client';
import * as bcrypt from 'bcrypt';

function getDatabaseUrl(): string {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL est manquante dans le fichier .env');
    }

    return databaseUrl;
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = 'abdelhakimbaalla50@gmail.com';
const ADMIN_PASSWORD = 'password123';

async function getFreeTelephone(base: string): Promise<string> {
    const existing = await prisma.user.findUnique({ where: { telephone: base } });
    if (!existing) {
        return base;
    }

    for (let i = 1; i < 1000; i++) {
        const suffix = String(i).padStart(3, '0');
        const candidate = `${base.slice(0, 7)}${suffix}`;
        const used = await prisma.user.findUnique({ where: { telephone: candidate } });
        if (!used) {
            return candidate;
        }
    }

    return `06${Date.now().toString().slice(-8)}`;
}

async function seedAdmin() {
    const motDePasseHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    let user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!user) {
        const telephone = await getFreeTelephone('0699999999');

        user = await prisma.user.create({
            data: {
                email: ADMIN_EMAIL,
                motDePasseHash,
                telephone,
                role: RoleUtilisateur.ADMINISTRATEUR,
                emailVerified: true,
                telephoneVerified: true,
            },
        });

        console.log('Admin user created:', user.email);
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                motDePasseHash,
                role: RoleUtilisateur.ADMINISTRATEUR,
                emailVerified: true,
                telephoneVerified: true,
            },
        });

        console.log('Admin user already exists, role/password refreshed:', user.email);
    }

    const profile = await prisma.profil.findUnique({ where: { utilisateurId: user.id } });

    if (!profile) {
        await prisma.profil.create({
            data: {
                utilisateurId: user.id,
                nom: 'Admin',
                prenom: 'LBaraka',
                cin: null,
                adresseComplete: 'Casablanca',
                ville: 'Casablanca',
                lBarakaScore: 999999999,
                palier: NiveauTier.LEGENDE,
                langueInterface: Langue.FRANCAIS,
                badges: [TypeBadge.BIENVENUE, TypeBadge.CHAMPION_ECO, TypeBadge.AMBASSADEUR_LOCAL],
            },
        });

        console.log('Admin profile created');
    } else {
        await prisma.profil.update({
            where: { utilisateurId: user.id },
            data: {
                lBarakaScore: 999999999,
                palier: NiveauTier.LEGENDE,
            },
        });

        console.log('Admin profile updated with high score');
    }

    const wallet = await prisma.portefeuille.findUnique({ where: { utilisateurId: user.id } });

    if (!wallet) {
        await prisma.portefeuille.create({
            data: {
                utilisateurId: user.id,
                soldeReel: '999999999999.99',
                soldeBloque: '0',
                devise: 'MAD',
            },
        });

        console.log('Admin wallet created with high balance');
    } else {
        await prisma.portefeuille.update({
            where: { utilisateurId: user.id },
            data: {
                soldeReel: '999999999999.99',
            },
        });

        console.log('Admin wallet updated with high balance');
    }
}

seedAdmin()
    .catch((error) => {
        console.error('Admin seeder failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
