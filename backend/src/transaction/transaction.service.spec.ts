import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ContratService } from '../contrat/contrat.service';
import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { NotificationService } from '../notification/notification.service';
import { JwtService } from '@nestjs/jwt';
import { StorageService } from '../storage/storage.service';

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
        { provide: WalletService, useValue: { depot: jest.fn(), deblocage: jest.fn(), retrait: jest.fn(), blocage: jest.fn(), getWalletInfo: jest.fn() } },
        { provide: ContratService, useValue: { generateContrat: jest.fn() } },
        { provide: UtilisateurService, useValue: { updateScore: jest.fn(), checkAndAwardBadges: jest.fn() } },
        { provide: NotificationService, useValue: { create: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() } },
        { provide: StorageService, useValue: {} },
      ],
    }).compile();
    service = module.get<TransactionService>(TransactionService);
  });

  it('should find user transactions', async () => {
    const res = await service.getMyTransactions('1');
    expect(res.transactions).toEqual([]);
    expect(prisma.transaction.findMany).toHaveBeenCalled();
  });
});
