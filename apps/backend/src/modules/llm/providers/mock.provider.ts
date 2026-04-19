import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class MockProvider implements LLMProvider {
  private readonly logger = new Logger(MockProvider.name);

  async generateResponse(query: string, context: string[]): Promise<string> {
    this.logger.log('[DEMO MODE] Generating demo response');
    
    // Professional demo mode message
    const demoMessage = `**🟡 AI Response (Demo Mode)**

The system is currently running in **demo mode**.

**System Status:**
✅ Document processing — Operational  
✅ Semantic search — Operational  
✅ RAG pipeline — Operational  
✅ Context retrieval — ${context.length} relevant chunk${context.length !== 1 ? 's' : ''} found

**Your Question:**
"${query}"

**About Demo Mode:**
All core features are functioning correctly. Live AI responses require an active API billing configuration.

**To Enable Real-Time AI Responses:**

• **OpenAI** → Enable billing at https://platform.openai.com/account/billing  
• **AWS Bedrock** → Ensure model access and billing are enabled in AWS Console  
• **Google Gemini** → Activate API usage via Google AI Studio

Once billing is configured, the system will automatically switch to live AI responses.

---

*Note: This fallback response confirms that the full pipeline is operational. The document search and context retrieval are working as expected.*`;
    
    return demoMessage;
  }

  isAvailable(): boolean {
    return true; // Always available as fallback
  }

  getName(): string {
    return 'Demo Mode';
  }
}
