import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { path, userId } = await req.json();

    if (!path || path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    // Next.js 15+ requires await cookies()
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('store_session')?.value;

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
    }

    try {
      await prisma.pageVisit.create({
        data: {
          sessionId,
          path,
          userId: userId || undefined,
        },
      });
    } catch (e) {
      console.log('Tracking skipped - Prisma model missing or DB issue');
    }

    const response = NextResponse.json({ sessionId });
    
    // Persist sessionId in browser cookie for 24 hours
    response.cookies.set('store_session', sessionId, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}