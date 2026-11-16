import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // The amount always comes from the saved order, never from the client.
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!dbOrder || dbOrder.userId !== session.user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (dbOrder.isPaid) {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }
    if (dbOrder.paymentMethod !== 'Razorpay') {
      return NextResponse.json({ error: 'Order is not a Razorpay order' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(dbOrder.totalPrice * 100),
      currency: 'INR',
      receipt: `order_${dbOrder.id.slice(-10)}`,
      notes: {
        orderId: dbOrder.id,
        orderNumber: dbOrder.orderNumber?.toString() || '',
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
