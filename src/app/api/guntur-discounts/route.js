import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET — Public: Fetch all active Guntur food discount rules
export async function GET() {
  try {
    const discounts = await prisma.gunturFoodDiscount.findMany({
      where: { isActive: true },
      orderBy: { brand: 'asc' },
    });

    return NextResponse.json({ discounts });
  } catch (error) {
    console.error('Guntur discounts GET error:', error);
    return NextResponse.json({ discounts: [] }, { status: 500 });
  }
}

// POST — Admin: Create new brand discount rule
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { brand, discountPercent, isActive } = body;

    if (!brand?.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    if (!discountPercent || discountPercent <= 0 || discountPercent > 100) {
      return NextResponse.json({ error: 'Discount must be between 1 and 100' }, { status: 400 });
    }

    // Check if brand rule already exists
    const existing = await prisma.gunturFoodDiscount.findUnique({
      where: { brand: brand.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: `Discount rule for "${brand}" already exists. Edit it instead.` }, { status: 409 });
    }

    const discount = await prisma.gunturFoodDiscount.create({
      data: {
        brand: brand.trim(),
        discountPercent: Number(discountPercent),
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error('Guntur discount POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create discount rule' }, { status: 500 });
  }
}

// PUT — Admin: Update existing brand discount rule
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Discount rule ID required' }, { status: 400 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.brand !== undefined) updateData.brand = body.brand.trim();
    if (body.discountPercent !== undefined) updateData.discountPercent = Number(body.discountPercent);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prisma.gunturFoodDiscount.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ discount: updated });
  } catch (error) {
    console.error('Guntur discount PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}

// DELETE — Admin: Remove brand discount rule
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Discount rule ID required' }, { status: 400 });
    }

    await prisma.gunturFoodDiscount.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Discount rule deleted' });
  } catch (error) {
    console.error('Guntur discount DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}