import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';

export class UpdateAnnonceDto {
    @IsOptional()
    @IsString()
    titre?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(['POUSSETTE', 'BRICOLAGE', 'MEDICAL', 'EVENEMENTIEL', 'NOURRITURE', 'AUTRE'])
    categorie?: string;

    @IsOptional()
    @IsEnum(['DON_GRATUIT', 'PRET_TEMPORAIRE', 'LOCATION_SOLIDAIRE'])
    mode?: string;

    @IsOptional()
    @IsEnum(['NEUF', 'BON_ETAT', 'USE'])
    condition?: string;

    @IsOptional()
    @IsNumber()
    prixSymbolique?: number;

    @IsOptional()
    @IsNumber()
    montantCaution?: number;

    @IsOptional()
    @IsArray()
    geolocalisation?: number[];
}
