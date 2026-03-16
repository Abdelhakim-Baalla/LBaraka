import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { CategorieAnnonce } from '@prisma/client';
import { AnnonceService } from './annonce.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('annonces')
export class AnnonceController {
    constructor(private readonly annonceService: AnnonceService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query('categorie') categorie?: CategorieAnnonce) {
        return this.annonceService.findAll(categorie);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FilesInterceptor('photos', 3, {
            storage: memoryStorage(),
        }),
    )
    async create(
        @Req() req: Request,
        @Body() dto: CreateAnnonceDto,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        if (!files || files.length !== 3) {
            throw new BadRequestException('Vous devez telecharger exactement 3 photos');
        }

        const user = req.user as { userId: string };
        return this.annonceService.create(user.userId, dto, files);
    }
}

