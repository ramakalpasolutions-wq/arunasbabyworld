import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (order.isPaid) {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    if (order.paymentMethod !== 'Razorpay') {
      return NextResponse.json({ error: 'Only Razorpay orders can be retried' }, { status: 400 });
    }

    if (order.orderStatus === 'Cancelled') {
      return NextResponse.json({ error: 'Cancelled orders cannot be retried' }, { status: 400 });
    }

    // ✅ Create new Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(order.totalPrice * 100),
      currency: 'INR',
      receipt:  `retry_${order.id.slice(-10)}`,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber?.toString() || '',
        retry: 'true',
      },
    });

    // ✅ Reset payment status to pending
    await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'pending',
        notes: `Payment retry initiated at ${new Date().toISOString()}`,
      },
    });

    console.log('🔄 Retry payment created:', razorpayOrder.id, 'for order:', id);

    return NextResponse.json({
      success: true,
      razorpayOrder,
      order,
    });

  } catch (error) {
    console.error('Retry payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create retry payment' },
      { status: 500 }
    );
  }
}