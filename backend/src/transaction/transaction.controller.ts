import { Controller, Get, Post, Param, Req, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  // Réserver une annonce
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Réserver une annonce' })
  @ApiResponse({ status: 201, description: 'Réservation créée' })
  @ApiResponse({ status: 400, description: 'Annonce non disponible' })
  @Post('reserve/:annonceId')
  async reserve(@Req() req: Request, @Param('annonceId') annonceId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.reserve(user.userId, annonceId);
  }

  // Générer un QR code pour la réception
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Générer un QR code pour la réception' })
  @ApiResponse({ status: 200, description: 'QR code généré' })
  @Get(':id/qr-reception')
  async getReceptionQR(@Req() req: Request, @Param('id') transactionId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.generateReceptionQR(user.userId, transactionId);
  }

  // Valider la réception avec le QR code
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Valider la réception avec le QR code' })
  @ApiResponse({ status: 200, description: 'Réception validée' })
  @Post(':id/validate-reception')
  async validateReception(@Req() req: Request, @Param('id') transactionId: string, @Body('secret') secret: string) {
    const user = req.user as { userId: string };
    return this.transactionService.validateReceptionQR(user.userId, transactionId, secret);
  }

  // Générer un QR code pour le retour
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Générer un QR code pour le retour' })
  @ApiResponse({ status: 200, description: 'QR code généré' })
  @Get(':id/qr-retour')
  async getRetourQR(@Req() req: Request, @Param('id') transactionId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.generateRetourQR(user.userId, transactionId);
  }

  // Valider le retour avec le QR code
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Valider le retour avec le QR code' })
  @ApiResponse({ status: 200, description: 'Retour validé' })
  @Post(':id/validate-retour')
  async validateRetour(@Req() req: Request, @Param('id') transactionId: string, @Body('secret') secret: string) {
    const user = req.user as { userId: string };
    return this.transactionService.validateRetourQR(user.userId, transactionId, secret);
  }

  // Confirmer le retour de l'objet
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirmer le retour de l\'objet' })
  @ApiResponse({ status: 200, description: 'Retour confirmé' })
  @Post(':id/valider-retour')
  async validerRetour(@Req() req: Request, @Param('id') transactionId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.validerRetour(user.userId, transactionId);
  }

  // Récupérer mes transactions
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer mes transactions' })
  @ApiResponse({ status: 200, description: 'Liste des transactions' })
  @Get('me')
  async getMyTransactions(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.transactionService.getMyTransactions(user.userId);
  }

  // Signaler une dégradation
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Signaler une dégradation' })
  @ApiResponse({ status: 200, description: 'Dégradation signalée' })
  @Post(':id/signaler-degradation')
  async signalerDegradation(@Req() req: Request, @Param('id') transactionId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.signalerDegradation(user.userId, transactionId);
  }

  // Annuler une réservation
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Annuler une réservation' })
  @ApiResponse({ status: 200, description: 'Réservation annulée' })
  @ApiResponse({ status: 400, description: 'Annulation non autorisée' })
  @Post(':id/annuler')
  async annuler(@Req() req: Request, @Param('id') transactionId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.annuler(user.userId, transactionId);
  }
}
