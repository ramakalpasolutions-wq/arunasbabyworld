import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { cancelShipment } from '@/lib/nimbuspost';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.awbNumber) {
      return NextResponse.json({ error: 'No shipment found' }, { status: 404 });
    }

    const result = await cancelShipment(order.awbNumber);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        awbNumber:   null,
        courierName: null,
        shipmentId:  null,
        trackingUrl: null,
        orderStatus: 'Cancelled',
      },
    });

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('Cancel shipment error:', error);
    return NextResponse.json(
      { error: error.message || 'Cancel failed' },
      { status: 500 }
    );
  }
}