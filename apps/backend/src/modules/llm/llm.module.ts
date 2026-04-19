import { Module } from '@nestjs/common';
import { LLMOrchestratorService } from './llm-orchestrator.service';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { BedrockProvider } from './providers/bedrock.provider';
import { MockProvider } from './providers/mock.provider';

@Module({
  providers: [
    LLMOrchestratorService,
    OpenAIProvider,
    GeminiProvider,
    BedrockProvider,
    MockProvider,
  ],
  exports: [LLMOrchestratorService],
})
export class LlmModule {}
