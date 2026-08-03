import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        canReview: false,
        reason: 'not-logged-in',
        message: 'Please login to review',
      });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    const existing = await prisma.review.findFirst({
      where: { productId, userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({
        canReview: false,
        reason: 'already-reviewed',
        message: 'You already reviewed this product',
        existingReview: existing,
      });
    }

    const delivered = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        orderStatus: 'Delivered',
        orderItems: { some: { productId } },
      },
    });

    if (!delivered) {
      return NextResponse.json({
        canReview: false,
        reason: 'not-purchased',
        message: 'You must purchase and receive this product to review',
      });
    }

    return NextResponse.json({
      canReview: true,
      isVerified: true,
      orderId: delivered.id,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}