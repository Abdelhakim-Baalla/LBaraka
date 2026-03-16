import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { RegisterDto } from '../utilisateur/dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly utilisateurService: UtilisateurService,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const utilisateur = await this.utilisateurService.register(dto);
        const token = this.jwtService.sign({
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role,
        });

        return {
            message: 'Inscription réussie. Bienvenue dans la communauté LBaraka !',
            accessToken: token,
            utilisateur,
        };
    }

    async login(dto: LoginDto) {
        const utilisateur = await this.utilisateurService.findByEmail(dto.email);

        if (!utilisateur) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const motDePasseValide = await bcrypt.compare(
            dto.motDePasse,
            utilisateur.motDePasseHash,
        );

        if (!motDePasseValide) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const token = this.jwtService.sign({
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role,
        });

        return {
            message: 'Connexion réussie',
            accessToken: token,
            utilisateur: this.utilisateurService.sanitizeUser(utilisateur),
        };
    }
}
