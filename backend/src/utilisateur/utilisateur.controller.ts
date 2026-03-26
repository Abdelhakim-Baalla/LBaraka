import { Controller, Get, Put, Body, Req, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurService } from './utilisateur.service';
import { UpdateProfilDto } from './dto/update-profil.dto';
import { Request } from 'express';

@Controller('utilisateurs')
@UseGuards(JwtAuthGuard)
export class UtilisateurController {
    constructor(private readonly utilisateurService: UtilisateurService) {}

    /**
     * GET /utilisateurs/profil — Mon profil complet
     */
    @Get('profil')
    async getMyProfil(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.utilisateurService.getProfilComplet(user.userId);
    }

    /**
     * PUT /utilisateurs/profil — Modifier mon profil
     */
    @Put('profil')
    async updateMyProfil(@Req() req: Request, @Body() dto: UpdateProfilDto) {
        const user = req.user as { userId: string };
        return this.utilisateurService.updateProfil(user.userId, dto);
    }

    /**
     * GET /utilisateurs/:id — Voir le profil public d'un utilisateur
     */
    @Get(':id')
    async getPublicProfil(@Param('id') userId: string) {
        return this.utilisateurService.getProfilPublic(userId);
    }
}
