import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notification: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: '1' }), updateMany: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  it('should return unread count 0', async () => {
    const res = await service.getUserNotifications('1');
    expect(res.unreadCount).toBe(0);
    expect(prisma.notification.findMany).toHaveBeenCalled();
  });
});
