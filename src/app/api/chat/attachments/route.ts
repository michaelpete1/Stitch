import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { consumeChatRateLimit, getChatSession, rateLimitResponse, sessionJson, setChatSessionCookie } from '@/lib/anonymous-chat';
import { requireChatConsent, sameOriginError } from '@/lib/chat-consent';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 24_000;

export async function POST(request: NextRequest) {
  const session = getChatSession(request);
  const originError = sameOriginError(request, session);
  if (originError) return originError;
  const consentError = await requireChatConsent(session);
  if (consentError) return consentError;
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FILE_BYTES + 256_000) {
    return sessionJson(session, { error: 'Files must be 10 MB or smaller.' }, { status: 413 });
  }
  const respond = (body: object, status = 200) => {
    const response = NextResponse.json(body, { status });
    return session.needsCookie ? setChatSessionCookie(response, session.sessionId) : response;
  };

  try {
    const retryAfterSeconds = await consumeChatRateLimit(request, session.sessionId);
    if (retryAfterSeconds) {
      return respond(rateLimitResponse(retryAfterSeconds), 429);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return respond({ error: 'Choose a file to attach.' }, 400);
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return respond({ error: 'Files must be between 1 byte and 10 MB.' }, 400);
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx', 'txt'].includes(extension)) {
      return respond({ error: 'Supported file types are PDF, DOCX, and TXT.' }, 415);
    }

    let text = '';
    try {
      if (extension === 'pdf') {
        text = (await pdfParse(Buffer.from(await file.arrayBuffer()))).text;
      } else if (extension === 'docx') {
        text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
      } else {
        text = await file.text();
      }
    } catch {
      return respond({ error: 'We could not read this file. Check that it is not damaged or password-protected.' }, 422);
    }

    text = text.trim();
    if (!text) {
      return respond({ error: 'No readable text was found. Scanned PDFs need OCR before they can be attached.' }, 422);
    }

    return respond({
      attachment: {
        name: file.name.slice(0, 180),
        text: text.slice(0, MAX_EXTRACTED_CHARS),
        truncated: text.length > MAX_EXTRACTED_CHARS,
      },
    }, 201);
  } catch (error) {
    console.error('Chat attachment extraction failed:', error);
    return respond({ error: 'Could not prepare this attachment. Please try again.' }, 500);
  }
}
