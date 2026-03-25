import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur, TypeRelais } from '@prisma/client';
import { haversineKm } from '../common/utils/geo.util';

@Controller('points-relais')
@UseGuards(JwtAuthGuard)
export class PointRelaisController {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Récupérer tous les points relais
     */
    @Get()
    async findAll() {
        const points = await this.prisma.pointRelais.findMany({
            orderBy: { nom: 'asc' },
        });
        return { points };
    }

    /**
     * Récupérer les points relais à proximité
     */
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
            throw new Error('lat et lng sont requis');
        }

        const rayonKm = rayon ? parseFloat(rayon) : 10;

        const points = await this.prisma.pointRelais.findMany({
            where: {
                ...(type && { type }),
            },
        });

        const result = points
            .filter((p) => p.geolocalisation && p.geolocalisation.length >= 2)
            .map((p) => ({
                ...p,
                distance: Math.round(haversineKm(latNum, lngNum, p.geolocalisation[0], p.geolocalisation[1]) * 10) / 10,
            }))
            .filter((p) => p.distance <= rayonKm)
            .sort((a, b) => a.distance - b.distance);

        return { points: result };
    }

    /**
     * Créer un point relais (Admin ou Partenaire uniquement)
     */
    @Get('types')
    async getTypes() {
        return {
            types: [
                { code: 'HANOUT', label: 'Hanout (Commerce de proximité)' },
                { code: 'MOSQUEE', label: 'Mosquée' },
                { code: 'ASSOCIATION_QUARTIER', label: 'Association de quartier' },
            ],
        };
    }
}
