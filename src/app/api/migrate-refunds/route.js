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
    const ordersNeedingRefunds = await prisma.order.findMany({
      where: {
        AND: [
          { returnRequest: { not: null } },
          { refundId: null },
        ],
      },
    });

    console.log(`Found ${ordersNeedingRefunds.length} orders needing Refund records`);

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
          customer: rr.upiId || rr.accountHolderName,
        });

        console.log(`Created refund for order ${order.id}`);
      } catch (err) {
        console.error(`Failed for order ${order.id}:`, err.message);
        failed.push({
          orderId: order.id,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete!',
      totalScanned: ordersNeedingRefunds.length,
      created: created.length,
      failed: failed.length,
      createdRefunds: created,
      failedOrders: failed,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}