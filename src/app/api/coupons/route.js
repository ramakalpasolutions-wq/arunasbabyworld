import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // ✅ Only cleanup coupons older than 7 days past expiry (not immediate)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.coupon.deleteMany({
      where: { expiryDate: { lt: sevenDaysAgo } },
    });

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Coupons GET error:', error);
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
    data.code = data.code.toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }

    // ✅ Validate expiry is in the future
    const expiryDate = new Date(data.expiryDate);
    if (expiryDate <= new Date()) {
      return NextResponse.json({ error: 'Expiry date must be in the future' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description || null,
        discountType: data.discountType || 'percentage',
        discountValue: parseFloat(data.discountValue),
        minOrderValue: parseFloat(data.minOrderValue || 0),
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        expiryDate,
        isActive: data.isActive !== false,
        applicableCategories: data.applicableCategories || [],
        categoryBrandExclusions: data.categoryBrandExclusions || {},
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error('Coupon POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });

    const data = await request.json();
    const updateData = {};

    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.discountType) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = parseFloat(data.discountValue);
    if (data.minOrderValue !== undefined) updateData.minOrderValue = parseFloat(data.minOrderValue || 0);
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount ? parseFloat(data.maxDiscount) : null;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit ? parseInt(data.usageLimit) : null;
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      if (expiryDate <= new Date()) {
        return NextResponse.json({ error: 'Expiry date must be in the future' }, { status: 400 });
      }
      updateData.expiryDate = expiryDate;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.applicableCategories !== undefined) updateData.applicableCategories = data.applicableCategories || [];
    if (data.categoryBrandExclusions !== undefined) updateData.categoryBrandExclusions = data.categoryBrandExclusions || {};

    const updated = await prisma.coupon.update({ where: { id }, data: updateData });
    return NextResponse.json({ coupon: updated });
  } catch (error) {
    console.error('Coupon PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    console.error('Coupon DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}