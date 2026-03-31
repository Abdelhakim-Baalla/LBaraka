import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();
    service = module.get<StorageService>(StorageService);
    // Mock the upload method to prevent S3 credentials execution
    service.uploadBuffer = jest.fn().mockResolvedValue('http://localhost:9000/b/f.jpg');
    service.deleteFile = jest.fn().mockResolvedValue(true);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should mock upload buffer', async () => {
    const url = await service.uploadBuffer(Buffer.from('test'), 'test.jpg', 'image/jpeg');
    expect(url).toContain('http');
  });
});
