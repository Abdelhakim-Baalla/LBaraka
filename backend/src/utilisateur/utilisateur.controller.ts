import { Controller, Get, Put, Body, Req, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurService } from './utilisateur.service';
import { UpdateProfilDto } from './dto/update-profil.dto';
import { Request } from 'express';

@ApiTags('Utilisateurs')
@Controller('utilisateurs')
@UseGuards(JwtAuthGuard)
export class UtilisateurController {
    constructor(private readonly utilisateurService: UtilisateurService) { }

    // Récupérer mon profil complet
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Récupérer mon profil complet' })
    @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    @Get('profil')
    async getMyProfil(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.utilisateurService.getProfilComplet(user.userId);
    }

    // Modifier mon profil
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Modifier mon profil' })
    @ApiResponse({ status: 200, description: 'Profil modifié avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @Put('profil')
    async updateMyProfil(@Req() req: Request, @Body() dto: UpdateProfilDto) {
        const user = req.user as { userId: string };
        return this.utilisateurService.updateProfil(user.userId, dto);
    }

    // Voir le profil public d'un utilisateur
    @ApiOperation({ summary: 'Voir le profil public d\'un utilisateur' })
    @ApiResponse({ status: 200, description: 'Profil public récupéré' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    @Get(':id')
    async getPublicProfil(@Param('id') userId: string) {
        return this.utilisateurService.getProfilPublic(userId);
    }
}
