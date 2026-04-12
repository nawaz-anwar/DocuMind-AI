import { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import UploadModal from './components/UploadModal';
import Sidebar from './components/Sidebar';
import { Document, ChatMessage } from '@documind/shared-types';
import { getDocuments } from './api/client';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleUploadSuccess = (document: Document) => {
    setDocuments(prev => [document, ...prev]);
    setIsUploadModalOpen(false);
  };

  const handleNewMessage = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  };

  const hasDocuments = documents.length > 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onRefresh={loadDocuments}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header
          onUploadClick={() => setIsUploadModalOpen(true)}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          documentCount={documents.length}
          chatHistory={chatHistory}
        />

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            chatHistory={chatHistory}
            onNewMessage={handleNewMessage}
            hasDocuments={hasDocuments}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default App;
