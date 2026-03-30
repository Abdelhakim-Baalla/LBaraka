import { CategorieAnnonce, ConditionAnnonce, ModeEchange } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsNumber,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';

// DTO pour modifier une annonce
export class UpdateAnnonceDto {
    @IsOptional()
    @IsString()
    titre?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(CategorieAnnonce)
    categorie?: CategorieAnnonce;

    @IsOptional()
    @IsEnum(ModeEchange)
    mode?: ModeEchange;

    @IsOptional()
    @IsEnum(ConditionAnnonce)
    condition?: ConditionAnnonce;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    prixSymbolique?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    montantCaution?: number;

    @IsOptional()
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value.map((entry) => Number(entry));
        }

        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.map((entry) => Number(entry));
                }
            } catch {
                return value.split(',').map((entry) => Number(entry.trim()));
            }
        }

        return value;
    })
    @IsArray()
    geolocalisation?: number[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(3)
    photos?: string[];

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    photosBase64?: Array<{ name: string; type: string; base64: string; index?: number }>;
}
