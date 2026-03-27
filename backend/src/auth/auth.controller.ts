import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '../utilisateur/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

// Routes pour l'authentification
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // Inscription
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    // Connexion
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Déconnexion
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout() {
        return this.authService.logout();
    }

    // Récupérer mon profil
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() req: Request) {
        return this.authService.getMe((req.user as any).userId);
    }
}
