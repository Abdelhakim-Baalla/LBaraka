import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO pour la connexion
export class LoginDto {
  // Nettoyer l'email (espaces, minuscules)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;
}
