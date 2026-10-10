import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { path } = await req.json();

    if (!path || path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ ok: true });
    }

    // Attempt to log page view into database if model exists, or upsert analytics
    try {
      await prisma.pageVisit?.create({
        data: { path, createdAt: new Date() }
      });
    } catch {
      // Graceful fallback if PageVisit table isn't migrated yet
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}