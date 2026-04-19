import { ChatMessage } from '@documind/shared-types';
import { useState } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  
  // Check if this is a demo mode response
  const isDemoMode = message.answer.includes('Demo Mode') || message.answer.includes('demo mode');

  return (
    <div className="space-y-4">
      {/* User Question */}
      <div className="flex justify-end">
        <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3 max-w-[80%] shadow-sm">
          <p className="text-sm leading-relaxed">{message.question}</p>
        </div>
      </div>
      
      {/* AI Answer */}
      <div className="flex justify-start">
        <div className={`rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border ${
          isDemoMode 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start gap-3">
            {/* AI Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              isDemoMode
                ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isDemoMode ? 'text-gray-900' : 'text-gray-800'
              }`}>
                {message.answer}
              </p>
              
              {/* Sources */}
              {message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${showSources ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showSources && (
                    <div className="mt-2 space-y-2">
                      {message.sources.map((source, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-700 truncate flex-1">
                              {source.documentName}
                            </span>
                            <span className="text-indigo-600 font-semibold ml-2 flex-shrink-0">
                              {(source.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-gray-600 line-clamp-2 leading-relaxed">
                            {source.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
