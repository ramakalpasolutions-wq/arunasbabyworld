import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendExchangeApproved } from '@/lib/nodemailer';
import { createRefund } from '@/lib/razorpay';

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

    // Replacement is cheaper → refund the difference now that the exchange is approved
    let refundWarning = null;
    if (exchange.priceDifference < 0 && !exchange.razorpayRefundId &&
        order?.paymentMethod === 'Razorpay' && order?.isPaid && order.paymentResult?.razorpayPaymentId) {
      const refundAmount = Math.abs(exchange.priceDifference);
      try {
        const refundResult = await createRefund(order.paymentResult.razorpayPaymentId, refundAmount, {
          reason: 'Exchange price difference refund',
          orderId: order.id,
        });
        if (refundResult.success) {
          await prisma.exchange.update({
            where: { id },
            data: { razorpayRefundId: refundResult.refund.id, refundAmount, refundedAt: new Date() },
          });
        } else {
          refundWarning = `Price-difference refund failed: ${refundResult.error || 'unknown error'}. Refund ₹${refundAmount} manually.`;
        }
      } catch (refErr) {
        console.error('❌ Exchange difference refund failed:', refErr);
        refundWarning = `Price-difference refund failed. Refund ₹${refundAmount} manually.`;
      }
    }

    if (order?.user?.email) {
      sendExchangeApproved(updated, order, order.user.email, order.user.name)
        .catch(e => console.error('❌ Approval email error:', e));
    }

    return NextResponse.json({
      success: true,
      message: 'Exchange approved successfully',
      exchange: updated,
      ...(refundWarning && { warning: refundWarning }),
    });
  } catch (error) {
    console.error('Exchange approve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}