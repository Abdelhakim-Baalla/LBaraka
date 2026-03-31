import { Test, TestingModule } from '@nestjs/testing';
import { PointRelaisService } from './point-relais.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PointRelaisService', () => {
  let service: PointRelaisService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      pointRelais: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue({ id: '1' }), create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PointRelaisService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<PointRelaisService>(PointRelaisService);
  });

  it('should find all active', async () => {
    const res = await service.findAll();
    expect(res).toEqual([]);
    expect(prisma.pointRelais.findMany).toHaveBeenCalled();
  });
});
