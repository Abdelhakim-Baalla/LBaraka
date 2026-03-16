import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { RegisterDto } from '../utilisateur/dto/register.dto';

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
}
