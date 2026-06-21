import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Utility for extracting raw text from medical PDF reports.
 * This allows textual analysis which is more accurate than 
 * vision-based analysis for lab results.
 */
export async function extractTextFromPDF(dataBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(dataBuffer);
    
    // Clean and return extracted text
    return data.text
      .replace(/\n\s*\n/g, '\n') // Remove excessive empty lines
      .trim();
  } catch (error) {
    console.error('❌ PDF Extraction Error:', error);
    throw new Error('Failed to extract text from PDF report');
  }
}
