// src/app/api/banners/active/route.js
import { NextResponse } from 'next/server';
import { getActiveBanners } from '@/lib/storefrontData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getActiveBanners();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('❌ Active banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
