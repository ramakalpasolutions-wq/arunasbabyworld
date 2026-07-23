import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  return NextResponse.json({ message: 'Use POST to migrate' });
}

export async function POST() {
  try {
    const exchanges = await prisma.exchange.findMany();
    console.log(`Found ${exchanges.length} exchanges`);

    const updated = [];
    const failed = [];

    for (const ex of exchanges) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: ex.orderId },
        });
        
        if (!order) {
          failed.push({ orderId: ex.orderId, reason: 'Order not found' });
          continue;
        }

        // Only update if exchangeId is missing or different
        if (order.exchangeId !== ex.id || order.exchangeStatus !== ex.status) {
          await prisma.order.update({
            where: { id: ex.orderId },
            data: {
              exchangeId: ex.id,
              exchangeStatus: ex.status,
            },
          });
          updated.push({
            orderId: ex.orderId,
            exchangeId: ex.id,
            status: ex.status,
          });
          console.log(`✅ Linked exchange ${ex.id} to order ${ex.orderId}`);
        }
      } catch (err) {
        failed.push({ orderId: ex.orderId, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete',
      totalExchanges: exchanges.length,
      updated: updated.length,
      failed: failed.length,
      updatedOrders: updated,
      failedOrders: failed,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}