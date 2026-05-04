import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Banners GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();

    const bannerData = {
      title:      body.title,
      subtitle:   body.subtitle   || null,
      buttonText: body.buttonText || 'Shop Now',
      buttonLink: body.buttonLink || '/products',
      bgColor:    body.bgColor    || '#ff6b9d',
      isActive:   body.isActive !== false,
      order:      parseInt(body.order) || 0,
      type:       body.type   || 'hero',
      emoji:      body.emoji  || null,
      price:      body.price  ? parseFloat(body.price) : null,
      offer:      body.offer  || null,
      color:      body.color  || null,
      slug:       body.slug   || null,
      gender:     body.gender || null,
    };

    // ✅ image — use set wrapper for MongoDB embedded type
    // ✅ image — only url and publicId (no title — not in old schema)
if (body.image?.url) {
  bannerData.image = {
    set: {
      url:      body.image.url      || '',
      publicId: body.image.publicId || '',
    }
  };
}

    // ✅ gridImages — use set wrapper
    bannerData.gridImages = {
      set: (body.gridImages || []).map(img => ({
        url:      img.url      || '',
        publicId: img.publicId || '',
        title:    img.title    || '',
        link:     img.link     || '',
        brand:    img.brand    || '',
        price:    img.price    ? parseFloat(img.price) : null,
      }))
    };

    const banner = await prisma.banner.create({ data: bannerData });
    return NextResponse.json({ banner }, { status: 201 });

  } catch (error) {
    console.error('Banners POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}