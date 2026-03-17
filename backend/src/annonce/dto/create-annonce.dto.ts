import { CategorieAnnonce, ConditionAnnonce, ModeEchange } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsString, ArrayMinSize, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateAnnonceDto {
    @IsString()
    @IsNotEmpty()
    titre: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEnum(CategorieAnnonce)
    categorie: CategorieAnnonce;

    @IsEnum(ModeEchange)
    mode: ModeEchange;

    @IsEnum(ConditionAnnonce)
    condition: ConditionAnnonce;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    prixSymbolique?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    montantCaution?: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    estFoodRescue?: boolean;

    @IsOptional()
    dateExpiration?: string;

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
                return value
                    .split(',')
                    .map((entry) => Number(entry.trim()));
            }
        }

        return value;
    })
    @IsArray()
    @ArrayMinSize(2)
    geolocalisation: number[];
}

