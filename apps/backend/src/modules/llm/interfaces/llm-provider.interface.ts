export interface LLMProvider {
  /**
   * Generate a response based on the prompt and context
   * @param prompt The user's question or prompt
   * @param context Array of context strings (document chunks)
   * @returns Generated response text
   */
  generateResponse(prompt: string, context: string[]): Promise<string>;

  /**
   * Get the provider name for logging
   */
  getName(): string;

  /**
   * Check if the provider is available (API key configured)
   */
  isAvailable(): boolean;
}

export interface LLMProviderConfig {
  maxRetries?: number;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
}
