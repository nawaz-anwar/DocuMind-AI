import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@documind/shared-types';
import { generateId } from '@documind/utils';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private documents: Map<string, Document> = new Map();

  createDocument(
    filename: string,
    originalName: string,
    mimeType: string,
    size: number,
    chunkCount: number,
  ): Document {
    const document: Document = {
      id: generateId(),
      filename,
      originalName,
      mimeType,
      size,
      uploadedAt: new Date(),
      chunkCount,
    };

    this.documents.set(document.id, document);
    this.logger.log(`Created document ${document.id}: ${originalName}`);
    
    return document;
  }

  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): Document[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
    );
  }

  deleteDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.logger.log(`Deleted document ${id}`);
    }
    return deleted;
  }
}
