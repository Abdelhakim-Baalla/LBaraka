import { Test, TestingModule } from '@nestjs/testing';
import { ContratService } from './contrat.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotFoundException } from '@nestjs/common';

describe('ContratService', () => {
  let service: ContratService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      contrat: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', transactionId: 't1', urlPdfBilingue: 'http://minio/lbaraka-annonces/f.pdf' }),
        upsert: jest.fn().mockResolvedValue({ id: 'c1', urlPdfBilingue: 'http://minio/lbaraka-annonces/f.pdf' }),
      },
      transaction: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContratService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { uploadBuffer: jest.fn(), getFileBuffer: jest.fn() } },
      ],
    }).compile();
    service = module.get<ContratService>(ContratService);
  });

  it('should throw when transaction not found on generateContrat', async () => {
    await expect(service.generateContrat('t1')).rejects.toThrow();
  });

  it('should return contrat by transaction with proxy url', async () => {
    const res = await service.getContratByTransaction('t1');
    expect(res).toBeDefined();
    expect(res.urlPdfBilingue).toContain('/storage/pdf');
  });

  it('should throw NotFoundException when contrat not found', async () => {
    prisma.contrat.findUnique.mockResolvedValue(null);
    await expect(service.getContratByTransaction('x')).rejects.toThrow(NotFoundException);
  });
});
