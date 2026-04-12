import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LLMOrchestratorService } from '../src/modules/llm/llm-orchestrator.service';
import { OpenAIProvider } from '../src/modules/llm/providers/openai.provider';
import { GeminiProvider } from '../src/modules/llm/providers/gemini.provider';

describe('LLMOrchestratorService', () => {
  let service: LLMOrchestratorService;
  let openAIProvider: OpenAIProvider;
  let geminiProvider: GeminiProvider;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-openai-key';
      if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
      if (key === 'CHAT_MODEL') return 'gpt-4-turbo-preview';
      if (key === 'GEMINI_MODEL') return 'gemini-pro';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMOrchestratorService,
        OpenAIProvider,
        GeminiProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LLMOrchestratorService>(LLMOrchestratorService);
    openAIProvider = module.get<OpenAIProvider>(OpenAIProvider);
    geminiProvider = module.get<GeminiProvider>(GeminiProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Provider Status', () => {
    it('should return provider status', () => {
      const status = service.getProviderStatus();
      expect(status).toHaveLength(2);
      expect(status[0].name).toBe('OpenAI');
      expect(status[1].name).toBe('Gemini');
    });

    it('should detect available providers', () => {
      const status = service.getProviderStatus();
      const availableProviders = status.filter(p => p.available);
      expect(availableProviders.length).toBeGreaterThan(0);
    });
  });

  describe('Fallback Logic', () => {
    it('should use OpenAI as primary provider', async () => {
      const mockResponse = 'OpenAI response';
      jest.spyOn(openAIProvider, 'generateResponse').mockResolvedValue(mockResponse);
      jest.spyOn(openAIProvider, 'isAvailable').mockReturnValue(true);

      const result = await service.generateAnswer('test question', ['context']);
      
      expect(result).toBe(mockResponse);
      expect(openAIProvider.generateResponse).toHaveBeenCalled();
    });

    it('should fallback to Gemini when OpenAI fails', async () => {
      const mockGeminiResponse = 'Gemini response';
      
      jest.spyOn(openAIProvider, 'isAvailable').mockReturnValue(true);
      jest.spyOn(openAIProvider, 'generateResponse').mockRejectedValue(new Error('OpenAI failed'));
      jest.spyOn(geminiProvider, 'isAvailable').mockReturnValue(true);
      jest.spyOn(geminiProvider, 'generateResponse').mockResolvedValue(mockGeminiResponse);

      const result = await service.generateAnswer('test question', ['context']);
      
      expect(result).toBe(mockGeminiResponse);
      expect(openAIProvider.generateResponse).toHaveBeenCalled();
      expect(geminiProvider.generateResponse).toHaveBeenCalled();
    });

    it('should throw error when all providers fail', async () => {
      jest.spyOn(openAIProvider, 'isAvailable').mockReturnValue(true);
      jest.spyOn(openAIProvider, 'generateResponse').mockRejectedValue(new Error('OpenAI failed'));
      jest.spyOn(geminiProvider, 'isAvailable').mockReturnValue(true);
      jest.spyOn(geminiProvider, 'generateResponse').mockRejectedValue(new Error('Gemini failed'));

      await expect(
        service.generateAnswer('test question', ['context'])
      ).rejects.toThrow('All LLM providers failed');
    });

    it('should skip unavailable providers', async () => {
      const mockGeminiResponse = 'Gemini response';
      
      jest.spyOn(openAIProvider, 'isAvailable').mockReturnValue(false);
      jest.spyOn(geminiProvider, 'isAvailable').mockReturnValue(true);
      jest.spyOn(geminiProvider, 'generateResponse').mockResolvedValue(mockGeminiResponse);

      const result = await service.generateAnswer('test question', ['context']);
      
      expect(result).toBe(mockGeminiResponse);
      expect(openAIProvider.generateResponse).not.toHaveBeenCalled();
      expect(geminiProvider.generateResponse).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should throw error for empty question', async () => {
      await expect(
        service.generateAnswer('', ['context'])
      ).rejects.toThrow('Question cannot be empty');
    });

    it('should handle empty context gracefully', async () => {
      const mockResponse = 'Response without context';
      jest.spyOn(openAIProvider, 'isAvailable').mockReturnValue(true);
      jest.spyOn(openAIProvider, 'generateResponse').mockResolvedValue(mockResponse);

      const result = await service.generateAnswer('test question', []);
      expect(result).toBe(mockResponse);
    });
  });
});
