import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getModelToken } from '@nestjs/mongoose';
import { StorageService } from '../storage/storage.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const messageModelMock = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue(dto),
    }));
    (messageModelMock as any).find = jest.fn().mockReturnThis();
    (messageModelMock as any).sort = jest.fn().mockReturnThis();
    (messageModelMock as any).exec = jest.fn().mockResolvedValue([]);
    (messageModelMock as any).aggregate = jest.fn().mockReturnThis();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getModelToken('Message'), useValue: messageModelMock },
        { provide: StorageService, useValue: { uploadBuffer: jest.fn().mockResolvedValue('url') } },
      ],
    }).compile();
    service = module.get<ChatService>(ChatService);
  });

  it('should get conversation', async () => {
    const res = await service.findConversation('1', '2', '3');
    expect(res).toEqual([]);
  });
});
