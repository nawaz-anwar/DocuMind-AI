import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentModule } from './modules/document/document.module';
import { QueryModule } from './modules/query/query.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { LlmModule } from './modules/llm/llm.module';
import { VectorStoreModule } from './modules/vector-store/vector-store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DocumentModule,
    QueryModule,
    EmbeddingModule,
    LlmModule,
    VectorStoreModule,
  ],
})
export class AppModule {}
