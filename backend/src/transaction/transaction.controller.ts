import { Controller, Get, Post, Param, Req, UseGuards, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('reserve/:annonceId')
  async reserve(@Req() req: Request, @Param('annonceId') annonceId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.reserve(user.userId, annonceId);
  }

  @Get(':id/qr-reception')
  async getReceptionQR(@Req() req: Request, @Param('id') transactionId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.generateReceptionQR(user.userId, transactionId);
  }

  @Post(':id/validate-reception')
  async validateReception(@Req() req: Request, @Param('id') transactionId: string, @Body('secret') secret: string) {
    const user = req.user as { userId: string };
    return this.transactionService.validateReceptionQR(user.userId, transactionId, secret);
  }

  @Post(':id/valider-retour')
  async validerRetour(@Req() req: Request, @Param('id') transactionId: string) {
    const user = req.user as { userId: string };
    return this.transactionService.validerRetour(user.userId, transactionId);
  }

  @Get('me')
  async getMyTransactions(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.transactionService.getMyTransactions(user.userId);
  }
}
