import { Test, TestingModule } from '@nestjs/testing';
import { QueryService } from '../src/modules/query/query.service';
import { EmbeddingService } from '../src/modules/embedding/embedding.service';
import { VectorStoreService } from '../src/modules/vector-store/vector-store.service';
import { LlmService } from '../src/modules/llm/llm.service';
import { SemanticCacheService } from '../src/modules/semantic-cache/semantic-cache.service';

describe('QueryService with Semantic Cache', () => {
  let queryService: QueryService;
  let cacheService: SemanticCacheService;
  let embeddingService: EmbeddingService;
  let llmService: LlmService;

  const mockEmbedding = [0.1, 0.2, 0.3];
  const mockAnswer = 'This is a test answer';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryService,
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn().mockResolvedValue(mockEmbedding),
          },
        },
        {
          provide: VectorStoreService,
          useValue: {
            search: jest.fn().mockReturnValue([
              {
                id: '1',
                documentId: 'doc1',
                documentName: 'test.pdf',
                text: 'Test content',
                embedding: mockEmbedding,
                chunkIndex: 0,
                similarity: 0.95,
              },
            ]),
          },
        },
        {
          provide: LlmService,
          useValue: {
            generateAnswer: jest.fn().mockResolvedValue(mockAnswer),
          },
        },
        {
          provide: SemanticCacheService,
          useValue: {
            checkExactMatch: jest.fn().mockReturnValue(null),
            checkSemanticMatch: jest.fn().mockReturnValue(null),
            storeResponse: jest.fn(),
            getStats: jest.fn().mockReturnValue({
              totalEntries: 0,
              activeEntries: 0,
              expiredEntries: 0,
              exactCacheSize: 0,
              maxSize: 100,
              ttlMs: 3600000,
              semanticThreshold: 0.9,
            }),
            clearCache: jest.fn(),
          },
        },
      ],
    }).compile();

    queryService = module.get<QueryService>(QueryService);
    cacheService = module.get<SemanticCacheService>(SemanticCacheService);
    embeddingService = module.get<EmbeddingService>(EmbeddingService);
    llmService = module.get<LlmService>(LlmService);
  });

  it('should call OpenAI on cache miss', async () => {
    const question = 'What is AI?';

    await queryService.processQuery(question);

    expect(cacheService.checkExactMatch).toHaveBeenCalledWith(question);
    expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(question);
    expect(cacheService.checkSemanticMatch).toHaveBeenCalled();
    expect(llmService.generateAnswer).toHaveBeenCalled();
    expect(cacheService.storeResponse).toHaveBeenCalled();
  });

  it('should return cached response on exact match', async () => {
    const question = 'What is AI?';
    const cachedResponse = {
      id: '1',
      query: question,
      embedding: mockEmbedding,
      response: 'Cached answer',
      sources: [],
      processingTime: 50,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    jest.spyOn(cacheService, 'checkExactMatch').mockReturnValue(cachedResponse);

    const result = await queryService.processQuery(question);

    expect(result.answer).toBe('Cached answer');
    expect(embeddingService.generateEmbedding).not.toHaveBeenCalled();
    expect(llmService.generateAnswer).not.toHaveBeenCalled();
  });

  it('should return cached response on semantic match', async () => {
    const question = 'What is artificial intelligence?';
    const cachedEntry = {
      id: '1',
      query: 'What is AI?',
      embedding: mockEmbedding,
      response: 'Semantically cached answer',
      sources: [],
      processingTime: 50,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    jest.spyOn(cacheService, 'checkSemanticMatch').mockReturnValue({
      entry: cachedEntry,
      similarity: 0.95,
    });

    const result = await queryService.processQuery(question);

    expect(result.answer).toBe('Semantically cached answer');
    expect(llmService.generateAnswer).not.toHaveBeenCalled();
  });

  it('should store response after OpenAI call', async () => {
    const question = 'What is machine learning?';

    await queryService.processQuery(question);

    expect(cacheService.storeResponse).toHaveBeenCalledWith(
      question,
      mockEmbedding,
      mockAnswer,
      expect.any(Array),
      expect.any(Number),
    );
  });
});
