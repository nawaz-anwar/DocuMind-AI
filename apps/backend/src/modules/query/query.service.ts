import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { LLMOrchestratorService } from '../llm/llm-orchestrator.service';
import { SemanticCacheService } from '../semantic-cache/semantic-cache.service';
import { QueryResponse, SourceChunk } from '@documind/shared-types';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private embeddingService: EmbeddingService,
    private vectorStoreService: VectorStoreService,
    private llmOrchestrator: LLMOrchestratorService,
    private semanticCacheService: SemanticCacheService,
  ) {}

  async processQuery(question: string, topK: number = 5): Promise<QueryResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Processing query: ${question}`);

      // Step 1: Check exact match cache
      const exactMatch = this.semanticCacheService.checkExactMatch(question);
      if (exactMatch.hit && exactMatch.entry) {
        return {
          answer: exactMatch.entry.response,
          sources: exactMatch.entry.sources,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 2: Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(question);

      // Step 3: Check semantic similarity cache
      const semanticMatch = await this.semanticCacheService.checkSemanticMatch(queryEmbedding);
      if (semanticMatch.hit && semanticMatch.entry) {
        return {
          answer: semanticMatch.entry.response,
          sources: semanticMatch.entry.sources,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 4: Cache miss - proceed with RAG pipeline
      this.logger.log('[CACHE] Miss → calling LLM');

      // Search for similar chunks
      const searchResults = this.vectorStoreService.search(queryEmbedding, topK);

      if (searchResults.length === 0) {
        const response = {
          answer: 'No relevant documents found to answer your question.',
          sources: [],
          processingTime: Date.now() - startTime,
        };
        
        // Don't cache empty results
        return response;
      }

      // Prepare context and sources
      const contextChunks = searchResults.map(result => result.text);
      const sources: SourceChunk[] = searchResults.map(result => ({
        text: result.text,
        documentId: result.documentId,
        documentName: result.documentName,
        similarity: result.similarity,
        chunkIndex: result.chunkIndex,
      }));

      // Generate answer using LLM Orchestrator (with fallback)
      const answer = await this.llmOrchestrator.generateAnswer(question, contextChunks);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Query processed in ${processingTime}ms`);

      // Step 5: Store in cache
      this.semanticCacheService.store(question, queryEmbedding, answer, sources);

      return {
        answer,
        sources,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Query processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.semanticCacheService.getStats();
  }

  /**
   * Clear cache (admin function)
   */
  clearCache() {
    this.semanticCacheService.clear();
  }

  /**
   * Get LLM provider status
   */
  getLLMProviderStatus() {
    return this.llmOrchestrator.getProviderStatus();
  }
}
