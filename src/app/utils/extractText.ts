// Text extraction from PDF/DOCX must be done server-side due to Node.js-only dependencies (e.g., pdf-parse uses 'fs').
// Move extraction logic to a Next.js API route and call it from the client.

import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export async function extractTextFromFile(file: File, fileType: string): Promise<string> {
  if (fileType === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  } else if (fileType === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    return data.text;
  } else if (fileType === "txt") {
    return await file.text();
  }
  // Add more types as needed
  return "";
} 