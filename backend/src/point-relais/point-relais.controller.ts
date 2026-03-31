import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PointRelaisService } from './point-relais.service';
import { CreatePointRelaisDto } from './dto/create-point-relais.dto';
import { UpdatePointRelaisDto } from './dto/update-point-relais.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur, TypeRelais } from '@prisma/client';

@ApiTags('Point-Relais')
@Controller('points-relais')
@UseGuards(JwtAuthGuard)
export class PointRelaisController {
  constructor(private readonly pointRelaisService: PointRelaisService) { }

  // Récupérer tous les points relais
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer tous les points relais' })
  @ApiResponse({ status: 200, description: 'Liste des points relais' })
  @Get()
  async findAll() {
    const points = await this.pointRelaisService.findAll();
    return { points };
  }

  // Récupérer les points relais proches
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer les points relais proches' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  @ApiQuery({ name: 'rayon', required: false, description: 'Rayon en km (défaut: 10)' })
  @ApiQuery({ name: 'type', required: false, enum: ['DEPOT', 'RECEPTION', 'RETrait', 'LES_DEUX'] })
  @ApiResponse({ status: 200, description: 'Points relais proches' })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('rayon') rayon?: string,
    @Query('type') type?: TypeRelais,
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new BadRequestException('lat et lng sont requis');
    }

    const rayonKm = rayon ? parseFloat(rayon) : 10;
    const points = await this.pointRelaisService.findNearby(latNum, lngNum, rayonKm, type);
    return { points };
  }

  // Récupérer les types de points relais
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer les types de points relais' })
  @ApiResponse({ status: 200, description: 'Types disponibles' })
  @Get('types')
  async getTypes() {
    const types = this.pointRelaisService.getTypes();
    return { types };
  }

  // Récupérer un point relais par ID
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer un point relais par ID' })
  @ApiResponse({ status: 200, description: 'Point relais trouvé' })
  @ApiResponse({ status: 404, description: 'Point relais non trouvé' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const point = await this.pointRelaisService.findById(id);
    return { point };
  }

  // Créer un nouveau point relais (admin seulement)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer un nouveau point relais (admin)' })
  @ApiResponse({ status: 201, description: 'Point relais créé' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async create(@Body() dto: CreatePointRelaisDto) {
    return this.pointRelaisService.create(dto);
  }

  // Modifier un point relais (admin seulement)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Modifier un point relais (admin)' })
  @ApiResponse({ status: 200, description: 'Point relais modifié' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async update(@Param('id') id: string, @Body() dto: UpdatePointRelaisDto) {
    return this.pointRelaisService.update(id, dto);
  }

  // Supprimer un point relais (admin seulement)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un point relais (admin)' })
  @ApiResponse({ status: 200, description: 'Point relais supprimé' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async remove(@Param('id') id: string) {
    return this.pointRelaisService.remove(id);
  }
}
