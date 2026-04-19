import { useState, useRef, useEffect } from 'react';
import { queryDocuments } from '../api/client';
import { ChatMessage } from '@documind/shared-types';
import { generateId } from '../utils/helpers';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  hasDocuments: boolean;
  selectedDocumentId: string | null;
  selectedDocumentName?: string;
}

export default function ChatInterface({ 
  chatHistory, 
  onNewMessage, 
  hasDocuments,
  selectedDocumentId,
  selectedDocumentName 
}: ChatInterfaceProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading || !hasDocuments || !selectedDocumentId) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsLoading(true);

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      console.log('[QUERY] Sending query:', { question: userQuestion, documentId: selectedDocumentId });
      const response = await queryDocuments(userQuestion, selectedDocumentId);
      console.log('[QUERY] Received response:', response);
      
      const message: ChatMessage = {
        id: generateId(),
        question: userQuestion,
        answer: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      onNewMessage(message);
    } catch (error: any) {
      console.error('[QUERY] Error:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        question: userQuestion,
        answer: error.response?.data?.message || 'Failed to get answer. Please try again.',
        sources: [],
        timestamp: new Date(),
      };
      onNewMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const isDisabled = isLoading || !hasDocuments || !selectedDocumentId;
  const placeholderText = !hasDocuments 
    ? "Upload a document to start chatting"
    : !selectedDocumentId
    ? "Select a document from the sidebar"
    : `Ask a question about ${selectedDocumentName || 'your document'}...`;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {chatHistory.length === 0 && !isLoading ? (
          <EmptyState hasDocuments={hasDocuments} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {chatHistory.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={question}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                disabled={isDisabled}
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                style={{ maxHeight: '200px' }}
              />
              
              {/* Character count or hint */}
              {question.length > 0 && (
                <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                  {question.length}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isDisabled || !question.trim()}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {!hasDocuments && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please upload a document to start asking questions
            </p>
          )}
          {hasDocuments && !selectedDocumentId && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please select a document from the sidebar
            </p>
          )}
          {selectedDocumentName && (
            <p className="text-xs text-gray-600 mt-2 text-center">
              Chatting with: <span className="font-medium">{selectedDocumentName}</span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
