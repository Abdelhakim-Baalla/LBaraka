import { Controller, Get, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleUtilisateur.ADMINISTRATEUR)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // Récupérer les statistiques globales
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer les statistiques globales (admin)' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  // Récupérer la liste des utilisateurs
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer la liste des utilisateurs (admin)' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre par page' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom/email' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
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

  // Modifier le rôle d'un utilisateur
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Modifier le rôle d\'un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Rôle modifié' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Put('users/:id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  // Bloquer ou débloquer un utilisateur
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bloquer ou débloquer un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Statut modifié' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Put('users/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto.isBlocked);
  }
}
