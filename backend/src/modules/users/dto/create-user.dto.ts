import {
    IsString,
    IsEmail,
    IsNotEmpty,
    MinLength,
    Matches,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'Le nom est obligatoire' })
    nom: string;

    @IsString()
    @IsNotEmpty({ message: 'Le prénom est obligatoire' })
    prenom: string;

    @IsEmail({}, { message: 'Format email invalide' })
    @IsNotEmpty({ message: "L'email est obligatoire" })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Le téléphone est obligatoire' })
    @Matches(/^(\+212|0)[6-7][0-9]{8}$/, {
        message: 'Numéro marocain invalide (ex: 0612345678 ou +212612345678)',
    })
    telephone: string;

    @IsString()
    @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
    @MinLength(8, { message: 'Minimum 8 caractères' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'Doit contenir 1 majuscule et 1 chiffre',
    })
    motDePasse: string;
}