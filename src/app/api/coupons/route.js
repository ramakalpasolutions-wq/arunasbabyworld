import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ✅ Helper: Auto-delete expired coupons
async function cleanupExpiredCoupons() {
  try {
    const result = await prisma.coupon.deleteMany({
      where: {
        expiryDate: { lt: new Date() },
      },
    });
    if (result.count > 0) {
      console.log(`🗑️ Auto-deleted ${result.count} expired coupon(s)`);
    }
    return result.count;
  } catch (err) {
    console.error('Cleanup error:', err);
    return 0;
  }
}

// ════════════════════════════════════
// GET — Fetch all coupons (auto-cleanup runs first)
// ════════════════════════════════════
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // ✅ Auto-cleanup expired coupons before fetching
    const deletedCount = await cleanupExpiredCoupons();

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons, deletedExpired: deletedCount });
  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ════════════════════════════════════
// POST — Create coupon
// ════════════════════════════════════
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const data = await request.json();
    data.code = data.code.toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    const couponData = {
      code:                 data.code,
      description:          data.description          || null,
      discountType:         data.discountType         || 'percentage',
      discountValue:        parseFloat(data.discountValue),
      minOrderValue:        parseFloat(data.minOrderValue || 0),
      maxDiscount:          data.maxDiscount ? parseFloat(data.maxDiscount) : null,
      usageLimit:           data.usageLimit  ? parseInt(data.usageLimit)   : null,
      expiryDate:           new Date(data.expiryDate),
      isActive:             data.isActive !== false,
      applicableCategories: data.applicableCategories || [],
    };

    const coupon = await prisma.coupon.create({ data: couponData });
    return NextResponse.json({ coupon }, { status: 201 });

  } catch (error) {
    console.error('Coupon POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════
// ✅ DELETE — Delete coupon by ID
// ════════════════════════════════════
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    console.error('Coupon DELETE error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}