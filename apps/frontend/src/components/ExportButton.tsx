import { useState } from 'react';
import { ChatMessage } from '@documind/shared-types';
import { exportChatToPDF, getExportSummary } from '../utils/pdfExport';

interface ExportButtonProps {
  chatHistory: ChatMessage[];
  documentName?: string;
}

export default function ExportButton({ chatHistory, documentName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleExport = async () => {
    if (chatHistory.length === 0) {
      alert('No chat history to export');
      return;
    }

    setIsExporting(true);

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      exportChatToPDF(chatHistory, {
        documentName: documentName || 'Chat Session',
        includeTimestamps: true,
        includeSources: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const summary = chatHistory.length > 0 ? getExportSummary(chatHistory) : null;

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting || chatHistory.length === 0}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Export chat as PDF"
      >
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Exporting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export PDF</span>
          </>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && summary && chatHistory.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 z-50">
          <div className="space-y-1">
            <p className="font-semibold">Export Summary</p>
            <p>• {summary.messageCount} message{summary.messageCount !== 1 ? 's' : ''}</p>
            <p>• {summary.totalSources} source{summary.totalSources !== 1 ? 's' : ''}</p>
            <p>• ~{summary.estimatedPages} page{summary.estimatedPages !== 1 ? 's' : ''}</p>
          </div>
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}
    </div>
  );
}
