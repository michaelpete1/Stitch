import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export const runtime = 'nodejs'; // Ensure this runs in a Node.js environment

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let text = '';

  try {
    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      text = value;
    } else if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (ext === 'txt') {
      text = await file.text();
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
  }

  return NextResponse.json({ text });
} 