import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
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
