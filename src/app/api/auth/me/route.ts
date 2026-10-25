import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
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

  const user = db.prepare('SELECT id, email, first_name, last_name FROM users WHERE id = ?').get(payload.userId) as
    | { id: number; email: string; first_name: string; last_name: string }
    | undefined;

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
  });
}