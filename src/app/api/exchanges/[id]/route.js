import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ============================================================
// ✅ GET — Single exchange details
// ============================================================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    }

    // Auth
    if (exchange.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Enrich
    const [user, order, oldProduct, newProduct] = await Promise.all([
      prisma.user.findUnique({
        where: { id: exchange.userId },
        select: { name: true, email: true, phone: true },
      }),
      prisma.order.findUnique({
        where: { id: exchange.orderId },
        select: { id: true, shippingAddress: true, totalPrice: true, paymentMethod: true, isPaid: true },
      }),
      prisma.product.findUnique({
        where: { id: exchange.oldProductId },
        select: { id: true, name: true, slug: true, images: true },
      }).catch(() => null),
      prisma.product.findUnique({
        where: { id: exchange.newProductId },
        select: { id: true, name: true, slug: true, images: true, stock: true },
      }).catch(() => null),
    ]);

    return NextResponse.json({
      exchange: { ...exchange, user, order, oldProduct, newProduct },
    });
  } catch (error) {
    console.error('Exchange GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// ✅ PUT — Update exchange (admin only)
// ============================================================
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const data   = await request.json();

    const allowed = [
      'status', 'pickupTracking', 'shipmentTracking',
      'adminNotes', 'rejectionReason',
    ];

    const updateData = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }

    // Auto-set timestamps based on status
    if (data.status === 'picked_up')  updateData.pickedUpAt  = new Date();
    if (data.status === 'received')   updateData.receivedAt  = new Date();
    if (data.status === 'verified')   updateData.verifiedAt  = new Date();
    if (data.status === 'shipped')    updateData.shippedAt   = new Date();
    if (data.status === 'completed')  updateData.completedAt = new Date();
    if (data.status === 'rejected')   updateData.rejectedAt  = new Date();

    const exchange = await prisma.exchange.update({
      where: { id },
      data: updateData,
    });

    // Sync to order
    await prisma.order.update({
      where: { id: exchange.orderId },
      data: { exchangeStatus: exchange.status },
    });

    return NextResponse.json({ success: true, exchange });
  } catch (error) {
    console.error('Exchange PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// ✅ DELETE — Hard delete (admin) OR Cancel (customer)
// ============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    }

    if (exchange.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── ADMIN HARD DELETE ──
    if (hardDelete && session.user.role === 'admin') {
      // Unlink from order first
      await prisma.order.update({
        where: { id: exchange.orderId },
        data: {
          exchangeId:     null,
          exchangeStatus: null,
        },
      }).catch(() => null);

      // Permanently delete
      await prisma.exchange.delete({ where: { id } });

      return NextResponse.json({
        success: true,
        message: 'Exchange permanently deleted',
        deleted: true,
      });
    }

    // ── CUSTOMER / SOFT CANCEL ──
    if (!['pending', 'approved'].includes(exchange.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel exchange at this stage' },
        { status: 400 }
      );
    }

    await prisma.exchange.update({
      where: { id },
      data: {
        status:          'rejected',
        rejectionReason: 'Cancelled by customer',
        rejectedAt:      new Date(),
      },
    });

    await prisma.order.update({
      where: { id: exchange.orderId },
      data: {
        exchangeId:     null,
        exchangeStatus: 'cancelled',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Exchange cancelled',
      deleted: false,
    });
  } catch (error) {
    console.error('Exchange DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}