import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { orderId, manualAwb, manualCourier } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ✅ MANUAL AWB — primary flow
    if (manualAwb) {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          awbNumber:   manualAwb.trim(),
          courierName: manualCourier?.trim() || 'Nimbus Post',
          trackingUrl: `https://ship.nimbuspost.com/tracking/${manualAwb.trim()}`,
          orderStatus: 'Shipped',
        },
      });

      return NextResponse.json({
        success:     true,
        awb:         manualAwb.trim(),
        courierName: manualCourier?.trim() || 'Nimbus Post',
        trackingUrl: updated.trackingUrl,
        order:       updated,
        manual:      true,
      });
    }

    // ✅ Auto via Nimbus API — will work once activated
    try {
      const { createShipment } = await import('@/lib/nimbuspost');
      const shipment = await createShipment(order);

      if (!shipment.awb) {
        throw new Error('No AWB returned from Nimbus Post');
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          awbNumber:   shipment.awb,
          courierName: shipment.courierName || 'Nimbus Post',
          shipmentId:  shipment.shipmentId  || null,
          trackingUrl: `https://ship.nimbuspost.com/tracking/${shipment.awb}`,
          orderStatus: 'Shipped',
        },
      });

      return NextResponse.json({
        success:     true,
        awb:         shipment.awb,
        courierName: shipment.courierName,
        trackingUrl: updated.trackingUrl,
        order:       updated,
      });

    } catch (nimbusError) {
      console.error('Nimbus API failed:', nimbusError.message);
      return NextResponse.json({
        error:      nimbusError.message,
        suggestion: 'Nimbus API not ready. Create shipment on Nimbus dashboard and enter AWB manually.',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Create shipment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipment' },
      { status: 500 }
    );
  }
}