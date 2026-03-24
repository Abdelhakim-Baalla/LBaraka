import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import * as html_to_pdf from 'html-pdf-node';

@Injectable()
export class ContratService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async generateContrat(transactionId: string): Promise<any> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          annonce: true,
          emprunteur: { include: { profil: true } },
          preteur: { include: { profil: true } },
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction introuvable');
      }

      // 1. Lire le template
      const templatePath = path.join(process.cwd(), 'src', 'contrat', 'templates', 'contrat-bilingue.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // 2. Préparer les données
      const data = {
        numContrat: `LB-${Date.now()}-${transaction.id.substring(0, 8)}`,
        transaction,
        annonce: transaction.annonce,
        emprunteur: transaction.emprunteur,
        preteur: transaction.preteur,
        montantCaution: Number(transaction.montantCautionBloquee || 0),
        photos: transaction.annonce.photos,
      };

      // 3. Générer le HTML
      const html = template(data);

      // 4. Convertir en PDF
      const options = { format: 'A4' };
      const file = { content: html };

      const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
        html_to_pdf.generatePdf(file, options, (err: any, buffer: Buffer) => {
          if (err) reject(err);
          else resolve(buffer);
        });
      });

      // 5. Uploader sur MinIO
      const fileName = `contrat-${transactionId}.pdf`;
      const urlPdf = await this.storageService.uploadBuffer(pdfBuffer, fileName, 'application/pdf');

      // 6. Sauvegarder en base
      const contrat = await this.prisma.contrat.create({
        data: {
          numContrat: data.numContrat,
          urlPdfBilingue: urlPdf,
          hashSignature: `SIG-${Date.now()}`, // Simulation simple
          transactionId: transaction.id,
          langue: 'BILINGUE',
        },
      });

      return contrat;
    } catch (error) {
      console.error('Erreur Generation PDF:', error);
      throw new InternalServerErrorException('Impossible de générer le contrat bilingue');
    }
  }

  async getContratByTransaction(transactionId: string) {
    const contrat = await this.prisma.contrat.findUnique({
      where: { transactionId },
    });
    if (!contrat) throw new NotFoundException('Contrat introuvable pour cette transaction');
    return contrat;
  }
}
