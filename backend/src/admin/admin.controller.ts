import { Controller, Get, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

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

  // Récupérer un utilisateur par ID
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID (admin)' })
  @ApiResponse({ status: 200, description: 'Détails utilisateur' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  // Modifier le profil d'un utilisateur
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Modifier le profil d\'un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Profil modifié' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Put('users/:id/profile')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.adminService.updateUserProfile(id, dto);
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

  // Supprimer un utilisateur
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un utilisateur (admin)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 403, description: 'Réservé aux administrateurs' })
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Récupérer toutes les transactions
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer toutes les transactions (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Liste des transactions' })
  @Get('transactions')
  async getAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.adminService.getAllTransactions(pageNum, limitNum);
  }

  // Récupérer une transaction par ID
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer une transaction par ID (admin)' })
  @ApiResponse({ status: 200, description: 'Détails transaction' })
  @Get('transactions/:id')
  async getTransactionById(@Param('id') id: string) {
    return this.adminService.getTransactionById(id);
  }

  // Récupérer toutes les annonces
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer toutes les annonces (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Liste des annonces' })
  @Get('annonces')
  async getAllAnnonces(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.adminService.getAllAnnonces(pageNum, limitNum);
  }

  // Supprimer une annonce
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer une annonce (admin)' })
  @ApiResponse({ status: 200, description: 'Annonce supprimée' })
  @Delete('annonces/:id')
  async deleteAnnonce(@Param('id') id: string) {
    return this.adminService.deleteAnnonce(id);
  }

  // Récupérer tous les points relais
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer tous les points relais (admin)' })
  @ApiResponse({ status: 200, description: 'Liste des points relais' })
  @Get('points-relais')
  async getAllPointsRelais() {
    return this.adminService.getAllPointsRelais();
  }
}
