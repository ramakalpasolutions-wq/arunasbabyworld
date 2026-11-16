import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Order ID and payment details are required' },
        { status: 400 }
      );
    }

    // The order must belong to the signed-in user (admins may verify any)
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing || (session.user.role !== 'admin' && existing.userId !== session.user.id)) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (existing.isPaid) {
      return NextResponse.json({ success: true, order: existing });
    }

    // Verify signature hash
    const text = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    const signatureOk =
      typeof razorpaySignature === 'string' &&
      razorpaySignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));

    // The Razorpay order must have been created for THIS order and for its full amount
    let amountOk = false;
    if (signatureOk) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
        amountOk =
          rzpOrder?.notes?.orderId === orderId &&
          Number(rzpOrder.amount) === Math.round(existing.totalPrice * 100);
      } catch (fetchErr) {
        console.error('Razorpay order fetch failed:', fetchErr);
      }
    }

    if (!signatureOk || !amountOk) {
      const reason = !signatureOk
        ? 'Invalid payment signature received during verification.'
        : 'Payment does not match this order (order ID or amount mismatch).';
      console.error('❌ Payment verification failed:', reason, orderId);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'failed',
          isPaid: false,
          notes: reason,
        },
      });

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Payment succeeded after a failure released the stock: take it again (goods are paid for)
    if (existing.stockDeducted === false) {
      await Promise.allSettled((existing.orderItems || []).filter(i => i.productId).map(i =>
        prisma.product.update({ where: { id: i.productId }, data: { stock: { decrement: Number(i.quantity) || 1 } } })
      ));
    }

    // Update order status fields to paid & confirmed in database
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid:        true,
        paidAt:        new Date(),
        paymentStatus: 'paid', // Normalized database flag
        orderStatus:   'Confirmed',
        ...(existing.stockDeducted === false && { stockDeducted: true }),
        paymentResult: {
          id: razorpayPaymentId,
          status: 'completed',
          updateTime: new Date().toISOString(),
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    console.log('✅ Payment verified successfully for order:', orderId);

    // Send order confirmation email
    try {
      await sendOrderConfirmation(
        order,
        order.user?.email || session.user.email,
        order.user?.name  || session.user.name
      );
      console.log('✅ Confirmation email sent');
    } catch (emailErr) {
      console.error('❌ Email error (non-fatal):', emailErr);
    }

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}