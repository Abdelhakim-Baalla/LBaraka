import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoleUtilisateur } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(RoleUtilisateur)
  @IsNotEmpty()
  role: RoleUtilisateur;
}
