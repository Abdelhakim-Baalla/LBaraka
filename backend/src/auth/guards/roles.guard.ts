import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleUtilisateur } from '@prisma/client';

/**
 * Guard qui vérifie que l'utilisateur a le rôle requis pour accéder à la route.
 * Utilisé avec le décorateur @Roles('PARTENAIRE') ou @Roles('ADMINISTRATEUR')
 * 
 * Gère les variantes de rôles : PARTENAIRE = PARTENAIRES, ADMINISTRATEUR = PARTENAIRE_ADMIN = PARTENAIRE_SUPER_ADMIN
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    private normalizeRole(role: string): string {
        if (!role) return role;
        
        // Normaliser PARTENAIRE (gère les variantes avec S et _ADMIN)
        if (role === 'PARTENAIRE' || 
            role === 'PARTENAIRES' || 
            role === 'PARTENAIRE_ADMIN' || 
            role === 'PARTENAIRE_SUPER_ADMIN') {
            return 'PARTENAIRE';
        }
        
        // Normaliser ADMINISTRATEUR
        if (role === 'ADMINISTRATEUR' || 
            role === 'POINT_RELAIS_ADMIN' || 
            role === 'POINT_RELAIS_SUPER_ADMIN') {
            return 'ADMINISTRATEUR';
        }
        
        // Normaliser POINT_RELAIS
        if (role === 'POINT_RELAIS') {
            return 'POINT_RELAIS';
        }
        
        return role;
    }

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

        // Normaliser le rôle de l'utilisateur
        const userRoleNormalized = this.normalizeRole(user.role);
        
        // Vérifier si l'utilisateur a un des rôles requis (après normalisation)
        const hasRole = requiredRoles.some(requiredRole => {
            const normalizedRequired = this.normalizeRole(requiredRole);
            return userRoleNormalized === normalizedRequired;
        });

        if (!hasRole) {
            // Log pour debug
            console.log(`[RolesGuard] Accès refusé pour le rôle '${user.role}' (normalisé: '${userRoleNormalized}')`);
            console.log(`[RolesGuard] Rôles requis: ${requiredRoles.join(', ')}`);
            throw new ForbiddenException(
                `Accès refusé : vous devez avoir le rôle ${requiredRoles.join(' ou ')}. Rôle actuel: ${user.role}`
            );
        }

        return true;
    }
}
