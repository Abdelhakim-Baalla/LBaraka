import {
    BadRequestException,
    Body,
    Controller,
    Post,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { Request } from 'express';
import { AnnonceService } from './annonce.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const uploadDirectory = join(process.cwd(), 'uploads', 'annonces');

@Controller('annonces')
export class AnnonceController {
    constructor(private readonly annonceService: AnnonceService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FilesInterceptor('photos', 10, {
            storage: diskStorage({
                destination: (_req, _file, callback) => {
                    mkdirSync(uploadDirectory, { recursive: true });
                    callback(null, uploadDirectory);
                },
                filename: (_req, file, callback) => {
                    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
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
        const photos = files.map((file) => `/uploads/annonces/${file.filename}`);

        return this.annonceService.create(user.userId, dto, photos);
    }
}

