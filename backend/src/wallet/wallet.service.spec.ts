import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { UtilisateurService } from '../utilisateur/utilisateur.service';
import { Prisma } from '@prisma/client';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      portefeuille: { 
        findUnique: jest.fn().mockResolvedValue({ id: '1', soldeReel: new Prisma.Decimal(10), soldeBloque: new Prisma.Decimal(0), devise: 'MAD' }),
        create: jest.fn().mockResolvedValue({ id: '1', soldeReel: new Prisma.Decimal(10), soldeBloque: new Prisma.Decimal(0), devise: 'MAD' }),
        update: jest.fn().mockResolvedValue({ id: '1', soldeReel: new Prisma.Decimal(60), soldeBloque: new Prisma.Decimal(0), devise: 'MAD' }),
      },
      mouvementWallet: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: UtilisateurService, useValue: { updateScore: jest.fn() } },
      ],
    }).compile();
    service = module.get<WalletService>(WalletService);
  });

  it('should return wallet with movements', async () => {
    const res = await service.getMyWallet('1');
    expect(res.wallet.devise).toBe('MAD');
    expect(res.mouvements).toEqual([]);
  });

  it('should throw if insufficient balance on blocage', async () => {
    await expect(service.blocage('1', 500)).rejects.toThrow();
  });

  it('should create movement on depot', async () => {
    await service.depot('1', 50);
    expect(prisma.mouvementWallet.create).toHaveBeenCalled();
  });
});
