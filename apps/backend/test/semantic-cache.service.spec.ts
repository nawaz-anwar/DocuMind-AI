import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SemanticCacheService } from '../src/modules/semantic-cache/semantic-cache.service';

describe('SemanticCacheService', () => {
  let service: SemanticCacheService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'CACHE_MAX_SIZE') return 10;
      if (key === 'CACHE_TTL_HOURS') return 1;
      if (key === 'CACHE_SIMILARITY_THRESHOLD') return 0.9;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticCacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SemanticCacheService>(SemanticCacheService);
    service.clear();
  });

  afterEach(() => {
    service.clear();
  });

  describe('Exact Match Cache', () => {
    it('should return cache miss for new query', () => {
      const result = service.checkExactMatch('What is AI?');
      expect(result.hit).toBe(false);
    });

    it('should return cache hit for exact match', () => {
      const query = 'What is AI?';
      const embedding = [0.1, 0.2, 0.3];
      const response = 'AI is artificial intelligence';
      const sources = [];

      service.store(query, embedding, response, sources);

      const result = service.checkExactMatch(query);
      expect(result.hit).toBe(true);
      expect(result.entry?.response).toBe(response);
    });

    it('should be case-insensitive', () => {
      const query = 'What is AI?';
      const embedding = [0.1, 0.2, 0.3];
      const response = 'AI is artificial intelligence';
      const sources = [];

      service.store(query, embedding, response, sources);

      const result = service.checkExactMatch('WHAT IS AI?');
      expect(result.hit).toBe(true);
    });

    it('should trim whitespace', () => {
      const query = 'What is AI?';
      const embedding = [0.1, 0.2, 0.3];
      const response = 'AI is artificial intelligence';
      const sources = [];

      service.store(query, embedding, response, sources);

      const result = service.checkExactMatch('  What is AI?  ');
      expect(result.hit).toBe(true);
    });
  });

  describe('Semantic Cache', () => {
    it('should return cache miss for dissimilar query', async () => {
      service.store('What is AI?', [1, 0, 0], 'AI is artificial intelligence', []);

      const result = await service.checkSemanticMatch([0, 1, 0]);
      expect(result.hit).toBe(false);
    });

    it('should return cache hit for similar query', async () => {
      const embedding = [1, 0, 0];
      service.store('What is AI?', embedding, 'AI is artificial intelligence', []);

      // Very similar embedding
      const similarEmbedding = [0.99, 0.01, 0];
      const result = await service.checkSemanticMatch(similarEmbedding);
      expect(result.hit).toBe(true);
      expect(result.similarity).toBeGreaterThan(0.9);
    });

    it('should handle empty embeddings', async () => {
      const result = await service.checkSemanticMatch([]);
      expect(result.hit).toBe(false);
    });
  });

  describe('Cache Eviction', () => {
    it('should evict oldest entry when cache is full', () => {
      // Fill cache to max size (10)
      for (let i = 0; i < 11; i++) {
        service.store(
          `Query ${i}`,
          [i / 10, 0, 0],
          `Response ${i}`,
          [],
        );
      }

      const stats = service.getStats();
      expect(stats.totalEntries).toBe(10);

      // First query should be evicted
      const result = service.checkExactMatch('Query 0');
      expect(result.hit).toBe(false);
    });
  });

  describe('TTL Expiry', () => {
    it('should mark entries as expired after TTL', (done) => {
      // Use a very short TTL for testing
      mockConfigService.get = jest.fn((key: string) => {
        if (key === 'CACHE_TTL_HOURS') return 0.0001; // ~0.36 seconds
        if (key === 'CACHE_MAX_SIZE') return 10;
        if (key === 'CACHE_SIMILARITY_THRESHOLD') return 0.9;
        return null;
      });

      const newService = new SemanticCacheService(mockConfigService as any);
      newService.store('Test query', [1, 0, 0], 'Test response', []);

      // Check immediately - should hit
      let result = newService.checkExactMatch('Test query');
      expect(result.hit).toBe(true);

      // Wait for expiry
      setTimeout(() => {
        result = newService.checkExactMatch('Test query');
        expect(result.hit).toBe(false);
        done();
      }, 500);
    }, 10000);
  });

  describe('Cache Stats', () => {
    it('should return correct statistics', () => {
      service.store('Query 1', [1, 0, 0], 'Response 1', []);
      service.store('Query 2', [0, 1, 0], 'Response 2', []);

      const stats = service.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.activeEntries).toBe(2);
      expect(stats.maxSize).toBe(10);
    });
  });

  describe('Clear Cache', () => {
    it('should clear all cache entries', () => {
      service.store('Query 1', [1, 0, 0], 'Response 1', []);
      service.store('Query 2', [0, 1, 0], 'Response 2', []);

      service.clear();

      const stats = service.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.exactCacheSize).toBe(0);
    });
  });
});
