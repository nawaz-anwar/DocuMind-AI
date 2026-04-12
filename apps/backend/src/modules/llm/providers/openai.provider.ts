import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LLMProvider, LLMProviderConfig } from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly openai: OpenAI | null;
  private readonly model: string;
  private readonly config: LLMProviderConfig;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.model = this.configService.get<string>('CHAT_MODEL') || 'gpt-4-turbo-preview';
      this.logger.log('OpenAI provider initialized');
    } else {
      this.openai = null;
      this.logger.warn('OpenAI API key not configured');
    }

    this.config = {
      maxRetries: 2,
      timeout: 30000, // 30 seconds
      temperature: 0.7,
      maxTokens: 1000,
    };
  }

  getName(): string {
    return 'OpenAI';
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }

  async generateResponse(prompt: string, context: string[]): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI provider is not available');
    }

    const fullPrompt = this.buildPrompt(prompt, context);

    try {
      this.logger.log('[LLM] Using OpenAI');

      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant that answers questions based on the provided context. If the context does not contain enough information to answer the question, say so clearly.',
            },
            {
              role: 'user',
              content: fullPrompt,
            },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
        this.createTimeout(this.config.timeout!),
      ]);

      if (!response || typeof response === 'string') {
        throw new Error('OpenAI request timed out');
      }

      const answer = response.choices[0]?.message?.content || 'No response generated';
      this.logger.log('[LLM] OpenAI success');
      
      return answer;
    } catch (error: any) {
      this.logger.error(`[LLM] OpenAI failed: ${error.message}`);
      
      // Enhance error message for common issues
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded');
      } else if (error.status === 401) {
        throw new Error('OpenAI authentication failed');
      } else if (error.status === 500 || error.status === 503) {
        throw new Error('OpenAI service unavailable');
      } else if (error.message.includes('timeout')) {
        throw new Error('OpenAI request timed out');
      }
      
      throw error;
    }
  }

  private buildPrompt(question: string, context: string[]): string {
    const contextText = context.map((chunk, idx) => `[${idx + 1}] ${chunk}`).join('\n\n');
    
    return `Context from documents:
${contextText}

Question: ${question}

Please provide a comprehensive answer based on the context above. If the context doesn't contain relevant information, please state that clearly.`;
  }

  private createTimeout(ms: number): Promise<string> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }
}
