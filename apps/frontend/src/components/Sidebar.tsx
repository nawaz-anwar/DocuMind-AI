import { Document } from '@documind/shared-types';
import { useEffect } from 'react';

interface SidebarProps {
  documents: Document[];
  selectedDocumentId: string | null;
  onDocumentSelect: (documentId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function Sidebar({ 
  documents, 
  selectedDocumentId,
  onDocumentSelect,
  isOpen, 
  onClose, 
  onRefresh 
}: SidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Refresh documents"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-4">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">No documents yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onDocumentSelect(doc.id)}
                  className={`p-3 border rounded-lg transition-all cursor-pointer ${
                    selectedDocumentId === doc.id
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {doc.mimeType === 'application/pdf' ? (
                        <svg className={`w-5 h-5 ${selectedDocumentId === doc.id ? 'text-indigo-600' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${selectedDocumentId === doc.id ? 'text-indigo-600' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium truncate ${
                        selectedDocumentId === doc.id ? 'text-indigo-900' : 'text-gray-800'
                      }`}>
                        {doc.originalName}
                      </h3>
                      <div className={`flex items-center gap-2 mt-1 text-xs ${
                        selectedDocumentId === doc.id ? 'text-indigo-600' : 'text-gray-500'
                      }`}>
                        <span>{formatSize(doc.size)}</span>
                        <span>•</span>
                        <span>{doc.chunkCount} chunks</span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        selectedDocumentId === doc.id ? 'text-indigo-500' : 'text-gray-400'
                      }`}>
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>

                    {/* Selected indicator */}
                    {selectedDocumentId === doc.id && (
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} uploaded
          </div>
        </div>
      </aside>
    </>
  );
}
