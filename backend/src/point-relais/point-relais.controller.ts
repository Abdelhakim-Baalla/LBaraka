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
import { PointRelaisService } from './point-relais.service';
import { CreatePointRelaisDto } from './dto/create-point-relais.dto';
import { UpdatePointRelaisDto } from './dto/update-point-relais.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur, TypeRelais } from '@prisma/client';

// Routes pour les points relais
@Controller('points-relais')
@UseGuards(JwtAuthGuard)
export class PointRelaisController {
  constructor(private readonly pointRelaisService: PointRelaisService) {}

  // Récupérer tous les points relais
  @Get()
  async findAll() {
    const points = await this.pointRelaisService.findAll();
    return { points };
  }

  // Récupérer les points relais proches
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
  @Get('types')
  async getTypes() {
    const types = this.pointRelaisService.getTypes();
    return { types };
  }

  // Récupérer un point relais par ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const point = await this.pointRelaisService.findById(id);
    return { point };
  }

  // Créer un nouveau point relais (admin seulement)
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async create(@Body() dto: CreatePointRelaisDto) {
    return this.pointRelaisService.create(dto);
  }

  // Modifier un point relais (admin seulement)
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async update(@Param('id') id: string, @Body() dto: UpdatePointRelaisDto) {
    return this.pointRelaisService.update(id, dto);
  }

  // Supprimer un point relais (admin seulement)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async remove(@Param('id') id: string) {
    return this.pointRelaisService.remove(id);
  }
}
