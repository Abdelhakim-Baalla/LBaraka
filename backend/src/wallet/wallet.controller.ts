import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletAmountDto } from './dto/wallet-amount.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.walletService.getMyWallet(user.userId);
  }

  @Post('depot')
  async depot(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.depot(user.userId, dto.montant);
  }

  @Post('blocage')
  async blocage(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.blocage(user.userId, dto.montant);
  }

  @Post('deblocage')
  async deblocage(@Req() req: Request, @Body() dto: WalletAmountDto) {
    const user = req.user as { userId: string };
    return this.walletService.deblocage(user.userId, dto.montant);
  }
}

