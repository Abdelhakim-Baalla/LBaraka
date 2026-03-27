import { Controller, Get, Put, Body, Query, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUtilisateur.ADMINISTRATEUR)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * RÉCUPÉRER TOUTES LES STATISTIQUES (RÉSERVÉ AUX ADMINS)
   */
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  /**
   * LISTE DES UTILISATEURS AVEC PAGINATION ET RECHERCHE
   */
  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.adminService.getAllUsers(pageNum, limitNum, search);
  }

  /**
   * MODIFIER LE RÔLE D'UN UTILISATEUR
   */
  @Put('users/:id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  /**
   * BLOQUER / DÉBLOQUER UN UTILISATEUR
   */
  @Put('users/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto.isBlocked);
  }
}
