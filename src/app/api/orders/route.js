import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';

// ✅ Get next order number safely
async function getNextOrderNumber() {
  try {
    const counter = await prisma.counter.upsert({
      where:  { name: 'orderNumber' },
      update: { value: { increment: 1 } },
      create: { name: 'orderNumber', value: 40001 },
    });
    return counter.value;
  } catch (err) {
    console.error('Counter error:', err);
    return null;
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status         = searchParams.get('status');
    const paymentStatus  = searchParams.get('paymentStatus');
    const page           = parseInt(searchParams.get('page')  || '1');
    const limit          = parseInt(searchParams.get('limit') || '10');

    const where = {};
    if (session.user.role !== 'admin') where.userId = session.user.id;
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const total  = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.orderItems || data.orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    if (!data.shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    const orderNumber = await getNextOrderNumber();

    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountAmount,
      totalPrice,
      couponCode,
      isPaid,
      paidAt,
      orderStatus,
      paymentStatus,   // ✅ NEW
    } = data;

    const order = await prisma.order.create({
      data: {
        orderNumber:     orderNumber ?? undefined,
        userId:          session.user.id,
        orderItems:      orderItems || [],
        shippingAddress: shippingAddress,
        paymentMethod:   paymentMethod || 'Razorpay',
        itemsPrice:      itemsPrice    || 0,
        shippingPrice:   shippingPrice || 0,
        taxPrice:        taxPrice      || 0,
        discountAmount:  discountAmount || 0,
        totalPrice:      totalPrice    || 0,
        couponCode:      couponCode    || null,
        isPaid:          isPaid        || false,
        paidAt:          paidAt        || null,
        orderStatus:     orderStatus   || 'Pending',
        paymentStatus:   paymentStatus || (paymentMethod === 'COD' ? 'not_applicable' : 'pending'),
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    console.log('✅ Order created:', order.id, 'Number:', orderNumber, 'PaymentStatus:', order.paymentStatus);

    // ✅ Only send email if COD (Razorpay email sent after payment verified)
    if (paymentMethod === 'COD') {
      try {
        await sendOrderConfirmation(
          order,
          session.user.email,
          session.user.name
        );
        console.log('✅ Email sent to:', session.user.email);
      } catch (emailErr) {
        console.error('❌ Email error (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ order }, { status: 201 });

  } catch (error) {
    console.error('Order POST error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate order detected' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Related record not found' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}