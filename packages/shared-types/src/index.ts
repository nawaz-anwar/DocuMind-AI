export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  chunkCount: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  embedding: number[];
  chunkIndex: number;
}

export interface UploadDocumentResponse {
  success: boolean;
  document: Document;
  message: string;
}

export interface QueryRequest {
  question: string;
  topK?: number;
}

export interface SourceChunk {
  text: string;
  documentId: string;
  documentName: string;
  similarity: number;
  chunkIndex: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
  processingTime: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  sources: SourceChunk[];
  timestamp: Date;
}

export interface CacheStats {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  exactCacheSize: number;
  maxSize: number;
  ttlMs: number;
  semanticThreshold: number;
}
