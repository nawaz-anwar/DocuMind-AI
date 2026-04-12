import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMProviderConfig } from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly genAI: GoogleGenerativeAI | null;
  private readonly model: string;
  private readonly config: LLMProviderConfig;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';
      this.logger.log('Gemini provider initialized');
    } else {
      this.genAI = null;
      this.logger.warn('Gemini API key not configured');
    }

    this.config = {
      maxRetries: 2,
      timeout: 30000, // 30 seconds
      temperature: 0.7,
      maxTokens: 1000,
    };
  }

  getName(): string {
    return 'Gemini';
  }

  isAvailable(): boolean {
    return this.genAI !== null;
  }

  async generateResponse(prompt: string, context: string[]): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini provider is not available');
    }

    const fullPrompt = this.buildPrompt(prompt, context);

    try {
      this.logger.log('[LLM] Using Gemini');

      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
      });

      const result = await Promise.race([
        model.generateContent(fullPrompt),
        this.createTimeout(this.config.timeout!),
      ]);

      if (!result || typeof result === 'string') {
        throw new Error('Gemini request timed out');
      }

      const response = await result.response;
      const answer = response.text();

      if (!answer || answer.trim().length === 0) {
        throw new Error('Gemini returned empty response');
      }

      this.logger.log('[LLM] Gemini success');
      
      return answer;
    } catch (error: any) {
      this.logger.error(`[LLM] Gemini failed: ${error.message}`);
      
      // Enhance error message for common issues
      if (error.message?.includes('API key')) {
        throw new Error('Gemini authentication failed');
      } else if (error.message?.includes('quota')) {
        throw new Error('Gemini quota exceeded');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Gemini request timed out');
      } else if (error.status === 503 || error.status === 500) {
        throw new Error('Gemini service unavailable');
      }
      
      throw error;
    }
  }

  private buildPrompt(question: string, context: string[]): string {
    const contextText = context.map((chunk, idx) => `[${idx + 1}] ${chunk}`).join('\n\n');
    
    return `You are a helpful AI assistant that answers questions based on the provided context. If the context does not contain enough information to answer the question, say so clearly.

Context from documents:
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
