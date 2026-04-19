import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { BedrockProvider } from './providers/bedrock.provider';
import { MockProvider } from './providers/mock.provider';
import { LLMProvider } from './interfaces/llm-provider.interface';

@Injectable()
export class LLMOrchestratorService {
  private readonly logger = new Logger(LLMOrchestratorService.name);
  private readonly providers: LLMProvider[];

  constructor(
    private openAIProvider: OpenAIProvider,
    private geminiProvider: GeminiProvider,
    private bedrockProvider: BedrockProvider,
    private mockProvider: MockProvider,
  ) {
    // Define provider priority order: Bedrock → OpenAI → Gemini → Mock (for testing)
    this.providers = [
      this.bedrockProvider,
      this.openAIProvider,
      this.geminiProvider,
      this.mockProvider, // Fallback for testing when all APIs fail
    ];

    this.logProviderStatus();
  }

  /**
   * Generate answer using available LLM providers with fallback
   */
  async generateAnswer(question: string, context: string[]): Promise<string> {
    // Validate inputs
    if (!question || question.trim().length === 0) {
      throw new Error('Question cannot be empty');
    }

    if (!context || context.length === 0) {
      this.logger.warn('[LLM] No context provided, answering without context');
    }

    const errors: Array<{ provider: string; error: string }> = [];

    // Try each provider in order
    for (const provider of this.providers) {
      // Skip unavailable providers (except mock provider which is always available)
      if (!provider.isAvailable() && provider !== this.mockProvider) {
        this.logger.warn(`[LLM] ${provider.getName()} is not available (API key not configured)`);
        continue;
      }

      try {
        const response = await provider.generateResponse(question, context);
        
        // Validate response
        if (!response || response.trim().length === 0) {
          throw new Error('Provider returned empty response');
        }

        // Log if using demo mode
        if (provider === this.mockProvider) {
          this.logger.log('[LLM] Using Demo Mode (all API providers unavailable or failed)');
        }

        return response;
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        errors.push({ provider: provider.getName(), error: errorMessage });
        
        this.logger.error(`[LLM] ${provider.getName()} failed: ${errorMessage}`);
        
        // Check if there's a next provider
        const currentIndex = this.providers.indexOf(provider);
        const nextProvider = this.providers[currentIndex + 1];
        
        if (nextProvider) {
          this.logger.log(`[LLM] ${provider.getName()} failed → fallback to ${nextProvider.getName()}`);
        }
      }
    }

    // All providers failed (including mock, which should never happen)
    this.logger.error('[LLM] All providers failed including mock provider');
    
    const errorSummary = errors
      .map(e => `${e.provider}: ${e.error}`)
      .join('; ');
    
    throw new Error(
      `All LLM providers failed. Errors: ${errorSummary}. Please check your API keys and try again.`
    );
  }

  /**
   * Get status of all providers
   */
  getProviderStatus() {
    return this.providers.map(provider => ({
      name: provider.getName(),
      available: provider.isAvailable(),
    }));
  }

  /**
   * Log provider availability on startup
   */
  private logProviderStatus() {
    const status = this.getProviderStatus();
    const available = status.filter(p => p.available).map(p => p.name);
    const unavailable = status.filter(p => !p.available).map(p => p.name);

    if (available.length > 0) {
      this.logger.log(`[LLM] Available providers: ${available.join(', ')}`);
    }
    
    if (unavailable.length > 0) {
      this.logger.warn(`[LLM] Unavailable providers: ${unavailable.join(', ')}`);
    }

    if (available.length === 0) {
      this.logger.error('[LLM] No LLM providers available! Please configure at least one API key.');
    }
  }
}
