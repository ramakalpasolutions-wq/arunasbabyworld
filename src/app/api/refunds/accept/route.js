import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================
// ✅ POST — Admin accepts return → schedules refund in 2 mins
// ============================================================
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

    if (refund.refundStatus === 'completed') {
      return NextResponse.json({ error: 'Refund already completed' }, { status: 400 });
    }

    if (refund.refundStatus === 'scheduled') {
      return NextResponse.json({ error: 'Refund already scheduled' }, { status: 400 });
    }

    // ✅ Schedule refund for 2 minutes later
    const scheduledTime = new Date(Date.now() + 2 * 60 * 1000);

    const updated = await prisma.refund.update({
      where: { id: refundId },
      data: {
        refundStatus: 'scheduled',
        scheduledAt: scheduledTime,
        scheduledByAdmin: session.user.email || session.user.id,
        scheduledCancelledAt: null,
        notes: `Scheduled for auto-refund at ${scheduledTime.toLocaleString('en-IN')}`,
      },
    });

    await prisma.order.update({
      where: { id: refund.orderId },
      data: { refundStatus: 'scheduled' },
    });

    console.log(`⏱️ Refund ${refundId} scheduled for ${scheduledTime.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Refund scheduled successfully',
      refund: updated,
      scheduledAt: scheduledTime,
    });
  } catch (err) {
    console.error('Accept refund error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}