import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { RegisterDto } from '../utilisateur/dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Service pour l'authentification
@Injectable()
export class AuthService {
    constructor(
        private readonly utilisateurService: UtilisateurService,
        private readonly jwtService: JwtService,
    ) {}

    // Inscription d'un nouvel utilisateur
    async register(dto: RegisterDto) {
        const utilisateur = await this.utilisateurService.register(dto);
        
        // Générer le token JWT
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

    // Connexion d'un utilisateur
    async login(dto: LoginDto) {
        // Rechercher l'utilisateur par email
        const utilisateur = await this.utilisateurService.findByEmail(dto.email);

        if (!utilisateur) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        // Vérifier le mot de passe
        const motDePasseValide = await bcrypt.compare(
            dto.motDePasse,
            utilisateur.motDePasseHash,
        );

        if (!motDePasseValide) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        // Générer le token JWT
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

    // Déconnexion (le token est géré côté client)
    async logout() {
        return { message: 'Déconnexion réussie' };
    }

    // Récupérer l'utilisateur connecté
    async getMe(userId: string) {
        const utilisateur = await this.utilisateurService.findById(userId);

        if (!utilisateur) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        return {
            utilisateur: this.utilisateurService.sanitizeUser(utilisateur),
        };
    }
}
