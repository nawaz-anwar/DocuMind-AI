import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { cosineSimilarity } from '@documind/utils';

interface CacheEntry {
  id: string;
  query: string;
  embedding: number[];
  response: string;
  sources: any[];
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class SemanticCacheService implements OnModuleInit {
  private readonly logger = new Logger(SemanticCacheService.name);
  
  // Exact match cache (fast lookup)
  private exactCache: Map<string, CacheEntry> = new Map();
  
  // Semantic cache (embedding-based)
  private semanticCache: CacheEntry[] = [];
  
  // Configuration
  private readonly maxCacheSize: number;
  private readonly ttlMs: number;
  private readonly similarityThreshold: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    this.maxCacheSize = this.configService.get<number>('CACHE_MAX_SIZE') || 100;
    this.ttlMs = (this.configService.get<number>('CACHE_TTL_HOURS') || 1) * 60 * 60 * 1000;
    this.similarityThreshold = this.configService.get<number>('CACHE_SIMILARITY_THRESHOLD') || 0.9;
  }

  onModuleInit() {
    // Start periodic cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 10 * 60 * 1000);
    
    this.logger.log(`Semantic cache initialized (max: ${this.maxCacheSize}, TTL: ${this.ttlMs / 1000 / 60}min, threshold: ${this.similarityThreshold})`);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Generate cache key from query
   */
  private generateCacheKey(query: string): string {
    return createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
  }

  /**
   * Check exact match cache
   */
  checkExactMatch(query: string): { hit: boolean; entry?: CacheEntry } {
    const key = this.generateCacheKey(query);
    const entry = this.exactCache.get(key);

    if (entry) {
      // Check if expired
      if (this.isExpired(entry)) {
        this.logger.log(`[CACHE] Exact match expired, removing`);
        this.exactCache.delete(key);
        this.removeFromSemanticCache(entry.id);
        return { hit: false };
      }

      this.logger.log(`[CACHE] Exact match hit`);
      return { hit: true, entry };
    }

    return { hit: false };
  }

  /**
   * Check semantic similarity cache
   */
  async checkSemanticMatch(
    queryEmbedding: number[],
  ): Promise<{ hit: boolean; entry?: CacheEntry; similarity?: number }> {
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return { hit: false };
    }

    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    // Compare with all cached embeddings
    for (const entry of this.semanticCache) {
      // Skip expired entries
      if (this.isExpired(entry)) {
        continue;
      }

      try {
        const similarity = cosineSimilarity(queryEmbedding, entry.embedding);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = entry;
        }
      } catch (error) {
        this.logger.error(`Error computing similarity: ${error.message}`);
      }
    }

    // Check if best match exceeds threshold
    if (bestMatch && bestSimilarity >= this.similarityThreshold) {
      this.logger.log(`[CACHE] Semantic match hit (score: ${bestSimilarity.toFixed(4)})`);
      return { hit: true, entry: bestMatch, similarity: bestSimilarity };
    }

    return { hit: false };
  }

  /**
   * Store response in cache
   */
  store(query: string, embedding: number[], response: string, sources: any[]): void {
    // Check cache size and evict if necessary
    if (this.semanticCache.length >= this.maxCacheSize) {
      this.evictOldest();
    }

    const now = new Date();
    const entry: CacheEntry = {
      id: this.generateCacheKey(query) + '-' + now.getTime(),
      query: query.trim(),
      embedding,
      response,
      sources,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMs),
    };

    // Store in exact match cache
    const key = this.generateCacheKey(query);
    this.exactCache.set(key, entry);

    // Store in semantic cache
    this.semanticCache.push(entry);

    this.logger.log(`[CACHE] Stored new response (total: ${this.semanticCache.length}/${this.maxCacheSize})`);
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * Remove expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    const initialSize = this.semanticCache.length;

    // Clean semantic cache
    this.semanticCache = this.semanticCache.filter(entry => {
      const expired = entry.expiresAt < now;
      if (expired) {
        // Also remove from exact cache
        const key = this.generateCacheKey(entry.query);
        this.exactCache.delete(key);
      }
      return !expired;
    });

    const removed = initialSize - this.semanticCache.length;
    if (removed > 0) {
      this.logger.log(`[CACHE] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Evict oldest entry (FIFO strategy)
   */
  private evictOldest(): void {
    if (this.semanticCache.length === 0) return;

    // Sort by creation time and remove oldest
    this.semanticCache.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldest = this.semanticCache.shift();

    if (oldest) {
      const key = this.generateCacheKey(oldest.query);
      this.exactCache.delete(key);
      this.logger.log(`[CACHE] Evicted oldest entry (FIFO)`);
    }
  }

  /**
   * Remove specific entry from semantic cache
   */
  private removeFromSemanticCache(id: string): void {
    const index = this.semanticCache.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.semanticCache.splice(index, 1);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = new Date();
    const activeEntries = this.semanticCache.filter(e => e.expiresAt > now).length;

    return {
      totalEntries: this.semanticCache.length,
      activeEntries,
      expiredEntries: this.semanticCache.length - activeEntries,
      exactCacheSize: this.exactCache.size,
      maxSize: this.maxCacheSize,
      utilizationPercent: ((this.semanticCache.length / this.maxCacheSize) * 100).toFixed(1),
    };
  }

  /**
   * Clear all cache (useful for testing)
   */
  clear(): void {
    this.exactCache.clear();
    this.semanticCache = [];
    this.logger.log('[CACHE] Cleared all entries');
  }
}
