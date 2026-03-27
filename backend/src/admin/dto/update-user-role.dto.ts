import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoleUtilisateur } from '@prisma/client';

// DTO pour modifier le rôle d'un utilisateur
export class UpdateUserRoleDto {
  @IsEnum(RoleUtilisateur)
  @IsNotEmpty()
  role: RoleUtilisateur;
}
