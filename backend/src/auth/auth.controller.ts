import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from '../utilisateur/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // Inscription
    @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
    @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    // Connexion
    @ApiOperation({ summary: 'Connexion utilisateur' })
    @ApiResponse({ status: 200, description: 'Connexion réussie' })
    @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Déconnexion
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Déconnexion utilisateur' })
    @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout() {
        return this.authService.logout();
    }

    // Récupérer mon profil
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Récupérer mon profil' })
    @ApiResponse({ status: 200, description: 'Profil récupéré' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() req: Request) {
        return this.authService.getMe((req.user as any).userId);
    }
}
