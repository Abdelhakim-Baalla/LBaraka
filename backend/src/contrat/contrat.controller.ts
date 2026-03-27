import { Controller, Get, Post, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
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

  /**
   * TÉLÉCHARGER LE PDF DU CONTRAT DIRECTEMENT
   * GET /contrats/:transactionId/pdf
   */
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
