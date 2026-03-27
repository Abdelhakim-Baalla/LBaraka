import { Controller, Get, Post, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContratService } from './contrat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Routes pour les contrats
@Controller('contrats')
@UseGuards(JwtAuthGuard)
export class ContratController {
  constructor(private readonly contratService: ContratService) {}

  // Générer un contrat pour une transaction
  @Post('generate/:transactionId')
  async generate(@Param('transactionId') transactionId: string) {
    return this.contratService.generateContrat(transactionId);
  }

  // Récupérer le contrat d'une transaction
  @Get('transaction/:id')
  async getByTransaction(@Param('id') transactionId: string) {
    return this.contratService.getContratByTransaction(transactionId);
  }

  // Télécharger le PDF du contrat
  @Get(':transactionId/pdf')
  async downloadPdf(
    @Param('transactionId') transactionId: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.contratService.getContratPdfBuffer(transactionId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
