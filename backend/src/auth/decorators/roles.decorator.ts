import { SetMetadata } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';

/**
 * Décorateur pour spécifier les rôles requis pour accéder à une route.
 * Utilisation: @Roles('PARTENAIRE') ou @Roles('ADMINISTRATEUR')
 * 
 * @example
 * @Post('food-rescue')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('PARTENAIRE')
 * async createFoodRescue(...) { }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleUtilisateur[]) => SetMetadata(ROLES_KEY, roles);
