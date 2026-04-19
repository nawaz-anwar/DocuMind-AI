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

  async processQuery(question: string, documentId?: string, topK: number = 5): Promise<QueryResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`[QUERY] Processing query: "${question}"`);
      this.logger.log(`[QUERY] Document ID: ${documentId || 'ALL'}`);
      this.logger.log(`[QUERY] Top K: ${topK}`);

      // Step 1: Check exact match cache
      const cacheKey = documentId ? `${question}:${documentId}` : question;
      const exactMatch = this.semanticCacheService.checkExactMatch(cacheKey);
      if (exactMatch.hit && exactMatch.entry) {
        this.logger.log('[CACHE] Exact match hit');
        return {
          answer: exactMatch.entry.response,
          sources: exactMatch.entry.sources,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 2: Generate embedding for the query
      this.logger.log('[EMBEDDING] Generating query embedding...');
      const queryEmbedding = await this.embeddingService.generateEmbedding(question);
      this.logger.log(`[EMBEDDING] Generated embedding with ${queryEmbedding.length} dimensions`);

      // Step 3: Check semantic similarity cache
      const semanticMatch = await this.semanticCacheService.checkSemanticMatch(queryEmbedding);
      if (semanticMatch.hit && semanticMatch.entry) {
        this.logger.log('[CACHE] Semantic match hit');
        return {
          answer: semanticMatch.entry.response,
          sources: semanticMatch.entry.sources,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 4: Cache miss - proceed with RAG pipeline
      this.logger.log('[CACHE] Miss → proceeding with RAG pipeline');

      // Search for similar chunks
      this.logger.log(`[VECTOR] Searching for similar chunks (topK=${topK}, documentId=${documentId || 'ALL'})...`);
      const searchResults = this.vectorStoreService.search(queryEmbedding, topK, documentId);
      this.logger.log(`[VECTOR] Found ${searchResults.length} relevant chunks`);

      if (searchResults.length === 0) {
        const errorMsg = documentId 
          ? 'No relevant content found in the selected document to answer your question.'
          : 'No relevant documents found to answer your question. Please upload documents first.';
        
        this.logger.warn('[VECTOR] No search results found');
        
        const response = {
          answer: errorMsg,
          sources: [],
          processingTime: Date.now() - startTime,
        };
        
        // Don't cache empty results
        return response;
      }

      // Log search results
      searchResults.forEach((result, idx) => {
        this.logger.log(`[VECTOR] Result ${idx + 1}: Document="${result.documentName}", Similarity=${result.similarity.toFixed(3)}`);
      });

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
      this.logger.log('[LLM] Generating answer...');
      const answer = await this.llmOrchestrator.generateAnswer(question, contextChunks);
      this.logger.log(`[LLM] Answer generated (${answer.length} characters)`);

      const processingTime = Date.now() - startTime;
      this.logger.log(`[QUERY] Completed in ${processingTime}ms`);

      // Step 5: Store in cache
      this.semanticCacheService.store(cacheKey, queryEmbedding, answer, sources);

      return {
        answer,
        sources,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`[QUERY] Processing failed: ${error.message}`);
      this.logger.error(`[QUERY] Stack trace: ${error.stack}`);
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
