import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check 1: Can we connect to Prisma?
    const prismaModels = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));

    // Check 2: Does Refund model exist?
    const hasRefundModel = typeof prisma.refund !== 'undefined';

    // Check 3: How many refunds exist in DB?
    let refundCount = 0;
    let refunds = [];
    let refundError = null;

    if (hasRefundModel) {
      try {
        refundCount = await prisma.refund.count();
        refunds = await prisma.refund.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
      } catch (e) {
        refundError = e.message;
      }
    }

    // Check 4: How many orders have returnRequest?
    const ordersWithReturnRequest = await prisma.order.findMany({
      where: {
        OR: [
          { returnRequest: { not: null } },
          { orderStatus: 'Return_Requested' },
          { orderStatus: 'Refunded' },
          { refundId: { not: null } },
        ],
      },
      select: {
        id: true,
        orderStatus: true,
        refundId: true,
        refundStatus: true,
        refundAmount: true,
        returnRequest: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      ok: true,
      diagnostics: {
        prismaModels,
        hasRefundModel,
        refundCount,
        refundError,
        recentRefunds: refunds,
        ordersWithReturnsCount: ordersWithReturnRequest.length,
        ordersWithReturns: ordersWithReturnRequest,
      },
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      stack: err.stack,
    });
  }
}