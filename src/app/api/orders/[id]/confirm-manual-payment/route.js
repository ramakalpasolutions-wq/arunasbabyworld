import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    if (!id || id === 'undefined' || id.length < 12) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      paymentMode      = 'Manual',
      transactionRef   = '',
      notes            = '',
    } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) {
      console.error('❌ Order not found:', id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ✅ Log current state for debugging
    console.log('📦 Confirming payment for order:', {
      id: order.id,
      orderNumber: order.orderNumber,
      isPaid: order.isPaid,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    });

    // ✅ Only block if BOTH isPaid=true AND status is not cancelled/failed
    if (order.isPaid && order.paymentStatus === 'success') {
      console.error('❌ Order already paid successfully');
      return NextResponse.json({
        error: `Order is already paid. Current status: ${order.orderStatus}. If you want to override, please contact support.`
      }, { status: 400 });
    }

    // ✅ Update order — mark as paid manually
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        isPaid:        true,
        paidAt:        new Date(),
        paymentStatus: 'success',
        paymentMethod: paymentMode,
        orderStatus:   'Confirmed',
        isCancelled:   false,       // ✅ Un-cancel if it was cancelled
        cancelledAt:   null,
        cancelReason:  null,
        paymentResult: {
          id:                `manual_${Date.now()}`,
          status:            'completed',
          updateTime:        new Date().toISOString(),
          razorpayOrderId:   null,
          razorpayPaymentId: transactionRef || `MANUAL-${Date.now()}`,
          razorpaySignature: null,
        },
        notes: `✅ Payment confirmed manually by admin (${session.user.name || session.user.email}).
Method: ${paymentMode}
${transactionRef ? `Ref: ${transactionRef}` : ''}
${notes ? `Notes: ${notes}` : ''}`,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    console.log('✅ Manual payment confirmed:', id, 'by:', session.user.email);

    // ✅ Send confirmation email
    try {
      await sendOrderConfirmation(
        updatedOrder,
        updatedOrder.user?.email || session.user.email,
        updatedOrder.user?.name  || session.user.name
      );
      console.log('✅ Order confirmation email sent');
    } catch (emailErr) {
      console.error('❌ Email error (non-fatal):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      order:   updatedOrder,
    });

  } catch (error) {
    console.error('❌ Manual payment confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}