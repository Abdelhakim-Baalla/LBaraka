import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn().mockResolvedValue(true),
    putObject: jest.fn().mockResolvedValue({}),
  })),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('localhost') } },
      ],
    }).compile();
    service = module.get<StorageService>(StorageService);
    service.uploadBuffer = jest.fn().mockResolvedValue('http://localhost:9000/b/f.jpg');
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should mock upload buffer', async () => {
    const url = await service.uploadBuffer(Buffer.from('test'), 'test.jpg', 'image/jpeg');
    expect(url).toContain('http');
  });
});
