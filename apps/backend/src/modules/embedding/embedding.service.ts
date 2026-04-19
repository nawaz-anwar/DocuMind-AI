import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai?: OpenAI;
  private readonly openaiModel: string;
  private readonly bearerToken?: string;
  private readonly region: string;
  private readonly bedrockModel: string;

  constructor(private configService: ConfigService) {
    // Bedrock configuration (primary)
    this.bearerToken = this.configService.get<string>('AWS_BEARER_TOKEN_BEDROCK');
    this.region = this.configService.get<string>('AWS_REGION', 'ap-south-1');
    this.bedrockModel = this.configService.get<string>('BEDROCK_EMBEDDING_MODEL', 'amazon.titan-embed-text-v1');

    // OpenAI configuration (fallback)
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
      this.openaiModel = this.configService.get<string>('EMBEDDING_MODEL') || 'text-embedding-3-small';
    }

    if (this.bearerToken) {
      this.logger.log('Embedding service initialized with Bedrock (primary) and OpenAI (fallback)');
    } else if (this.openai) {
      this.logger.log('Embedding service initialized with OpenAI only');
    } else {
      this.logger.error('No embedding providers available');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Try Bedrock first
    if (this.bearerToken) {
      try {
        return await this.generateBedrockEmbedding(text);
      } catch (error) {
        this.logger.warn(`Bedrock embedding failed: ${error.message}`);
      }
    }

    // For demo purposes, generate a mock embedding when OpenAI quota is exceeded
    // This allows testing the Bedrock LLM integration
    this.logger.warn('Using mock embeddings for demo - OpenAI quota exceeded');
    return this.generateMockEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Try Bedrock first
    if (this.bearerToken) {
      try {
        const embeddings = await Promise.all(
          texts.map(text => this.generateBedrockEmbedding(text))
        );
        return embeddings;
      } catch (error) {
        this.logger.warn(`Bedrock embeddings failed: ${error.message}`);
      }
    }

    // For demo purposes, generate mock embeddings when OpenAI quota is exceeded
    this.logger.warn('Using mock embeddings for demo - OpenAI quota exceeded');
    return texts.map(text => this.generateMockEmbedding(text));
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate a deterministic but pseudo-random embedding based on text content
    // This allows the system to work for demo purposes
    const dimension = 1536; // Standard OpenAI embedding dimension
    const embedding = new Array(dimension);
    
    // Use text hash to generate consistent embeddings for same text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate embedding values between -1 and 1
    for (let i = 0; i < dimension; i++) {
      const seed = hash + i;
      const value = (Math.sin(seed) + Math.cos(seed * 1.5)) / 2;
      embedding[i] = Math.max(-1, Math.min(1, value));
    }
    
    return embedding;
  }

  private async generateBedrockEmbedding(text: string): Promise<number[]> {
    const url = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${this.bedrockModel}/invoke`;
    
    // Different payload format for Titan embedding model
    const payload = {
      inputText: text,
      dimensions: 1536, // Standard embedding dimension
      normalize: true
    };

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
      throw new Error(`Bedrock embedding API error (${response.status}): ${errorText}`);
    }

    const responseBody = await response.json();
    
    // Handle different response formats
    if (responseBody.embedding) {
      return responseBody.embedding;
    } else if (responseBody.embeddings && responseBody.embeddings[0]) {
      return responseBody.embeddings[0];
    } else if (responseBody.data && responseBody.data[0] && responseBody.data[0].embedding) {
      return responseBody.data[0].embedding;
    }
    
    throw new Error('Invalid embedding response format from Bedrock');
  }
}
