import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { chunkText, cleanText } from '@documind/utils';
const PDFParser = require('pdf2json');

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  async extractText(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPdf(filePath);
      } else if (mimeType === 'text/plain') {
        return await this.extractTextFromTxt(filePath);
      } else {
        throw new BadRequestException(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to extract text: ${error.message}`);
      throw error;
    }
  }

  private async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      
      // Try parsing with pdf-parse first
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new BadRequestException('PDF contains no extractable text');
      }
      
      return cleanText(data.text);
    } catch (error) {
      this.logger.warn(`pdf-parse failed: ${error.message}, trying alternative parser`);
      
      // Try pdf2json as fallback
      try {
        const text = await this.extractWithPdf2Json(filePath);
        if (text && text.trim().length > 0) {
          this.logger.log('Successfully extracted text using pdf2json');
          return cleanText(text);
        }
      } catch (fallbackError) {
        this.logger.error(`pdf2json also failed: ${fallbackError.message}`);
      }
      
      throw new BadRequestException(
        `Failed to extract text from PDF. The file may be corrupted, password-protected, or contain only images. Please try converting it to a text file or use a different PDF.`
      );
    }
  }

  private async extractWithPdf2Json(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(errData.parserError));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let text = '';
          
          // Extract text from all pages
          if (pdfData.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const textItem of page.Texts) {
                  if (textItem.R) {
                    for (const run of textItem.R) {
                      if (run.T) {
                        text += decodeURIComponent(run.T) + ' ';
                      }
                    }
                  }
                }
                text += '\n';
              }
            }
          }
          
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });
      
      pdfParser.loadPDF(filePath);
    });
  }

  private async extractTextFromTxt(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return cleanText(content);
  }

  chunkDocument(text: string, chunkSize: number = 400, overlap: number = 50): string[] {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Document text is empty');
    }

    const chunks = chunkText(text, chunkSize, overlap);
    this.logger.log(`Created ${chunks.length} chunks from document`);
    
    return chunks;
  }
}
