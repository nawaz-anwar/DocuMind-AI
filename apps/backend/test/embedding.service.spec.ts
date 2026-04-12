import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '../src/modules/embedding/embedding.service';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-key';
      if (key === 'EMBEDDING_MODEL') return 'text-embedding-3-small';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if API key is missing', () => {
    mockConfigService.get = jest.fn(() => null);
    expect(() => new EmbeddingService(mockConfigService as any)).toThrow();
  });
});
