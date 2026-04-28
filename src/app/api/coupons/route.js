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
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ coupons });
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

    // ✅ Convert expiryDate string to proper DateTime
    const couponData = {
      code: data.code,
      description: data.description || null,
      discountType: data.discountType || 'percentage',
      discountValue: parseFloat(data.discountValue),
      minOrderValue: parseFloat(data.minOrderValue || 0),
      maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
      expiryDate: new Date(data.expiryDate), // ✅ Convert to Date object
      isActive: data.isActive !== false,
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