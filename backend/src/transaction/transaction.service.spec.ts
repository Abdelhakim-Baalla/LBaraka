import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { WalletService } from '../wallet/wallet.service';
import { UtilisateurService } from '../utilisateur/utilisateur.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      transaction: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }) },
      annonce: { update: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: { createNotification: jest.fn() } },
        { provide: WalletService, useValue: { depot: jest.fn(), deblocage: jest.fn(), retrait: jest.fn() } },
        { provide: UtilisateurService, useValue: { updateScore: jest.fn() } }
      ],
    }).compile();
    service = module.get<TransactionService>(TransactionService);
  });

  it('should find user transactions', async () => {
    const res = await service.getMyTransactions('1');
    expect(res).toEqual([]);
    expect(prisma.transaction.findMany).toHaveBeenCalled();
  });
});
