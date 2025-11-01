import { uploadPDF, generatePDFFilename } from './cloudinary'

export interface PDFStorageResult {
  fileUrl: string
  filename: string
  size: number
}

export async function storePDF(
  pdfBuffer: Buffer,
  candidateNumber: string,
  testTitle: string
): Promise<PDFStorageResult> {
  try {
    const filename = generatePDFFilename(candidateNumber, testTitle)
    const result = await uploadPDF(pdfBuffer, filename)
    
    return {
      fileUrl: result.secure_url,
      filename,
      size: result.bytes
    }
  } catch (error) {
    console.error('Error storing PDF:', error)
    throw new Error('Failed to store PDF file')
  }
}

export function getPDFDownloadUrl(fileUrl: string): string {
  // Return the direct URL for download
  return fileUrl
}

export function validatePDFBuffer(buffer: Buffer): boolean {
  // Check if buffer starts with PDF header
  const pdfHeader = buffer.slice(0, 4).toString()
  return pdfHeader === '%PDF'
}

export function getPDFSize(buffer: Buffer): number {
  return buffer.length
}

export function generatePDFMetadata(
  candidateNumber: string,
  testTitle: string,
  bands: {
    listening: number
    reading: number
    writing: number
    speaking: number
    overall: number
  }
) {
  return {
    candidateNumber,
    testTitle,
    bands,
    generatedAt: new Date().toISOString(),
    version: '1.0'
  }
}
