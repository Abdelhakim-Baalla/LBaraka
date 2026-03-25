import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleUtilisateur } from '@prisma/client';

/**
 * Guard qui vérifie que l'utilisateur a le rôle requis pour accéder à la route.
 * Utilisé avec le décorateur @Roles('PARTENAIRE') ou @Roles('ADMINISTRATEUR')
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Récupérer les rôles requis (définis par le décorateur @Roles)
        const requiredRoles = this.reflector.getAllAndOverride<RoleUtilisateur[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si aucun rôle n'est requis, autoriser l'accès
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Récupérer l'utilisateur depuis la request
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Vérifier que l'utilisateur existe et a un rôle
        if (!user || !user.role) {
            throw new ForbiddenException('Accès refusé : rôle non identifié');
        }

        // Vérifier si l'utilisateur a un des rôles requis
        const hasRole = requiredRoles.includes(user.role);

        if (!hasRole) {
            throw new ForbiddenException(
                `Accès refusé : vous devez avoir le rôle ${requiredRoles.join(' ou ')}`
            );
        }

        return true;
    }
}
