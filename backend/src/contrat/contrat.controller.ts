import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ContratService } from './contrat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contrats')
@UseGuards(JwtAuthGuard)
export class ContratController {
  constructor(private readonly contratService: ContratService) {}

  @Post('generate/:transactionId')
  async generate(@Param('transactionId') transactionId: string) {
    return this.contratService.generateContrat(transactionId);
  }

  @Get('transaction/:id')
  async getByTransaction(@Param('id') transactionId: string) {
    return this.contratService.getContratByTransaction(transactionId);
  }
}
