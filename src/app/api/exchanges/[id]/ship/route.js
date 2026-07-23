import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendExchangeShipped } from '@/lib/nodemailer';

// ============================================================
// ✅ POST — Admin marks new product as shipped
// ============================================================
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body   = await request.json();
    const { trackingNumber } = body || {};

    if (!trackingNumber?.trim()) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    }

    if (!['ready_to_ship', 'verified'].includes(exchange.status)) {
      return NextResponse.json(
        { error: `Cannot ship. Current status: ${exchange.status}` },
        { status: 400 }
      );
    }

    // Update exchange
    const updated = await prisma.exchange.update({
      where: { id },
      data: {
        status:           'shipped',
        shippedAt:        new Date(),
        shipmentTracking: trackingNumber,
      },
    });

    // Update order
    await prisma.order.update({
      where: { id: exchange.orderId },
      data: { exchangeStatus: 'shipped' },
    });

    // Decrement new product stock
    try {
      await prisma.product.update({
        where: { id: exchange.newProductId },
        data: { stock: { decrement: exchange.newQuantity || 1 } },
      });
    } catch (stockErr) {
      console.error('Stock update error:', stockErr);
    }

    // Email customer
    const order = await prisma.order.findUnique({
      where: { id: exchange.orderId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (order?.user?.email) {
      sendExchangeShipped(updated, order, order.user.email, order.user.name)
        .catch(e => console.error('❌ Shipped email error:', e));
    }

    return NextResponse.json({
      success: true,
      message: 'New product shipped successfully',
      exchange: updated,
    });
  } catch (error) {
    console.error('Ship error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}