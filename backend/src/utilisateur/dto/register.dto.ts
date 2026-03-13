import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    motDePasse!: string;

    @Transform(({ value }) => typeof value === 'string' ? value.replace(/[\s-]/g, '') : value)
    @IsString()
    @IsNotEmpty()
    @Matches(/^(\+212|0)[5-7]\d{8}$/, {
        message: 'Numéro de téléphone marocain invalide',
    })
    telephone!: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toUpperCase().replace(/\s+/g, '') : value,
    )
    @IsOptional()
    @IsString()
    @Matches(/^[A-Z]{1,2}\d{1,6}$/, {
        message: 'Format de CIN invalide',
    })
    cin?: string;
}
