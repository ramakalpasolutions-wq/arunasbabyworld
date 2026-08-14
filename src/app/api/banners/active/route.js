// src/app/api/banners/active/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();

    const [banners, brands] = await Promise.all([
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    // ✅ SMART festival filter — no dates means ALWAYS SHOW
    const allFestivals = banners.filter(b => b.type === 'festival');
    
    const festivalBanners = allFestivals.filter(b => {
      const hasStart = b.startDate != null;
      const hasEnd   = b.endDate   != null;
      
      // No dates → ALWAYS SHOW
      if (!hasStart && !hasEnd) return true;
      
      // Only start date → show if started
      if (hasStart && !hasEnd) return new Date(b.startDate) <= now;
      
      // Only end date → show if not yet ended
      if (!hasStart && hasEnd) return new Date(b.endDate) >= now;
      
      // Both dates → must be in range
      return new Date(b.startDate) <= now && new Date(b.endDate) >= now;
    });

    // ✅ DEBUG LOG — Check your terminal!
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎪 FESTIVAL BANNER DEBUG');
    console.log(`📊 Total festival in DB: ${allFestivals.length}`);
    console.log(`✅ After filter (showing): ${festivalBanners.length}`);
    console.log(`⏰ Server time: ${now.toISOString()}`);
    
    allFestivals.forEach((f, i) => {
      console.log(`\n   [${i + 1}] "${f.title}"`);
      console.log(`       isActive:  ${f.isActive}`);
      console.log(`       startDate: ${f.startDate || '❌ not set'}`);
      console.log(`       endDate:   ${f.endDate   || '❌ not set'}`);
      console.log(`       hasImage:  ${!!f.image?.url}`);
      
      if (f.startDate && new Date(f.startDate) > now) {
        console.log(`       ⚠️  EXCLUDED: starts in FUTURE`);
      }
      if (f.endDate && new Date(f.endDate) < now) {
        console.log(`       ⚠️  EXCLUDED: already ENDED`);
      }
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const response = NextResponse.json({
      banners,
      brands,
      heroBanners:          banners.filter(b => b.type === 'hero' || !b.type),
      categoryBanners:      banners.filter(b => b.type === 'category'),
      festivalBanners,
      budgetBanners:        banners.filter(b => b.type === 'budget'),
      sunnyBanners:         banners.filter(b => b.type === 'sunny'),
      promoBanners:         banners.filter(b => b.type === 'promo'),
      genderBanners:        banners.filter(b => b.type === 'gender'),
      personalCareBanners:  banners.filter(b => b.type === 'personal-care'),
      healthCareBanners:    banners.filter(b => b.type === 'health-care'),
      evBanners:            banners.filter(b => b.type === 'electric-vehicle'),
      babyFoodBanners:      banners.filter(b => b.type === 'baby-food'),
      toysBanners:          banners.filter(b => b.type === 'toys'),
      maternityBanners:     banners.filter(b => b.type === 'maternity'),
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('❌ Active banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}