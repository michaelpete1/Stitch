import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  const note = db.prepare(
    'SELECT file_name, file_path, mime_type FROM lecture_notes WHERE id = ? AND user_id = ?',
  ).get(Number(id), user.userId) as { file_name: string; file_path: string; mime_type: string | null } | undefined;
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  try {
    const file = await readFile(note.file_path);
    const body = new Uint8Array(file.byteLength);
    body.set(file);
    const safeName = encodeURIComponent(note.file_name).replace(/['()]/g, (char) =>
      `%${char.charCodeAt(0).toString(16)}`,
    );
    return new NextResponse(body, {
      headers: {
        'Content-Type': note.mime_type || 'application/octet-stream',
        'Content-Length': String(file.byteLength),
        'Content-Disposition': `attachment; filename*=UTF-8''${safeName}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File is unavailable' }, { status: 404 });
  }
}
