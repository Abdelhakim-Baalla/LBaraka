import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

// DTO pour modifier le profil
export class UpdateProfilDto {
    @IsOptional()
    @IsString()
    nom?: string;

    @IsOptional()
    @IsString()
    prenom?: string;

    @IsOptional()
    @IsString()
    adresseComplete?: string;

    @IsOptional()
    @IsString()
    ville?: string;

    @IsOptional()
    @IsString()
    photoProfil?: string;

    @IsOptional()
    @IsDateString()
    dateNaissance?: string;

    @IsOptional()
    @IsEnum(['ARABE', 'FRANCAIS', 'AMAZIGH', 'BILINGUE'])
    langueInterface?: string;
}
