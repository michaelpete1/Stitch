import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function getChatUser(request: NextRequest): Promise<{ userId: number; email: string } | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (typeof payload?.userId !== 'number' || typeof payload.email !== 'string') return null;
  return { userId: payload.userId, email: payload.email };
}

export async function getChatUserId(request: NextRequest): Promise<number | null> {
  const user = await getChatUser(request);
  return user?.userId ?? null;
}
