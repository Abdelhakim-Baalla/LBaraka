import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn().mockResolvedValue(10), findMany: jest.fn().mockResolvedValue([]) },
      pointRelais: { count: jest.fn().mockResolvedValue(5) },
      transaction: { count: jest.fn().mockResolvedValue(2), findMany: jest.fn().mockResolvedValue([]) },
      annonce: { count: jest.fn().mockResolvedValue(10), findMany: jest.fn().mockResolvedValue([]) },
      portefeuille: { aggregate: jest.fn().mockResolvedValue({ _sum: { soldeReel: 100, soldeBloque: 50 } }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should return stats overview', async () => {
    const res = await service.getStats();
    expect(res.overview.totalUsers).toBe(10);
    expect(prisma.user.count).toHaveBeenCalled();
  });
});
