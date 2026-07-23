import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createRefund } from '@/lib/razorpay';
import {
  sendOrderCancelled,
  sendRefundProcessed,
} from '@/lib/nodemailer';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ Only admin allowed
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      reason,
      adminNotes,
      refundMethod,      // 'razorpay' | 'manual' | 'none'
      bankDetails,       // optional for manual
    } = body;

    // ✅ Get order
    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.isCancelled || order.orderStatus === 'Cancelled') {
      return NextResponse.json({ error: 'Order already cancelled' }, { status: 400 });
    }

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    let refundType    = 'not_required';
    let refundStatus  = 'not_required';
    let refundRecord  = null;
    let razorpayRefund = null;

    const isRazorpay = order.paymentMethod === 'Razorpay';
    const isPaid     = order.isPaid;

    // ============================================================
    // ✅ Handle refund based on admin's choice
    // ============================================================

    if (isPaid && refundMethod === 'razorpay' && isRazorpay) {
      const paymentId = order.paymentResult?.razorpayPaymentId;

      if (!paymentId) {
        return NextResponse.json({
          error: 'Payment ID not found. Cannot process Razorpay refund.',
        }, { status: 400 });
      }

      console.log('🔄 Admin initiating Razorpay refund for payment:', paymentId);

      const refundResult = await createRefund(paymentId, order.totalPrice, {
        reason:  reason,
        orderId: order.id,
      });

      if (!refundResult.success) {
        return NextResponse.json({
          error: refundResult.error || 'Refund failed. Please try manual refund.',
        }, { status: 500 });
      }

      razorpayRefund = refundResult.refund;
      refundType     = 'razorpay';
      refundStatus   = 'processing';

      refundRecord = await prisma.refund.create({
        data: {
          orderId:           order.id,
          userId:            order.userId,
          amount:            order.totalPrice,
          reason:            reason,
          refundType:        'razorpay',
          refundStatus:      'processing',
          razorpayRefundId:  razorpayRefund.id,
          razorpayPaymentId: paymentId,
          notes:             adminNotes || `Cancelled by admin: ${session.user.name}`,
          scheduledByAdmin:  session.user.email || session.user.name,
        },
      });
    }
    else if (isPaid && refundMethod === 'manual') {
      if (!bankDetails || (!bankDetails.upiId && !bankDetails.accountNumber)) {
        return NextResponse.json({
          error: 'Bank details or UPI ID required for manual refund',
        }, { status: 400 });
      }

      refundType   = bankDetails.upiId ? 'upi_transfer' : 'bank_transfer';
      refundStatus = 'pending';

      refundRecord = await prisma.refund.create({
        data: {
          orderId:      order.id,
          userId:       order.userId,
          amount:       order.totalPrice,
          reason:       reason,
          refundType:   refundType,
          refundStatus: 'pending',
          bankDetails: {
            accountHolderName: bankDetails.accountHolderName || '',
            accountNumber:     bankDetails.accountNumber     || '',
            ifscCode:          bankDetails.ifscCode          || '',
            bankName:          bankDetails.bankName          || '',
            upiId:             bankDetails.upiId             || '',
          },
          notes:            adminNotes || `Cancelled by admin: ${session.user.name}. Manual refund pending.`,
          scheduledByAdmin: session.user.email || session.user.name,
        },
      });
    }
    // If refundMethod === 'none' → skip refund creation

    // ✅ Update Order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        orderStatus:   'Cancelled',
        isCancelled:   true,
        cancelledAt:   new Date(),
        cancelReason:  reason,
        refundId:      refundRecord?.id || null,
        refundStatus:  refundStatus,
        refundAmount:  refundType !== 'not_required' ? order.totalPrice : 0,
        notes:         adminNotes || null,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    console.log(`✅ Order cancelled by admin: ${id} | Refund: ${refundType}`);

    // ✅ Send emails
    try {
      await sendOrderCancelled(
        updatedOrder,
        updatedOrder.user.email,
        updatedOrder.user.name,
        `Cancelled by admin: ${reason}`
      );

      if (razorpayRefund && refundRecord) {
        await sendRefundProcessed(
          updatedOrder,
          refundRecord,
          updatedOrder.user.email,
          updatedOrder.user.name
        );
      }

      console.log('✅ Cancellation emails sent');
    } catch (emailErr) {
      console.error('❌ Email error (non-blocking):', emailErr);
    }

    return NextResponse.json({
      success:    true,
      message:    'Order cancelled by admin',
      order:      updatedOrder,
      refund:     refundRecord,
      refundType,
    });

  } catch (error) {
    console.error('❌ Admin cancel error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to cancel order',
    }, { status: 500 });
  }
}