// @ts-ignore: No types for 'pdf-parse'
import mammoth from "mammoth";
// @ts-ignore: No types for 'pdf-parse'
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