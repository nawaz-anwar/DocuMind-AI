declare module 'pdf2json' {
  class PDFParser {
    constructor(context: any, needRawText: number);
    on(event: string, callback: (data: any) => void): void;
    loadPDF(filePath: string): void;
  }
  export = PDFParser;
}
