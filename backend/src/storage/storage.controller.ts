import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    // Route proxy publique pour télécharger les images MinIO via le backend
    @Get('images')
    async getImage(
        @Query('path') objectPath: string,
        @Res() res: Response,
    ) {
        try {
            if (!objectPath) {
                throw new BadRequestException('Le parametre path est requis');
            }

            if (!objectPath.startsWith('lbaraka-annonces/')) {
                throw new BadRequestException('Path non autorise');
            }

            const buffer = await this.storageService.getFileBuffer(objectPath);

            let contentType = 'image/jpeg';
            const lowerPath = objectPath.toLowerCase();
            if (lowerPath.endsWith('.png')) {
                contentType = 'image/png';
            } else if (lowerPath.endsWith('.webp')) {
                contentType = 'image/webp';
            }

            res.set('Content-Type', contentType);
            res.set('Cache-Control', 'public, max-age=31536000');
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type');

            res.send(buffer);
        } catch (error) {
            console.error('Image fetch error:', error);
            res.status(404).json({ message: 'Image non trouvée' });
        }
    }
}
