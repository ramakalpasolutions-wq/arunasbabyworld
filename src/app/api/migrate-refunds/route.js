import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to run migration',
    instructions: 'Visit /migrate.html and click the button',
  });
}

export async function POST() {
  try {
    // ✅ Find ALL orders with returnRequest (more aggressive)
    const allOrders = await prisma.order.findMany({
      where: {
        returnRequest: { not: null },
      },
    });

    console.log(`📊 Total orders with returnRequest: ${allOrders.length}`);

    // Get all existing refunds to check duplicates
    const existingRefunds = await prisma.refund.findMany({
      select: { orderId: true },
    });
    const existingOrderIds = new Set(existingRefunds.map(r => r.orderId));

    console.log(`📊 Existing refunds in DB: ${existingRefunds.length}`);

    const ordersNeedingRefunds = allOrders.filter(o => !existingOrderIds.has(o.id));
    console.log(`📊 Orders needing refunds: ${ordersNeedingRefunds.length}`);

    const created = [];
    const failed = [];

    for (const order of ordersNeedingRefunds) {
      try {
        const rr = order.returnRequest;
        if (!rr) continue;

        let refundType = 'razorpay';
        let refundStatus = 'pending';

        if (rr.refundMethod === 'upi') {
          refundType = 'upi_transfer';
          refundStatus = 'pending';
        } else if (rr.refundMethod === 'bank') {
          refundType = 'bank_transfer';
          refundStatus = 'pending';
        }

        if (rr.razorpayRefundId) {
          refundType = 'razorpay';
          refundStatus = 'processing';
        }

        const bankDetails = rr.refundMethod === 'upi'
          ? {
              upiId: rr.upiId || null,
              accountHolderName: null,
              accountNumber: null,
              ifscCode: null,
              bankName: null,
            }
          : {
              upiId: null,
              accountHolderName: rr.accountHolderName || null,
              accountNumber: rr.accountNumberMasked || null,
              ifscCode: rr.ifscCode || null,
              bankName: rr.bankName || null,
            };

        const refund = await prisma.refund.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            amount: order.totalPrice,
            reason: rr.reason || 'Customer return/refund',
            refundType: refundType,
            refundStatus: refundStatus,
            razorpayRefundId: rr.razorpayRefundId || null,
            razorpayPaymentId: order.paymentResult?.razorpayPaymentId || null,
            bankDetails: bankDetails,
          },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            refundId: refund.id,
            refundStatus: refundStatus,
            refundAmount: order.totalPrice,
          },
        });

        created.push({
          orderId: order.id,
          refundId: refund.id,
          type: refundType,
          status: refundStatus,
          amount: order.totalPrice,
          customer: rr.upiId || rr.accountHolderName || 'Manual',
          reason: rr.reason,
        });

        console.log(`✅ Created refund for order ${order.id}`);
      } catch (err) {
        console.error(`❌ Failed for order ${order.id}:`, err.message);
        failed.push({
          orderId: order.id,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete!',
      totalOrdersWithReturns: allOrders.length,
      existingRefundsCount: existingRefunds.length,
      created: created.length,
      failed: failed.length,
      createdRefunds: created,
      failedOrders: failed,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}