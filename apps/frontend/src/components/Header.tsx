import { ChatMessage } from '@documind/shared-types';
import ExportButton from './ExportButton';

interface HeaderProps {
  onUploadClick: () => void;
  onSidebarToggle: () => void;
  documentCount: number;
  chatHistory: ChatMessage[];
}

export default function Header({ onUploadClick, onSidebarToggle, documentCount, chatHistory }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle */}
        <button
          onClick={onSidebarToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo & Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">D</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
            DocuMind AI
          </h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Export Button */}
        {chatHistory.length > 0 && (
          <ExportButton chatHistory={chatHistory} documentName="Chat Session" />
        )}

        {/* Document Count Badge */}
        {documentCount > 0 && (
          <button
            onClick={onSidebarToggle}
            className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{documentCount} {documentCount === 1 ? 'document' : 'documents'}</span>
          </button>
        )}

        {/* Upload Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>
    </header>
  );
}
