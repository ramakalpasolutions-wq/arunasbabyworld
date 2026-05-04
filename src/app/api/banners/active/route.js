import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      banners,
      heroBanners:         banners.filter(b => b.type === 'hero' || !b.type),
      budgetBanners:       banners.filter(b => b.type === 'budget'),
      sunnyBanners:        banners.filter(b => b.type === 'sunny'),
      promoBanners:        banners.filter(b => b.type === 'promo'),
      genderBanners:       banners.filter(b => b.type === 'gender'),
      twoHeroBanners:      banners.filter(b => b.type === 'two-hero'),
      gradientBanners:     banners.filter(b => b.type === 'gradient-grid'),
      horizontalBanners:   banners.filter(b => b.type === 'horizontal-scroll'),
      fullPromoBanners:    banners.filter(b => b.type === 'full-promo'),
      asymmetricBanners:   banners.filter(b => b.type === 'asymmetric'),
      // ✅ New section banners with grid images
      maternityBanners:    banners.filter(b => b.type === 'maternity'),
      personalCareBanners: banners.filter(b => b.type === 'personal-care'),
      healthCareBanners:   banners.filter(b => b.type === 'health-care'),
    });
  } catch (error) {
    console.error('Active banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}