import { Test, TestingModule } from '@nestjs/testing';
import { ContratService } from './contrat.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContratService', () => {
  let service: ContratService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      contratEngagement: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: '1' }), findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContratService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ContratService>(ContratService);
  });

  it('should find user contracts', async () => {
    const res = await service.getUserContrats('1');
    expect(res).toEqual([]);
    expect(prisma.contratEngagement.findMany).toHaveBeenCalled();
  });
});
