import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const data = await request.json();
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const categoryData = {
      name: data.name,
      slug,
      description: data.description || null,
      icon: data.icon || null,
      color: data.color || '#ff6b9d',
      isActive: data.isActive !== false,
      order: parseInt(data.order) || 0,
      type: data.type || 'normal',
    };

    if (data.banner && data.banner.url) {
      categoryData.banner = data.banner;
    }

    if (data.gridImages && data.gridImages.length > 0) {
      categoryData.gridImages = data.gridImages;
    }

    const category = await prisma.category.create({ data: categoryData });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}