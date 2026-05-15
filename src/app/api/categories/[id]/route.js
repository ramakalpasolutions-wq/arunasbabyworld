import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id }     = await params;
    const category   = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const data   = await request.json();

    const ALLOWED_SLUGS = [
      'clothing', 'personal-care', 'health-care', 'baby-gear',
      'walkers', 'toys', 'cradles-cribs', 'electric-vehicles', 'food',
    ];

    // ✅ Slug override map
    const SLUG_OVERRIDE = {
      'food & nutrition':  'food',
      'food nutrition':    'food',
      'food and nutrition':'food',
      'cradles & cribs':   'cradles-cribs',
      'cradles and cribs': 'cradles-cribs',
      'personal care':     'personal-care',
      'health care':       'health-care',
      'baby gear':         'baby-gear',
      'electric vehicles': 'electric-vehicles',
    };

    const updateData = {};

    if (data.name !== undefined && data.name !== null) {
      updateData.name = data.name;

      // ✅ Generate slug correctly using override map
      const lower = data.name.toLowerCase().trim();
      const slug  = SLUG_OVERRIDE[lower] || lower
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // ✅ Only update slug if it's a valid allowed slug
      if (ALLOWED_SLUGS.includes(slug)) {
        updateData.slug  = slug;
        updateData.order = ALLOWED_SLUGS.indexOf(slug);
      }
      // If not in allowed list, just update name, keep existing slug
    }

    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon        !== undefined) updateData.icon        = data.icon;
    if (data.color       !== undefined) updateData.color       = data.color;
    if (data.isActive    !== undefined) updateData.isActive    = data.isActive;
    if (data.order       !== undefined) updateData.order       = parseInt(data.order) || 0;
    if (data.type        !== undefined) updateData.type        = data.type;
    if (data.banner      !== undefined) updateData.banner      = data.banner;
    if (data.gridImages  !== undefined) updateData.gridImages  = data.gridImages;

    const category = await prisma.category.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Category PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${productCount} product(s) use this category` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}