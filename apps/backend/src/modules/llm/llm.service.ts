import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly maxRetries = 3;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    this.openai = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('CHAT_MODEL') || 'gpt-4-turbo-preview';
  }

  async generateAnswer(question: string, context: string[]): Promise<string> {
    const prompt = this.buildPrompt(question, context);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant that answers questions based on the provided context. If the context does not contain enough information to answer the question, say so clearly.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        return response.choices[0].message.content || 'No response generated';
      } catch (error) {
        this.logger.error(`Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to generate answer after ${this.maxRetries} attempts`);
        }
        
        await this.delay(1000 * attempt);
      }
    }
    
    throw new Error('Failed to generate answer');
  }

  private buildPrompt(question: string, context: string[]): string {
    const contextText = context.map((chunk, idx) => `[${idx + 1}] ${chunk}`).join('\n\n');
    
    return `Context from documents:
${contextText}

Question: ${question}

Please provide a comprehensive answer based on the context above. If the context doesn't contain relevant information, please state that clearly.`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
