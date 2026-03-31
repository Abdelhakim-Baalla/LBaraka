import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      profil: { findMany: jest.fn().mockResolvedValue([]) },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'n1', titre: 'Test', message: 'msg' }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  it('should create a notification', async () => {
    const res = await service.create('u1', 'Titre', 'Message');
    expect(res).toBeDefined();
    expect(prisma.notification.create).toHaveBeenCalledWith({ data: { utilisateurId: 'u1', titre: 'Titre', message: 'Message' } });
  });

  it('should return 0 when no priority users found', async () => {
    const count = await service.notifyFoodRescuePriority('a1', 'Surplus', 'Casablanca');
    expect(count).toBe(0);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('should notify priority users and return count', async () => {
    prisma.profil.findMany.mockResolvedValue([
      { utilisateurId: 'u1', palier: 'OR', ville: 'Casablanca', utilisateur: { email: 'a@a.com' } },
    ]);
    const count = await service.notifyFoodRescuePriority('a1', 'Surplus', 'Casablanca');
    expect(count).toBe(1);
    expect(prisma.notification.createMany).toHaveBeenCalled();
  });
});
