import { Test, TestingModule } from '@nestjs/testing';
import { VectorStoreService } from '../src/modules/vector-store/vector-store.service';

describe('VectorStoreService', () => {
  let service: VectorStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VectorStoreService],
    }).compile();

    service = module.get<VectorStoreService>(VectorStoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add and retrieve vectors', () => {
    const embedding = [0.1, 0.2, 0.3];
    service.addVector('id1', 'doc1', 'test.pdf', 'test text', embedding, 0);

    const results = service.search(embedding, 1);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('test text');
  });

  it('should return vectors sorted by similarity', () => {
    service.addVector('id1', 'doc1', 'test1.pdf', 'text 1', [1, 0, 0], 0);
    service.addVector('id2', 'doc2', 'test2.pdf', 'text 2', [0, 1, 0], 0);

    const results = service.search([1, 0, 0], 2);
    expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
  });

  it('should delete vectors by document ID', () => {
    service.addVector('id1', 'doc1', 'test.pdf', 'text 1', [1, 0, 0], 0);
    service.addVector('id2', 'doc1', 'test.pdf', 'text 2', [0, 1, 0], 1);

    service.deleteByDocumentId('doc1');
    const stats = service.getStats();
    expect(stats.totalVectors).toBe(0);
  });
});
