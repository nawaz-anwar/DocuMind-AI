import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { EmbeddingModule } from '../embedding/embedding.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { LlmModule } from '../llm/llm.module';
import { SemanticCacheModule } from '../semantic-cache/semantic-cache.module';

@Module({
  imports: [EmbeddingModule, VectorStoreModule, LlmModule, SemanticCacheModule],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}
