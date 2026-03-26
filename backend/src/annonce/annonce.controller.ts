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

@Controller('annonces')
export class AnnonceController {
    constructor(private readonly annonceService: AnnonceService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('categorie') categorie?: CategorieAnnonce) {
        return this.annonceService.findAll(categorie);
    }

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

    @Get('food-rescue')
    @UseGuards(JwtAuthGuard)
    async findFoodRescue() {
        return this.annonceService.findFoodRescue();
    }

    /**
     * GET /annonces/mes-annonces — Mes annonces
     */
    @Get('mes-annonces')
    @UseGuards(JwtAuthGuard)
    async findMyAnnonces(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.annonceService.findMyAnnonces(user.userId);
    }

    /**
     * GET /annonces/:id — Détail d'une annonce
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.annonceService.findById(id);
    }

    /**
     * Route pour créer une annonce Food Rescue.
     * SEULS les PARTENAIRES peuvent créer ce type d'annonce.
     */
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

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(
        @Req() req: Request,
        @Body() dto: CreateAnnonceDto,
    ) {
        const user = req.user as { userId: string; role: RoleUtilisateur };
        return this.annonceService.create(user.userId, user.role, dto);
    }

    /**
     * PUT /annonces/:id — Modifier une annonce
     */
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

    /**
     * DELETE /annonces/:id — Supprimer une annonce
     */
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
