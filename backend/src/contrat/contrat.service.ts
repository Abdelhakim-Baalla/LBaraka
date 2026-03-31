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

  // Convertir une URL MinIO en URL proxy backend
  private convertToProxyUrl(minioUrl: string): string {
    if (!minioUrl || !minioUrl.includes('/lbaraka-annonces/')) {
      return minioUrl;
    }

    const marker = '/lbaraka-annonces/';
    const markerIndex = minioUrl.indexOf(marker);
    if (markerIndex === -1) {
      return minioUrl;
    }

    const objectPath = `lbaraka-annonces/${minioUrl.slice(markerIndex + marker.length)}`;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${backendUrl}/storage/pdf?path=${encodeURIComponent(objectPath)}`;
  }

  // Générer un hash pour sécuriser le contrat
  private generateHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').toUpperCase();
  }

  // Convertir une image en Base64
  private async getBase64Image(url: string): Promise<string> {
    try {
      if (!url) return '';
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
      const photosBase64: string[] = [];
      
      for (let i = 0; i < 3; i++) {
        if (photosRaw[i]) {
          const b64 = await this.getBase64Image(photosRaw[i]);
          if (b64) {
            photosBase64.push(b64);
          }
        }
      }
      
      // Si pas de photos, ajouter une image par défaut
      if (photosBase64.length === 0) {
        photosBase64.push('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TGJhcmFrYTwvdGV4dD48L3N2Zz4=');
      }

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

      // Retourner avec URL proxy
      const proxyUrl = this.convertToProxyUrl(urlPdf);
      return {
        ...contrat,
        urlPdfBilingue: proxyUrl,
      };
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
    
    // Retourner avec URL proxy
    const proxyUrl = this.convertToProxyUrl(contrat.urlPdfBilingue);
    return {
      ...contrat,
      urlPdfBilingue: proxyUrl,
    };
  }

  // Récupérer l'URL proxy du PDF
  async getContratPdfUrl(transactionId: string): Promise<string> {
    let contrat = await this.prisma.contrat.findUnique({
      where: { transactionId },
    });

    // Générer le contrat si n'existe pas
    if (!contrat || !contrat.urlPdfBilingue) {
      contrat = await this.generateContrat(transactionId);
    }

    if (!contrat || !contrat.urlPdfBilingue) {
      throw new InternalServerErrorException('Échec de la génération du contrat');
    }

    // Retourner l'URL proxy
    return this.convertToProxyUrl(contrat.urlPdfBilingue);
  }
}
