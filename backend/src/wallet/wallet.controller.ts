import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletAmountDto } from './dto/wallet-amount.dto';
import { WalletService } from './wallet.service';

// Routes pour le portefeuille (wallet)
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  // Récupérer mon portefeuille
  @Get('me')
  async me(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.walletService.getMyWallet(user.userId);
  }

  // Déposer de l'argent
  @Post('depot')
  async depot(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.depot(user.userId, dto.montant);
  }

  // Retirer de l'argent
  @Post('retrait')
  async retrait(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.retrait(user.userId, dto.montant);
  }

  // Bloquer de l'argent (caution)
  @Post('blocage')
  async blocage(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.blocage(user.userId, dto.montant);
  }

  // Débloquer de l'argent (caution)
  @Post('deblocage')
  async deblocage(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.deblocage(user.userId, dto.montant);
  }
}
