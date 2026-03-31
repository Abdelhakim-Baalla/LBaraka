import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceService } from './annonce.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { UtilisateurService } from '../utilisateur/utilisateur.service';

describe('AnnonceService', () => {
  let service: AnnonceService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      annonce: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1' }), count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnonceService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { uploadAnnoncePhotosBase64: jest.fn().mockResolvedValue([]) } },
        { provide: NotificationService, useValue: { notifyFoodRescuePriority: jest.fn(), create: jest.fn() } },
        { provide: UtilisateurService, useValue: { updateScore: jest.fn() } },
      ],
    }).compile();
    service = module.get<AnnonceService>(AnnonceService);
  });

  it('should return all annonces', async () => {
    const res = await service.findAll();
    expect(res.annonces).toEqual([]);
    expect(prisma.annonce.findMany).toHaveBeenCalled();
  });
});
