import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { QueryService } from './query.service';
import { QueryDto } from './dto/query.dto';
import { QueryResponse } from '@documind/shared-types';

@Controller('query')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(private queryService: QueryService) {}

  @Post()
  async query(@Body() queryDto: QueryDto): Promise<QueryResponse> {
    this.logger.log(`Received query: ${queryDto.question}`);
    if (queryDto.documentId) {
      this.logger.log(`Target document: ${queryDto.documentId}`);
    }
    return this.queryService.processQuery(queryDto.question, queryDto.documentId, queryDto.topK);
  }

  @Get('cache/stats')
  async getCacheStats() {
    return this.queryService.getCacheStats();
  }

  @Post('cache/clear')
  async clearCache() {
    this.queryService.clearCache();
    return { message: 'Cache cleared successfully' };
  }

  @Get('llm/status')
  async getLLMStatus() {
    return this.queryService.getLLMProviderStatus();
  }
}
