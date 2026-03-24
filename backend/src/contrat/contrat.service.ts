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

  private async getBase64Image(url: string): Promise<string> {
    try {
      const buffer = await this.storageService.getFileBuffer(url);
      const b64 = buffer.toString('base64');
      const ext = url.split('.').pop()?.toLowerCase() || 'jpeg';
      const mime = ext === 'png' ? 'png' : 'jpeg';
      return `data:image/${mime};base64,${b64}`;
    } catch (e: any) {
      console.error(`Erreur conversion Base64 pour ${url}:`, e.message);
      return '';
    }
  }

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

      if (!transaction) throw new NotFoundException('Transaction introuvable');

      // Transformation et Fallback Dynamique (On lit la base de données)
      const photosRaw = transaction.annonce.photos || [];
      const defaultImage = "http://localhost:9000/lbaraka-annonces/annonces/1773757925920-722706832-photo_1773757912301.jpg";
      
      const photosBase64 = await Promise.all(
        [0, 1, 2].map(async (i) => {
          const url = photosRaw[i] || defaultImage;
          const b64 = await this.getBase64Image(url);
          return b64 || 'https://via.placeholder.com/300x300.png?text=LBaraka+Photo';
        })
      );

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
        photos: photosBase64,
      };

      // 3. Générer le HTML
      const html = template(data);

      // 4. Convertir en PDF
      const options = { 
        format: 'A4', 
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      };
      
      const file = { 
        content: html,
      };

      const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
        html_to_pdf.generatePdf(file, options, (err: any, buffer: Buffer) => {
          if (err) reject(err);
          else resolve(buffer);
        });
      });

      // 5. Uploader sur MinIO
      const fileName = `contrat-${transactionId}.pdf`;
      const urlPdf = await this.storageService.uploadBuffer(pdfBuffer, fileName, 'application/pdf');

      // 6. Sauvegarder ou Mettre à jour en base (Upsert)
      const contrat = await this.prisma.contrat.upsert({
        where: { transactionId: transaction.id },
        update: {
          numContrat: data.numContrat,
          urlPdfBilingue: urlPdf,
          dateGeneration: new Date(),
        },
        create: {
          numContrat: data.numContrat,
          urlPdfBilingue: urlPdf,
          hashSignature: `SIG-${Date.now()}`,
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
