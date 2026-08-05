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

    if (!id || id === 'undefined' || id.length < 12) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

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
    console.error('Order GET error:', error);
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

    if (!id || id === 'undefined' || id.length < 12) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const data = await request.json();

    if (data.orderStatus === 'Delivered') {
      data.isDelivered  = true;
      data.deliveredAt  = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { user: { select: { name: true, email: true } } },
    });

    if (data.orderStatus && order.user?.email) {
      try {
        await sendOrderStatusUpdate(order, order.user.email, order.user.name);
        console.log('✅ Status email sent:', order.user.email);
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

// ✅ DELETE order — Admin only
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;

    if (!id || id === 'undefined' || id.length < 12) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Safety check — don't allow deletion of paid orders unless explicitly forced
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (order.isPaid && !force) {
      return NextResponse.json({
        error: 'Cannot delete paid order. Use force=true if you really want to delete.',
      }, { status: 400 });
    }

    await prisma.order.delete({ where: { id } });

    console.log('🗑️ Order deleted:', id, 'by admin:', session.user.email);

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}