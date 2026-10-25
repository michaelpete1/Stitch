import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { d1First } from '@/lib/d1';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

async function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization')) || req.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const note = await d1First<{ object_key: string; file_name: string; mime_type: string | null }>(
    'SELECT object_key, file_name, mime_type FROM lecture_notes WHERE id = ? AND user_id = ?',
    [Number(id), user.userId],
  );
  if (!note) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const { env } = getCloudflareContext();
  const object = await env.UPLOADS.get(note.object_key);
  if (!object) return NextResponse.json({ error: 'File is unavailable' }, { status: 404 });

  const safeName = encodeURIComponent(note.file_name).replace(/[()']/g, (char) => `%${char.charCodeAt(0).toString(16)}`);
  return new NextResponse(object.body, {
    headers: {
      'Content-Type': note.mime_type || 'application/octet-stream',
      'Content-Length': String(object.size),
      'Content-Disposition': `attachment; filename*=UTF-8''${safeName}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
