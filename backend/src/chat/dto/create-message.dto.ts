import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  contenu!: string;

  @IsString()
  @IsNotEmpty()
  expediteurId!: string;

  @IsString()
  @IsNotEmpty()
  destinataireId!: string;

  @IsOptional()
  @IsString()
  urlNoteVocale?: string;
}

