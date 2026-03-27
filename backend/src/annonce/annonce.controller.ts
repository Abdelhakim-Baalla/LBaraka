import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { CategorieAnnonce, RoleUtilisateur } from '@prisma/client';
import { AnnonceService } from './annonce.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Annonces')
@Controller('annonces')
export class AnnonceController {
    constructor(private readonly annonceService: AnnonceService) { }

    // Récupérer toutes les annonces
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Récupérer toutes les annonces' })
    @ApiQuery({ name: 'categorie', required: false, enum: ['ALIMENTAIRE', 'ELECTRONIQUE', 'VETEMENT', 'DOCUMENT', 'AUTRE'] })
    @ApiResponse({ status: 200, description: 'Liste des annonces' })
    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('categorie') categorie?: CategorieAnnonce) {
        return this.annonceService.findAll(categorie);
    }

    // Récupérer les annonces proches sur une carte
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Récupérer les annonces proches sur une carte' })
    @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
    @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
    @ApiQuery({ name: 'rayon', required: false, description: 'Rayon en km (défaut: 10)' })
    @ApiQuery({ name: 'categorie', required: false, enum: ['ALIMENTAIRE', 'ELECTRONIQUE', 'VETEMENT', 'DOCUMENT', 'AUTRE'] })
    @ApiResponse({ status: 200, description: 'Annonces proches' })
    @ApiResponse({ status: 400, description: 'Paramètres invalides' })
    @Get('carte')
    @UseGuards(JwtAuthGuard)
    async findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('rayon') rayon?: string,
        @Query('categorie') categorie?: CategorieAnnonce,
    ) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum)) {
            throw new BadRequestException('lat et lng sont requis et doivent être des nombres');
        }
        const rayonKm = rayon ? parseFloat(rayon) : 10;
        return this.annonceService.findNearby(latNum, lngNum, rayonKm, categorie);
    }

    // Récupérer les Food Rescue actifs
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Récupérer les Food Rescue actifs' })
    @ApiResponse({ status: 200, description: 'Liste des Food Rescue' })
    @Get('food-rescue')
    @UseGuards(JwtAuthGuard)
    async findFoodRescue() {
        return this.annonceService.findFoodRescue();
    }

    // Récupérer mes propres annonces
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Récupérer mes propres annonces' })
    @ApiResponse({ status: 200, description: 'Mes annonces' })
    @Get('mes-annonces')
    @UseGuards(JwtAuthGuard)
    async findMyAnnonces(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.annonceService.findMyAnnonces(user.userId);
    }

    // Récupérer une annonce par son ID
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Récupérer une annonce par son ID' })
    @ApiResponse({ status: 200, description: 'Annonce trouvée' })
    @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.annonceService.findById(id);
    }

    // Créer une annonce Food Rescue (réservé aux partenaires)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Créer une annonce Food Rescue (partenaires uniquement)' })
    @ApiResponse({ status: 201, description: 'Annonce créée' })
    @ApiResponse({ status: 403, description: 'Réservé aux partenaires' })
    @Post('food-rescue')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('PARTENAIRE')
    async createFoodRescue(
        @Req() req: Request,
        @Body() dto: CreateAnnonceDto,
    ) {
        const user = req.user as { userId: string; role: RoleUtilisateur };
        return this.annonceService.createFoodRescue(user.userId, user.role, dto);
    }

    // Créer une nouvelle annonce
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Créer une nouvelle annonce' })
    @ApiResponse({ status: 201, description: 'Annonce créée' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @Post()
    @UseGuards(JwtAuthGuard)
    async create(
        @Req() req: Request,
        @Body() dto: CreateAnnonceDto,
    ) {
        const user = req.user as { userId: string; role: RoleUtilisateur };
        return this.annonceService.create(user.userId, user.role, dto);
    }

    // Modifier une annonce
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Modifier une annonce' })
    @ApiResponse({ status: 200, description: 'Annonce modifiée' })
    @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Req() req: Request,
        @Param('id') id: string,
        @Body() dto: UpdateAnnonceDto,
    ) {
        const user = req.user as { userId: string };
        return this.annonceService.update(user.userId, id, dto);
    }

    // Supprimer une annonce
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Supprimer une annonce' })
    @ApiResponse({ status: 200, description: 'Annonce supprimée' })
    @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(
        @Req() req: Request,
        @Param('id') id: string,
    ) {
        const user = req.user as { userId: string };
        return this.annonceService.remove(user.userId, id);
    }
}
