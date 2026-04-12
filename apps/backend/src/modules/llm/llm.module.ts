import { Module } from '@nestjs/common';
import { LLMOrchestratorService } from './llm-orchestrator.service';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [
    LLMOrchestratorService,
    OpenAIProvider,
    GeminiProvider,
  ],
  exports: [LLMOrchestratorService],
})
export class LlmModule {}
