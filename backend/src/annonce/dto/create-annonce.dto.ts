import { CategorieAnnonce, ConditionAnnonce, ModeEchange } from '@prisma/client';
import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
    IsBoolean,
    ArrayMinSize,
    ArrayMaxSize,
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const BLOCKED_DEFAULT_LAT = 33.5731;
const BLOCKED_DEFAULT_LNG = -7.5898;
const EPSILON = 0.000001;

function IsValidGeoPoint(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isValidGeoPoint',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    if (!Array.isArray(value) || value.length !== 2) {
                        return false;
                    }

                    const [lat, lng] = value;
                    if (typeof lat !== 'number' || typeof lng !== 'number') {
                        return false;
                    }

                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        return false;
                    }

                    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                        return false;
                    }

                    const isBlockedDefault =
                        Math.abs(lat - BLOCKED_DEFAULT_LAT) < EPSILON &&
                        Math.abs(lng - BLOCKED_DEFAULT_LNG) < EPSILON;

                    return !isBlockedDefault;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} doit contenir une vraie position GPS au format [latitude, longitude]`;
                },
            },
        });
    };
}

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
    @IsValidGeoPoint()
    geolocalisation: number[];

    @IsArray()
    @ArrayMinSize(3, { message: 'Vous devez inclure exactement 3 photos' })
    @ArrayMaxSize(3, { message: 'Vous devez inclure exactement 3 photos' })
    photosBase64: Array<{ name: string; type: string; base64: string }>;
}

