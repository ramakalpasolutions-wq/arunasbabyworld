import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — fetch all section settings
export async function GET() {
  try {
    const settings = await prisma.sectionSetting.findMany();
    const result = {};
    settings.forEach(s => {
      result[s.key] = { title: s.title, emoji: s.emoji };
    });
    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('Section settings GET error:', error);
    return NextResponse.json({ settings: {} });
  }
}

// POST — save all section settings
export async function POST(req) {
  try {
    const { settings } = await req.json();
    if (!settings) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
    }

    // Upsert each section setting
    const promises = Object.entries(settings).map(([key, value]) =>
      prisma.sectionSetting.upsert({
        where:  { key },
        update: { title: value.title || null, emoji: value.emoji || null },
        create: { key,   title: value.title || null, emoji: value.emoji || null },
      })
    );

    await Promise.all(promises);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Section settings POST error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}