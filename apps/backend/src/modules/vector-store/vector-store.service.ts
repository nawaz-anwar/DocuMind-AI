import { Injectable, Logger } from '@nestjs/common';
import { DocumentChunk } from '@documind/shared-types';
import { cosineSimilarity } from '@documind/utils';

interface VectorEntry {
  id: string;
  documentId: string;
  text: string;
  embedding: number[];
  chunkIndex: number;
  documentName: string;
}

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private vectors: VectorEntry[] = [];

  addVector(
    id: string,
    documentId: string,
    documentName: string,
    text: string,
    embedding: number[],
    chunkIndex: number,
  ): void {
    this.vectors.push({
      id,
      documentId,
      documentName,
      text,
      embedding,
      chunkIndex,
    });
    
    this.logger.log(`Added vector ${id} for document ${documentId}`);
  }

  search(queryEmbedding: number[], topK: number = 5, documentId?: string): Array<VectorEntry & { similarity: number }> {
    // Filter by documentId if provided
    const vectorsToSearch = documentId 
      ? this.vectors.filter(v => v.documentId === documentId)
      : this.vectors;

    if (documentId) {
      this.logger.log(`Searching in document ${documentId} (${vectorsToSearch.length} vectors)`);
    } else {
      this.logger.log(`Searching across all documents (${vectorsToSearch.length} vectors)`);
    }

    const results = vectorsToSearch
      .map(vector => ({
        ...vector,
        similarity: cosineSimilarity(queryEmbedding, vector.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    this.logger.log(`Search returned ${results.length} results`);
    return results;
  }

  getVectorsByDocumentId(documentId: string): VectorEntry[] {
    return this.vectors.filter(v => v.documentId === documentId);
  }

  deleteByDocumentId(documentId: string): void {
    const initialLength = this.vectors.length;
    this.vectors = this.vectors.filter(v => v.documentId !== documentId);
    this.logger.log(`Deleted ${initialLength - this.vectors.length} vectors for document ${documentId}`);
  }

  getStats() {
    return {
      totalVectors: this.vectors.length,
      uniqueDocuments: new Set(this.vectors.map(v => v.documentId)).size,
    };
  }
}
