import { Controller, Get, Post, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ContratService } from './contrat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contrats')
@Controller('contrats')
@UseGuards(JwtAuthGuard)
export class ContratController {
  constructor(private readonly contratService: ContratService) { }

  // Générer un contrat pour une transaction
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Générer un contrat pour une transaction' })
  @ApiResponse({ status: 201, description: 'Contrat généré' })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée' })
  @Post('generate/:transactionId')
  async generate(@Param('transactionId') transactionId: string) {
    return this.contratService.generateContrat(transactionId);
  }

  // Récupérer le contrat d'une transaction
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer le contrat d\'une transaction' })
  @ApiResponse({ status: 200, description: 'Contrat récupéré' })
  @ApiResponse({ status: 404, description: 'Contrat non trouvé' })
  @Get('transaction/:id')
  async getByTransaction(@Param('id') transactionId: string) {
    return this.contratService.getContratByTransaction(transactionId);
  }

  // Télécharger le PDF du contrat
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Télécharger le PDF du contrat' })
  @ApiResponse({ status: 200, description: 'PDF du contrat' })
  @ApiResponse({ status: 404, description: 'Contrat non trouvé' })
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
