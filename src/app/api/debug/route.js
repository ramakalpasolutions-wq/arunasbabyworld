import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { adminGuard } from '@/lib/auth';

export async function GET() {
  // Admin only
  const denied = await adminGuard();
  if (denied) return denied;

  try {
    const all = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });

    const active = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      totalAll:    all.length,
      totalActive: active.length,
      allTypes:    all.map(b => ({ type: b.type, isActive: b.isActive, title: b.title })),
      maternity:    active.filter(b => b.type === 'maternity').map(b => ({
        id: b.id, title: b.title, isActive: b.isActive,
        hasImage: !!b.image?.url,
        gridCount: b.gridImages?.length || 0,
      })),
      personalCare: active.filter(b => b.type === 'personal-care').map(b => ({
        id: b.id, title: b.title, isActive: b.isActive,
        hasImage: !!b.image?.url,
        gridCount: b.gridImages?.length || 0,
      })),
      healthCare:   active.filter(b => b.type === 'health-care').map(b => ({
        id: b.id, title: b.title, isActive: b.isActive,
        hasImage: !!b.image?.url,
        gridCount: b.gridImages?.length || 0,
      })),
    });
  } catch (err) {
    return NextResponse.json({
      error: err.message,
      code:  err.code,
    }, { status: 500 });
  }
}