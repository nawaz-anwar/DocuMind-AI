import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentService } from './document.service';
import { FileProcessingService } from './file-processing.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { UploadDocumentResponse, Document } from '@documind/shared-types';
import { generateId } from '@documind/utils';

@Controller('documents')
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(
    private documentService: DocumentService,
    private fileProcessingService: FileProcessingService,
    private embeddingService: EmbeddingService,
    private vectorStoreService: VectorStoreService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF and TXT files are allowed'), false);
        }
      },
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadDocumentResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      this.logger.log(`Processing upload: ${file.originalname}`);

      // Extract text from file
      const text = await this.fileProcessingService.extractText(file.path, file.mimetype);

      // Chunk the text
      const chunks = this.fileProcessingService.chunkDocument(text);

      // Generate embeddings for all chunks
      const embeddings = await this.embeddingService.generateEmbeddings(chunks);

      // Create document record
      const document = this.documentService.createDocument(
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        chunks.length,
      );

      // Store vectors
      chunks.forEach((chunk, index) => {
        this.vectorStoreService.addVector(
          generateId(),
          document.id,
          document.originalName,
          chunk,
          embeddings[index],
          index,
        );
      });

      this.logger.log(`Successfully processed document ${document.id}`);

      return {
        success: true,
        document,
        message: `Document uploaded and processed successfully. Created ${chunks.length} chunks.`,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException(`Failed to process document: ${error.message}`);
    }
  }

  @Get()
  async getDocuments(): Promise<Document[]> {
    return this.documentService.getAllDocuments();
  }
}
