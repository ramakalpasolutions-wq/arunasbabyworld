import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const heroBanners = banners.filter(b => b.type === 'hero' || !b.type);
    const budgetBanners = banners.filter(b => b.type === 'budget');
    const sunnyBanners = banners.filter(b => b.type === 'sunny');
    const promoBanners = banners.filter(b => b.type === 'promo');
    // ✅ Gender banners
    const genderBanners = banners.filter(b => b.type === 'gender');

    return NextResponse.json({
      banners,
      heroBanners,
      budgetBanners,
      sunnyBanners,
      promoBanners,
      genderBanners,
    });
  } catch (error) {
    console.error('Active banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}