import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET — fetch all section settings
export async function GET() {
  try {
    const settings = await prisma.sectionSetting.findMany({
      orderBy: { order: 'asc' },
    });

    const result = {};
    settings.forEach(s => {
      result[s.key] = {
        id:          s.id,
        key:         s.key,
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

// POST — save all or single section setting
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { settings, single } = await req.json();

    // Create or update a single section
    if (single && single.key) {
      const setting = await prisma.sectionSetting.upsert({
        where: { key: single.key },
        update: {
          title:       single.title       ?? null,
          emoji:       single.emoji       ?? null,
          description: single.description ?? null,
          buttonText:  single.buttonText  ?? null,
          isVisible:   single.isVisible !== false,
          order:       single.order       ?? 0,
        },
        create: {
          key:         single.key,
          title:       single.title       ?? null,
          emoji:       single.emoji       ?? null,
          description: single.description ?? null,
          buttonText:  single.buttonText  ?? null,
          isVisible:   single.isVisible !== false,
          order:       single.order       ?? 0,
        },
      });
      return NextResponse.json({ success: true, setting });
    }

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

// DELETE — remove a section setting
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Section key required' }, { status: 400 });
    }

    // Safety check: Prevent deleting section if banners are still attached
    const bannerCount = await prisma.banner.count({ where: { type: key } });
    if (bannerCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete section with ${bannerCount} existing banner(s). Please delete or move the banners first.` },
        { status: 400 }
      );
    }

    await prisma.sectionSetting.deleteMany({
      where: { key },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Section settings DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}