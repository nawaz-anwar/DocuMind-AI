interface EmptyStateProps {
  hasDocuments: boolean;
}

export default function EmptyState({ hasDocuments }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full px-4">
      <div className="text-center max-w-md">
        {hasDocuments ? (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Ready to chat!
            </h2>
            <p className="text-gray-600 text-sm">
              Ask me anything about your uploaded documents. I'll search through them and provide accurate answers with sources.
            </p>
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Try asking:
              </p>
              <div className="space-y-2">
                {[
                  "What is this document about?",
                  "Summarize the key points",
                  "What are the main concepts?",
                ].map((example, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200"
                  >
                    "{example}"
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No documents yet
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Upload a PDF or text document to start chatting with your content using AI.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <span>Click "Upload" to get started</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
