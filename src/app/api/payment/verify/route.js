import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Payment verify request body:', body);

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Verify signature hash
    const text = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('❌ Payment verification mismatch. Invalid signature received.');
      
      // Update local payment status to failed on mismatch
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'failed',
          isPaid: false,
          notes: 'Invalid payment signature received during verification.',
        },
      });

      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update order status fields to paid & confirmed in database
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid:        true,
        paidAt:        new Date(),
        paymentStatus: 'paid', // Normalized database flag
        orderStatus:   'Confirmed',
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