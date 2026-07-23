import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================
// ✅ POST — Admin verifies received product
// ============================================================
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id }  = await params;
    const body    = await request.json();
    const { approved, adminNotes, rejectionReason } = body || {};

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    }

    if (!['picked_up', 'received'].includes(exchange.status)) {
      return NextResponse.json(
        { error: `Cannot verify. Current status: ${exchange.status}` },
        { status: 400 }
      );
    }

    if (approved) {
      // ✅ Product is in good condition → ready to ship new
      const newStatus = exchange.priceDifference > 0 && exchange.paymentStatus !== 'paid'
        ? 'awaiting_payment'
        : 'ready_to_ship';

      const updated = await prisma.exchange.update({
        where: { id },
        data: {
          status: newStatus,
          verifiedAt: new Date(),
          receivedAt: exchange.receivedAt || new Date(),
          adminNotes: adminNotes || null,
        },
      });

      await prisma.order.update({
        where: { id: exchange.orderId },
        data: { exchangeStatus: newStatus },
      });

      return NextResponse.json({
        success: true,
        message: newStatus === 'awaiting_payment'
          ? 'Verified! Waiting for customer to pay price difference.'
          : 'Verified! Ready to ship new product.',
        exchange: updated,
      });
    } else {
      // ❌ Product damaged / wrong → reject
      const updated = await prisma.exchange.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || 'Product not in acceptable condition',
          adminNotes: adminNotes || null,
        },
      });

      await prisma.order.update({
        where: { id: exchange.orderId },
        data: {
          exchangeId: null,
          exchangeStatus: 'rejected',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Exchange rejected',
        exchange: updated,
      });
    }
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}