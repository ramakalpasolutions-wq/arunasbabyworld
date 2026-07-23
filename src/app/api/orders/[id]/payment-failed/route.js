import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id === 'undefined' || id.length < 12) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const { reason, errorCode } = await request.json();

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // ✅ Don't overwrite if already paid
    if (order.isPaid) {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    // ✅ Mark payment as failed
    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'failed',
        isPaid: false,
        notes: `Payment failed: ${reason || 'Unknown reason'}${errorCode ? ` (${errorCode})` : ''}`,
      },
    });

    console.log('❌ Payment marked failed for order:', id, 'Reason:', reason);

    return NextResponse.json({ success: true, order: updated });

  } catch (error) {
    console.error('Payment failed handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}