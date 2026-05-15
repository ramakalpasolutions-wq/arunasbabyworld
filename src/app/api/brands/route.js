import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where:   { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const brandData = {
      name:     body.name.trim(),
      color:    body.color    || '#FF6B35',
      link:     body.link     || '/products',
      isActive: body.isActive !== false,
      order:    parseInt(body.order) || 0,
    };

    if (body.logo?.url) {
      brandData.logo = {
        url:      body.logo.url,
        publicId: body.logo.publicId || '',
      };
    }

    const brand = await prisma.brand.create({ data: brandData });
    return NextResponse.json({ brand }, { status: 201 });

  } catch (error) {
    console.error('Brands POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}