import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletAmountDto } from './dto/wallet-amount.dto';
import { WalletService } from './wallet.service';
import { TypeMouvementWallet } from '@prisma/client';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  // Récupérer mon portefeuille
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer mon portefeuille' })
  @ApiResponse({ status: 200, description: 'Portefeuille récupéré' })
  @Get('me')
  async me(
    @Req() req: Request,
    @Query('type') type?: TypeMouvementWallet,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as { userId: string };
    return this.walletService.getMyWallet(user.userId, {
      type,
      dateFrom,
      dateTo,
      limit,
    });
  }

  // Exporter les mouvements en CSV
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Exporter mes mouvements wallet (CSV)' })
  @ApiResponse({ status: 200, description: 'Export CSV généré' })
  @Get('export')
  async exportCsv(
    @Req() req: Request,
    @Query('type') type?: TypeMouvementWallet,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const user = req.user as { userId: string };
    return this.walletService.exportMouvementsCsv(user.userId, {
      type,
      dateFrom,
      dateTo,
    });
  }

  // Générer un reçu pour un mouvement
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Générer un reçu pour un mouvement wallet' })
  @ApiResponse({ status: 200, description: 'Reçu généré' })
  @Get('mouvements/:id/recu')
  async getMouvementRecu(@Req() req: Request, @Param('id') mouvementId: string) {
    const user = req.user as { userId: string };
    return this.walletService.getMouvementReceipt(user.userId, mouvementId);
  }

  // Générer un reçu PDF pour un mouvement
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Générer un reçu PDF pour un mouvement wallet' })
  @ApiResponse({ status: 200, description: 'Reçu PDF généré' })
  @Get('mouvements/:id/recu-pdf')
  async getMouvementRecuPdf(@Req() req: Request, @Param('id') mouvementId: string) {
    const user = req.user as { userId: string };
    return this.walletService.getMouvementReceiptPdf(user.userId, mouvementId);
  }

  // Déposer de l'argent
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Déposer de l\'argent' })
  @ApiResponse({ status: 201, description: 'Dépôt effectué' })
  @ApiResponse({ status: 400, description: 'Montant invalide' })
  @Post('depot')
  async depot(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.depot(user.userId, dto.montant);
  }

  // Retirer de l'argent
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retirer de l\'argent' })
  @ApiResponse({ status: 201, description: 'Retrait effectué' })
  @ApiResponse({ status: 400, description: 'Solde insuffisant' })
  @Post('retrait')
  async retrait(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.retrait(user.userId, dto.montant);
  }

  // Bloquer de l'argent (caution)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bloquer de l\'argent (caution)' })
  @ApiResponse({ status: 201, description: 'Montant bloqué' })
  @ApiResponse({ status: 400, description: 'Solde insuffisant' })
  @Post('blocage')
  async blocage(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.blocage(user.userId, dto.montant);
  }

  // Débloquer de l'argent (caution)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Débloquer de l\'argent (caution)' })
  @ApiResponse({ status: 201, description: 'Montant débloqué' })
  @Post('deblocage')
  async deblocage(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.deblocage(user.userId, dto.montant);
  }
}
