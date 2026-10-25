import { NextRequest, NextResponse } from 'next/server';
import { d1First } from '@/lib/d1';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization')) || req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await d1First<{ id: number; email: string; first_name: string; last_name: string }>(
    'SELECT id, email, first_name, last_name FROM users WHERE id = ?', [payload.userId],
  );

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
  });
}
