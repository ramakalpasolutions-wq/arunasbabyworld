import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createRefund } from '@/lib/razorpay';
import {
  sendOrderCancelled,
  sendRefundProcessed,
  sendAdminCancelNotification,
} from '@/lib/nodemailer';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason, bankDetails } = body;

    // ✅ Get order
    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ✅ Verify ownership (or admin)
    if (session.user.role !== 'admin' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // ✅ Check if already cancelled
    if (order.isCancelled || order.orderStatus === 'Cancelled') {
      return NextResponse.json({ error: 'Order already cancelled' }, { status: 400 });
    }

    // ✅ Determine refund flow
    const isRazorpay = order.paymentMethod === 'Razorpay';
    const isCOD = order.paymentMethod === 'COD';
    const isPaid = order.isPaid;
    const isDelivered = order.isDelivered;

    let refundType = 'not_required';
    let refundStatus = 'not_required';
    let refundRecord = null;
    let razorpayRefund = null;

    // ============================================================
    // CASE 1: Razorpay paid + not delivered → Auto refund
    // CASE 2: Razorpay paid + delivered → Auto refund (return)
    // CASE 3: COD + not delivered → No refund (no money taken)
    // CASE 4: COD + delivered → Manual refund (UPI or Bank Transfer)
    // ============================================================

    if (isRazorpay && isPaid) {
      // ✅ AUTO REFUND via Razorpay
      const paymentId = order.paymentResult?.razorpayPaymentId;

      if (!paymentId) {
        return NextResponse.json({
          error: 'Payment ID not found. Cannot process refund.',
        }, { status: 400 });
      }

      console.log('🔄 Initiating Razorpay refund for payment:', paymentId);

      const refundResult = await createRefund(paymentId, order.totalPrice, {
        reason: reason || 'Customer cancellation',
        orderId: order.id,
      });

      if (!refundResult.success) {
        return NextResponse.json({
          error: refundResult.error || 'Refund failed. Please contact support.',
        }, { status: 500 });
      }

      razorpayRefund = refundResult.refund;
      refundType = 'razorpay';
      refundStatus = 'processing';

      // ✅ Create Refund record in DB
      refundRecord = await prisma.refund.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.totalPrice,
          reason: reason || 'Customer cancellation',
          refundType: 'razorpay',
          refundStatus: 'processing',
          razorpayRefundId: razorpayRefund.id,
          razorpayPaymentId: paymentId,
        },
      });
    }
    else if (isCOD && isDelivered) {
      // ✅ COD + Delivered → UPI or Bank Transfer needed
      if (!bankDetails) {
        return NextResponse.json({
          error: 'Refund details required for COD returns',
          requiresBankDetails: true,
        }, { status: 400 });
      }

      // ✅ Validate based on refund method
      if (bankDetails.refundMethod === 'upi') {
        if (!bankDetails.upiId) {
          return NextResponse.json({
            error: 'UPI ID is required',
            requiresBankDetails: true,
          }, { status: 400 });
        }
      } else {
        // Bank transfer
        if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
          return NextResponse.json({
            error: 'Complete bank details required',
            requiresBankDetails: true,
          }, { status: 400 });
        }
      }

      refundType = bankDetails.refundMethod === 'upi' ? 'upi_transfer' : 'bank_transfer';
      refundStatus = 'pending';

      refundRecord = await prisma.refund.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.totalPrice,
          reason: reason || 'Customer return after delivery',
          refundType: refundType,
          refundStatus: 'pending',
          bankDetails: {
            accountHolderName: bankDetails.accountHolderName || '',
            accountNumber: bankDetails.accountNumber || '',
            ifscCode: bankDetails.ifscCode || '',
            bankName: bankDetails.bankName || '',
            upiId: bankDetails.upiId || '',
          },
        },
      });
    }
    // CASE: COD + Not delivered → just cancel, no refund needed

    // ✅ Update Order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: 'Cancelled',
        isCancelled: true,
        cancelledAt: new Date(),
        cancelReason: reason || 'Customer requested cancellation',
        refundId: refundRecord?.id || null,
        refundStatus: refundStatus,
        refundAmount: refundType !== 'not_required' ? order.totalPrice : 0,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // ✅ Send emails
    try {
      // 1. Customer email - Order cancelled
      await sendOrderCancelled(
        updatedOrder,
        updatedOrder.user.email,
        updatedOrder.user.name,
        reason
      );

      // 2. If Razorpay refund created → send refund processed email
      if (razorpayRefund && refundRecord) {
        await sendRefundProcessed(
          updatedOrder,
          refundRecord,
          updatedOrder.user.email,
          updatedOrder.user.name
        );
      }

      // 3. Admin notification (with refund details)
      await sendAdminCancelNotification(
        updatedOrder,
        updatedOrder.user,
        reason,
        refundRecord  // ✅ Pass refund record so admin sees UPI/bank details
      );

      console.log('✅ All cancellation emails sent');
    } catch (emailErr) {
      console.error('❌ Email error (non-blocking):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder,
      refund: refundRecord,
      refundType,
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to cancel order',
    }, { status: 500 });
  }
}