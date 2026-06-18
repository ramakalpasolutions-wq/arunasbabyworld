import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================
// ✅ GET — List all refunds (admin only)
// ============================================================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = {};
    if (status && status !== 'all') where.refundStatus = status;

    const total = await prisma.refund.count({ where });
    const refunds = await prisma.refund.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enriched = await Promise.all(
      refunds.map(async (r) => {
        const [user, order] = await Promise.all([
          prisma.user.findUnique({
            where: { id: r.userId },
            select: { name: true, email: true, phone: true },
          }),
          prisma.order.findUnique({
            where: { id: r.orderId },
            select: {
              id: true, totalPrice: true, paymentMethod: true,
              isPaid: true, isDelivered: true, orderItems: true,
              shippingAddress: true,
            },
          }),
        ]);
        return { ...r, user, order };
      })
    );

    return NextResponse.json({
      refunds: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Refunds GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// ✅ PUT — Admin updates refund status (manual transfers)
// ============================================================
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { refundId, refundStatus, notes } = body;

    if (!refundId || !refundStatus) {
      return NextResponse.json(
        { error: 'refundId and refundStatus required' },
        { status: 400 }
      );
    }

    const updateData = {
      refundStatus,
      notes: notes || null,
    };

    if (refundStatus === 'completed') {
      updateData.processedAt = new Date();
    }

    const refund = await prisma.refund.update({
      where: { id: refundId },
      data: updateData,
    });

    // Sync to order
    await prisma.order.update({
      where: { id: refund.orderId },
      data: {
        refundStatus,
        ...(refundStatus === 'completed' && {
          refundedAt: new Date(),
          orderStatus: 'Refunded',
        }),
      },
    });

    return NextResponse.json({ success: true, refund });
  } catch (error) {
    console.error('Refunds PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}