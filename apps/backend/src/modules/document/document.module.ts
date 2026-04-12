import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { FileProcessingService } from './file-processing.service';
import { EmbeddingModule } from '../embedding/embedding.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [EmbeddingModule, VectorStoreModule],
  controllers: [DocumentController],
  providers: [DocumentService, FileProcessingService],
  exports: [DocumentService],
})
export class DocumentModule {}
