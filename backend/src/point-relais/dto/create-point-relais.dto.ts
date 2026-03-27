import { IsString, IsNotEmpty, IsEnum, IsInt, IsArray, IsOptional, Min } from 'class-validator';
import { TypeRelais } from '@prisma/client';

// DTO pour créer un point relais
export class CreatePointRelaisDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsEnum(TypeRelais)
  @IsNotEmpty()
  type: TypeRelais;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  capaciteStockage: number;

  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsArray()
  @IsNotEmpty()
  geolocalisation: number[];

  @IsArray()
  @IsOptional()
  horaires?: string[];

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsString()
  @IsOptional()
  photo?: string;
}
