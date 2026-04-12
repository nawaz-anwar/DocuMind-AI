import jsPDF from 'jspdf';
import { ChatMessage } from '@documind/shared-types';

interface ExportOptions {
  documentName?: string;
  includeTimestamps?: boolean;
  includeSources?: boolean;
}

export function exportChatToPDF(
  chatHistory: ChatMessage[],
  options: ExportOptions = {}
): void {
  const {
    documentName = 'Chat Session',
    includeTimestamps = true,
    includeSources = true,
  } = options;

  if (chatHistory.length === 0) {
    alert('No chat history to export');
    return;
  }

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold' = 'normal',
    color: [number, number, number] = [0, 0, 0]
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;

    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    }
  };

  // Add header
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DocuMind AI', margin, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Chat Export', margin, 30);

  yPosition = 50;

  // Add document info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document: ${documentName}`, margin, yPosition);
  yPosition += 6;

  const exportDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Exported: ${exportDate}`, margin, yPosition);
  yPosition += 6;

  doc.text(`Total Messages: ${chatHistory.length}`, margin, yPosition);
  yPosition += 10;

  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Add chat messages
  chatHistory.forEach((message, index) => {
    checkPageBreak(20);

    // Message number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(`Message ${index + 1}`, margin, yPosition);
    yPosition += 5;

    // Timestamp (optional)
    if (includeTimestamps && message.timestamp) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      const timestamp = new Date(message.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(timestamp, margin, yPosition);
      yPosition += 6;
    }

    // User question
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('User:', margin, yPosition);
    yPosition += 5;

    addText(message.question, 10, 'normal', [50, 50, 50]);
    yPosition += 3;

    // AI answer
    checkPageBreak(15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246); // Purple-500
    doc.text('AI:', margin, yPosition);
    yPosition += 5;

    addText(message.answer, 10, 'normal', [50, 50, 50]);
    yPosition += 3;

    // Sources (optional)
    if (includeSources && message.sources && message.sources.length > 0) {
      checkPageBreak(15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(`Sources (${message.sources.length}):`, margin, yPosition);
      yPosition += 5;

      message.sources.forEach((source, sourceIndex) => {
        checkPageBreak(12);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        
        const sourceText = `${sourceIndex + 1}. ${source.documentName} (${(source.similarity * 100).toFixed(0)}% match)`;
        doc.text(sourceText, margin + 3, yPosition);
        yPosition += 4;

        // Source excerpt
        const excerpt = source.text.substring(0, 150) + (source.text.length > 150 ? '...' : '');
        const excerptLines = doc.splitTextToSize(excerpt, maxWidth - 6);
        
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        excerptLines.forEach((line: string) => {
          checkPageBreak(3);
          doc.text(line, margin + 6, yPosition);
          yPosition += 3;
        });
        
        yPosition += 2;
      });
    }

    // Add separator between messages
    yPosition += 5;
    checkPageBreak(5);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  });

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    
    const footerText = `Page ${i} of ${totalPages}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
    
    doc.text('Generated by DocuMind AI', margin, pageHeight - 10);
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `documind-chat-${timestamp}.pdf`;

  // Save the PDF
  doc.save(filename);
}

export function getExportSummary(chatHistory: ChatMessage[]): {
  messageCount: number;
  totalSources: number;
  estimatedPages: number;
} {
  const messageCount = chatHistory.length;
  const totalSources = chatHistory.reduce((sum, msg) => sum + (msg.sources?.length || 0), 0);
  
  // Rough estimation: ~3-4 messages per page
  const estimatedPages = Math.ceil(messageCount / 3) + 1; // +1 for header

  return {
    messageCount,
    totalSources,
    estimatedPages,
  };
}
