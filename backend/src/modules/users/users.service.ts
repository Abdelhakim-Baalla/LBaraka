import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfilsService } from '../profils/profils.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private profilsService: ProfilsService,
    ) {}

    async create(createUserDto: CreateUserDto) {
        const { email, telephone, motDePasse, nom, prenom } = createUserDto;

        // 1. Vérifier si l'email existe déjà
        const existingEmail = await this.usersRepository.findOne({
            where: { email },
        });
        if (existingEmail) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        // 2. Vérifier si le téléphone existe déjà
        const existingPhone = await this.usersRepository.findOne({
            where: { telephone },
        });
        if (existingPhone) {
            throw new ConflictException('Ce téléphone est déjà utilisé');
        }

        // 3. Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(motDePasse, salt);

        // 4. Créer le profil initial (score = 0)
        const profil = await this.profilsService.createProfilInitial(nom, prenom);

        // 5. Créer l'utilisateur
        const user = this.usersRepository.create({
            email,
            telephone,
            motDePasse: hashedPassword,
            profil,
        });

        try {
            await this.usersRepository.save(user);
            return {
                success: true,
                message: 'Inscription réussie ! Bienvenue dans LBaraka',
                data: {
                    id: user.id,
                    email: user.email,
                    telephone: user.telephone,
                    profil: {
                        nom: profil.nom,
                        prenom: profil.prenom,
                        score: profil.LBarakaScore,
                        palier: profil.palier,
                        badges: profil.badges,
                    },
                },
            };
        } catch (error) {
            throw new InternalServerErrorException(
                'Erreur lors de l\'inscription',
            );
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }
}