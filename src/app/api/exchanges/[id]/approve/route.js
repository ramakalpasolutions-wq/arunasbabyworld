import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendExchangeApproved } from '@/lib/nodemailer';

// ============================================================
// ✅ POST — Admin approves exchange request
// ============================================================
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id }  = await params;
    const body    = await request.json();
    const { adminNotes } = body || {};

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    }

    if (exchange.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot approve. Current status: ${exchange.status}` },
        { status: 400 }
      );
    }

    // Update exchange
    const updated = await prisma.exchange.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        adminNotes: adminNotes || null,
      },
    });

    // Update order
    await prisma.order.update({
      where: { id: exchange.orderId },
      data: { exchangeStatus: 'approved' },
    });

    // Get order + user for email
    const order = await prisma.order.findUnique({
      where: { id: exchange.orderId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (order?.user?.email) {
      sendExchangeApproved(updated, order, order.user.email, order.user.name)
        .catch(e => console.error('❌ Approval email error:', e));
    }

    return NextResponse.json({
      success: true,
      message: 'Exchange approved successfully',
      exchange: updated,
    });
  } catch (error) {
    console.error('Exchange approve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}