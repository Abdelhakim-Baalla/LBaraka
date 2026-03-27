import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import * as html_to_pdf from 'html-pdf-node';
import * as crypto from 'crypto';

// Service pour gérer les contrats PDF
@Injectable()
export class ContratService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Générer un hash pour sécuriser le contrat
  private generateHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').toUpperCase();
  }

  // Convertir une image en Base64
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

  // Générer un contrat PDF pour une transaction
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

      // Préparer les photos de l'annonce
      const photosRaw = transaction.annonce.photos || [];
      const defaultImage = "http://localhost:9000/lbaraka-annonces/annonces/1773757925920-722706832-photo_1773757912301.jpg";
      
      const photosBase64 = await Promise.all(
        [0, 1, 2].map(async (i) => {
          const url = photosRaw[i] || defaultImage;
          const b64 = await this.getBase64Image(url);
          return b64 || 'https://via.placeholder.com/300x300.png?text=LBaraka+Photo';
        })
      );

      // Lire le template Handlebars
      const templatePath = path.join(process.cwd(), 'src', 'contrat', 'templates', 'contrat-bilingue.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // Préparer les données pour le template
      const dataHash = this.generateHash({
        id: transaction.id,
        date: new Date(),
        caution: transaction.montantCautionBloquee,
      });

      const data = {
        numContrat: `LB-${Date.now()}-${transaction.id.substring(0, 8)}`,
        transaction,
        annonce: transaction.annonce,
        emprunteur: transaction.emprunteur,
        preteur: transaction.preteur,
        montantCaution: Number(transaction.montantCautionBloquee || 0),
        photos: photosBase64,
        hashSignature: dataHash,
        timestamp: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
      };

      // Générer le HTML à partir du template
      const html = template(data);

      // Convertir en PDF
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

      // Uploader le PDF sur le storage
      const fileName = `contrat-${transactionId}.pdf`;
      const urlPdf = await this.storageService.uploadBuffer(pdfBuffer, fileName, 'application/pdf');

      // Sauvegarder en base (ou mettre à jour si existe déjà)
      const contrat = await this.prisma.contrat.upsert({
        where: { transactionId: transaction.id },
        update: {
          numContrat: data.numContrat,
          urlPdfBilingue: urlPdf,
          dateGeneration: new Date(),
          hashSignature: dataHash,
        },
        create: {
          numContrat: data.numContrat,
          urlPdfBilingue: urlPdf,
          hashSignature: dataHash,
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

  // Récupérer un contrat par transaction
  async getContratByTransaction(transactionId: string) {
    const contrat = await this.prisma.contrat.findUnique({
      where: { transactionId },
    });
    if (!contrat) throw new NotFoundException('Contrat introuvable pour cette transaction');
    return contrat;
  }

  // Récupérer le PDF du contrat pour téléchargement
  async getContratPdfBuffer(transactionId: string): Promise<{ buffer: Buffer; fileName: string }> {
    let contrat = await this.prisma.contrat.findUnique({
      where: { transactionId },
    });

    // Générer le contrat si n'existe pas
    if (!contrat || !contrat.urlPdfBilingue) {
      contrat = await this.generateContrat(transactionId);
    }

    if (!contrat) {
      throw new InternalServerErrorException('Échec de la génération du contrat');
    }

    // Extraire le nom du fichier depuis l'URL
    const url = contrat.urlPdfBilingue;
    const fileName = url.split('/').pop() || `contrat-${transactionId}.pdf`;

    try {
      const buffer = await this.storageService.getFileBuffer(url);
      return { buffer, fileName };
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la récupération du fichier PDF');
    }
  }
}
