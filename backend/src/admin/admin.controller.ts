import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * RÉCUPÉRER TOUTES LES STATISTIQUES (RÉSERVÉ AUX ADMINS)
   * Impact social : CO2, Nourriture sauvée, etc.
   */
  @Get('stats')
  @Roles(RoleUtilisateur.ADMINISTRATEUR)
  async getStats() {
    return this.adminService.getStats();
  }
}
