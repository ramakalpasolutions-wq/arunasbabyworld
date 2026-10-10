import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { path, userId } = await req.json();

    if (!path || path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    const cookieStore = cookies();
    let sessionId = cookieStore.get('store_session')?.value;

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
    }

    try {
      await prisma.pageVisit.create({
        data: {
          sessionId,
          path,
          userId: userId || null,
        },
      });
    } catch (e) {
      console.log('Tracking skipped - Prisma model missing');
    }

    return NextResponse.json({ sessionId });
  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}