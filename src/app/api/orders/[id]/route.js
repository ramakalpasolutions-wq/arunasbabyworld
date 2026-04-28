import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendOrderStatusUpdate } from '@/lib/nodemailer';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (session.user.role !== 'admin' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    if (data.orderStatus === 'Delivered') {
      data.isDelivered = true;
      data.deliveredAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { user: { select: { name: true, email: true } } },
    });

    // ✅ Send email to CUSTOMER when admin updates status
    if (data.orderStatus && order.user?.email) {
      try {
        await sendOrderStatusUpdate(order, order.user.email, order.user.name);
        console.log('✅ Status email sent to customer:', order.user.email);
      } catch (emailErr) {
        console.error('❌ Status email error:', emailErr);
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}