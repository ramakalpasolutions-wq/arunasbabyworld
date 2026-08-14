import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { name: true, slug: true } } },
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product GET error:', error);
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
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const data = await request.json();

    if (data.discountPrice && data.price) {
      data.discountPercent = Math.round(
        ((data.price - data.discountPrice) / data.price) * 100
      );
    }

    // ✅ Handle color variants
    if (Array.isArray(data.colorVariants) && data.colorVariants.length > 0) {
      data.hasVariants = true;
      data.colorVariants = data.colorVariants.map(v => ({
        colorName:     v.colorName     || '',
        colorHex:      v.colorHex      || '#000000',
        price:         v.price         ? parseFloat(v.price) : parseFloat(data.price || 0),
        discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
        stock:         parseInt(v.stock) || 0,
        sizes:         Array.isArray(v.sizes) ? v.sizes : [],
        images:        Array.isArray(v.images) ? v.images.filter(Boolean) : [],
        sku:           v.sku || '',
      }));

      // ✅ Total stock = sum of variant stocks
      data.stock = data.colorVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    } else {
      data.hasVariants = false;
      data.colorVariants = [];
    }

    // ✅ Convert numeric fields
    if (data.price !== undefined)         data.price         = parseFloat(data.price);
    if (data.discountPrice !== undefined && data.discountPrice !== null) {
      data.discountPrice = parseFloat(data.discountPrice);
    }
    if (data.stock !== undefined)         data.stock         = parseInt(data.stock);

    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.category;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}