import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePointRelaisDto } from './dto/create-point-relais.dto';
import { UpdatePointRelaisDto } from './dto/update-point-relais.dto';
import { TypeRelais } from '@prisma/client';
import { haversineKm } from '../common/utils/geo.util';

// Service pour gérer les points relais
@Injectable()
export class PointRelaisService {
  constructor(private readonly prisma: PrismaService) {}

  // Créer un nouveau point relais
  async create(dto: CreatePointRelaisDto) {
    try {
      return await this.prisma.pointRelais.create({
        data: dto,
      });
    } catch (error) {
      throw new InternalServerErrorException('Impossible de créer le point relais');
    }
  }

  // Récupérer tous les points relais
  async findAll() {
    try {
      return await this.prisma.pointRelais.findMany({
        orderBy: { nom: 'asc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Impossible de récupérer les points relais');
    }
  }

  // Récupérer les points relais proches
  async findNearby(lat: number, lng: number, rayon: number, type?: TypeRelais) {
    try {
      const points = await this.prisma.pointRelais.findMany({
        where: {
          ...(type && { type }),
        },
      });

      // Calculer les distances et trier
      const result = points
        .filter((p) => p.geolocalisation && p.geolocalisation.length >= 2)
        .map((p) => ({
          ...p,
          distance: Math.round(haversineKm(lat, lng, p.geolocalisation[0], p.geolocalisation[1]) * 10) / 10,
        }))
        .filter((p) => p.distance <= rayon)
        .sort((a, b) => a.distance - b.distance);

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Impossible de rechercher les points relais à proximité');
    }
  }

  // Récupérer un point relais par ID
  async findById(id: string) {
    const point = await this.prisma.pointRelais.findUnique({
      where: { id },
    });
    if (!point) {
      throw new NotFoundException('Point relais non trouvé');
    }
    return point;
  }

  // Modifier un point relais
  async update(id: string, dto: UpdatePointRelaisDto) {
    try {
      const point = await this.findById(id);
      return await this.prisma.pointRelais.update({
        where: { id: point.id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de modifier le point relais');
    }
  }

  // Supprimer un point relais
  async remove(id: string) {
    try {
      const point = await this.findById(id);
      await this.prisma.pointRelais.delete({
        where: { id: point.id },
      });
      return { message: 'Point relais supprimé avec succès' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Impossible de supprimer le point relais');
    }
  }

  // Récupérer les types de points relais
  getTypes() {
    return [
      { code: 'HANOUT', label: 'Hanout (Commerce de proximité)' },
      { code: 'MOSQUEE', label: 'Mosquée' },
      { code: 'ASSOCIATION_QUARTIER', label: 'Association de quartier' },
    ];
  }
}
