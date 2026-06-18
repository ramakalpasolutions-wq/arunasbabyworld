import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { refundId } = body;

    if (!refundId) {
      return NextResponse.json({ error: 'refundId required' }, { status: 400 });
    }

    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    if (refund.refundStatus !== 'scheduled') {
      return NextResponse.json({ error: 'Refund is not scheduled' }, { status: 400 });
    }

    const now = new Date();
    if (refund.scheduledAt && new Date(refund.scheduledAt) <= now) {
      return NextResponse.json({
        error: 'Too late to cancel! Refund is being processed now.',
      }, { status: 400 });
    }

    const updated = await prisma.refund.update({
      where: { id: refundId },
      data: {
        refundStatus: 'pending',
        scheduledAt: null,
        scheduledCancelledAt: now,
        notes: `Schedule cancelled by admin at ${now.toLocaleString('en-IN')}`,
      },
    });

    await prisma.order.update({
      where: { id: refund.orderId },
      data: { refundStatus: 'pending' },
    });

    console.log(`🛑 Refund ${refundId} schedule cancelled`);

    return NextResponse.json({
      success: true,
      message: 'Refund schedule cancelled',
      refund: updated,
    });
  } catch (err) {
    console.error('Cancel schedule error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}