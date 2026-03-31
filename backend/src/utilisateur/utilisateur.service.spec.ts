import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateurService } from './utilisateur.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));

describe('UtilisateurService', () => {
  let service: UtilisateurService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: '1', email: 'test@t.com' }), update: jest.fn().mockResolvedValue({ id: '1' }), findMany: jest.fn().mockResolvedValue([]) },
      profil: { create: jest.fn().mockResolvedValue({ id: '1' }) },
      portefeuille: { create: jest.fn().mockResolvedValue({ id: '1' }) },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilisateurService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: { create: jest.fn() } },
      ],
    }).compile();
    service = module.get<UtilisateurService>(UtilisateurService);
  });

  it('should find by id', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@a.com' });
    const res = await service.findById('1');
    expect(res?.email).toBe('a@a.com');
  });

  it('should sanitize user', () => {
    const res = service.sanitizeUser({ id: '1', motDePasseHash: 'secret', email: 't@t' } as any);
    expect((res as any).motDePasseHash).toBeUndefined();
    expect(res.email).toBe('t@t');
  });
});
