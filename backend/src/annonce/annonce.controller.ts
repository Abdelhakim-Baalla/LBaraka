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
import { Request } from 'express';
import { CategorieAnnonce, RoleUtilisateur } from '@prisma/client';
import { AnnonceService } from './annonce.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { UpdateAnnonceDto } from './dto/update-annonce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Routes pour les annonces
@Controller('annonces')
export class AnnonceController {
    constructor(private readonly annonceService: AnnonceService) { }

    // Récupérer toutes les annonces
    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('categorie') categorie?: CategorieAnnonce) {
        return this.annonceService.findAll(categorie);
    }

    // Récupérer les annonces proches sur une carte
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
    @Get('food-rescue')
    @UseGuards(JwtAuthGuard)
    async findFoodRescue() {
        return this.annonceService.findFoodRescue();
    }

    // Récupérer mes propres annonces
    @Get('mes-annonces')
    @UseGuards(JwtAuthGuard)
    async findMyAnnonces(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.annonceService.findMyAnnonces(user.userId);
    }

    // Récupérer une annonce par son ID
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.annonceService.findById(id);
    }

    // Créer une annonce Food Rescue (réservé aux partenaires)
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
