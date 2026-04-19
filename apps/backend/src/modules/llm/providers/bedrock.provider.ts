import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class BedrockProvider implements LLMProvider {
  private readonly logger = new Logger(BedrockProvider.name);
  private readonly modelId: string;
  private readonly bearerToken?: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION', 'ap-south-1');
    this.bearerToken = this.configService.get<string>('AWS_BEARER_TOKEN_BEDROCK');
    this.modelId = this.configService.get<string>('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0');

    if (this.bearerToken) {
      this.logger.log('Bedrock provider initialized with bearer token');
    } else {
      this.logger.warn('Bedrock provider not initialized - missing bearer token');
    }
  }

  async generateResponse(
    query: string,
    context: string[],
  ): Promise<string> {
    if (!this.bearerToken) {
      throw new Error('Bedrock bearer token not configured');
    }

    try {
      const contextString = context.join('\n\n');
      const prompt = this.buildPrompt(query, contextString);
      
      // Prepare the request payload for Claude
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };

      // Make HTTP request to Bedrock API
      const url = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${this.modelId}/invoke`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bedrock API error (${response.status}): ${errorText}`);
      }

      const responseBody = await response.json();
      
      if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
        throw new Error('Invalid response format from Bedrock');
      }

      return responseBody.content[0].text;
    } catch (error) {
      this.logger.error(`Bedrock API error: ${error.message}`);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.bearerToken;
  }

  getName(): string {
    return 'Bedrock';
  }

  private buildPrompt(
    query: string,
    context: string,
  ): string {
    return `You are a helpful AI assistant that answers questions based on provided document context. 

Context from documents:
${context}

Question: ${query}

Instructions:
1. Answer the question using ONLY the information provided in the context above
2. If the context doesn't contain enough information to answer the question, say so clearly
3. Be concise but comprehensive in your response
4. Reference specific sources when making claims
5. If multiple sources support your answer, mention that

Answer:`;
  }
}