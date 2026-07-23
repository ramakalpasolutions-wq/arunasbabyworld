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
    console.log('Payment verify body:', body);

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = body;

    if (!orderId) {
      console.error('orderId is missing from request body');
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // ✅ Verify signature
    const text = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      // ✅ Mark payment as failed on signature mismatch
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'failed',
          isPaid: false,
          notes: 'Invalid payment signature',
        },
      });

      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // ✅ Update existing order — mark as PAID and CONFIRMED
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid:        true,
        paidAt:        new Date(),
        paymentStatus: 'success',
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

    console.log('✅ Payment verified for order:', orderId);

    // ✅ Send confirmation email now (after payment success)
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