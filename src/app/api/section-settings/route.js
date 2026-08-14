import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — fetch all section settings
export async function GET() {
  try {
    const settings = await prisma.sectionSetting.findMany({
      orderBy: { order: 'asc' },
    });

    const result = {};
    settings.forEach(s => {
      result[s.key] = {
        title:       s.title,
        emoji:       s.emoji,
        description: s.description,
        buttonText:  s.buttonText,
        isVisible:   s.isVisible !== false,
        order:       s.order || 0,
      };
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
      return NextResponse.json(
        { error: 'No settings provided' },
        { status: 400 }
      );
    }

    const promises = Object.entries(settings).map(([key, value]) =>
      prisma.sectionSetting.upsert({
        where:  { key },
        update: {
          title:       value.title       ?? null,
          emoji:       value.emoji       ?? null,
          description: value.description ?? null,
          buttonText:  value.buttonText  ?? null,
          isVisible:   value.isVisible !== false,
          order:       value.order       ?? 0,
        },
        create: {
          key,
          title:       value.title       ?? null,
          emoji:       value.emoji       ?? null,
          description: value.description ?? null,
          buttonText:  value.buttonText  ?? null,
          isVisible:   value.isVisible !== false,
          order:       value.order       ?? 0,
        },
      })
    );

    await Promise.all(promises);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Section settings POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save' },
      { status: 500 }
    );
  }
}