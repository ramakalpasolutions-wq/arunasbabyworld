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

export async function POST(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Safely resolve dynamic routes params across Next.js versions
    const params = await Promise.resolve(context.params);
    const { id } = params;

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { reason, bankDetails } = body;

    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify customer owner or admin authorization
    const isOwner = String(order.userId) === String(session.user.id);
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to modify this order' }, { status: 403 });
    }

    // Prevent duplicate processing
    if (order.isCancelled || order.orderStatus === 'Cancelled') {
      return NextResponse.json({ error: 'Order already cancelled' }, { status: 400 });
    }

    const isCOD = order.paymentMethod?.toUpperCase() === 'COD';
    const isPaid = Boolean(order.isPaid || order.paymentStatus === 'paid');

    let refundType = 'not_required';
    let refundStatus = 'not_required';
    let refundRecord = null;
    let razorpayRefund = null;
    let refundWarning = null;

    // Extract payment ID from nested payment result properties securely
    const paymentId =
      order.paymentResult?.razorpayPaymentId ||
      order.paymentResult?.id ||
      order.paymentResult?.razorpay_payment_id ||
      null;

    // ============================================================
    // CASE 1: ONLINE PAID ORDER -> TRIGGERS RESILIENT AUTO REFUND
    // ============================================================
    if (!isCOD && isPaid) {
      refundType = 'razorpay';

      if (!paymentId) {
        console.warn(`⚠️ Paid order ${order.id} has no payment ID. Initializing manual pending refund.`);
        refundStatus = 'pending_manual_review';
        refundWarning = 'Refund initiated manually because online transaction ID was not located.';

        refundRecord = await prisma.refund.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            amount: order.totalPrice,
            reason: reason || 'Customer cancellation',
            refundType: 'razorpay_manual_pending',
            refundStatus: 'pending',
            notes: 'Requires review: payment details missing.',
          },
        });
      } else {
        // Trigger automated refund via our updated helper
        const refundResult = await createRefund(paymentId, order.totalPrice, {
          reason: reason || 'Customer cancellation',
          orderId: order.id,
        });

        if (refundResult.success) {
          razorpayRefund = refundResult.refund;
          refundStatus = razorpayRefund.status === 'processed' ? 'completed' : 'processing';

          // Log transaction in Refund table
          refundRecord = await prisma.refund.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              amount: order.totalPrice,
              reason: reason || 'Customer cancellation',
              refundType: 'razorpay',
              refundStatus: refundStatus,
              razorpayRefundId: razorpayRefund.id,
              razorpayPaymentId: paymentId,
              processedAt: new Date(),
            },
          });
        } else {
          // ✅ RESILIENT FALLBACK: Convert to manual pending review if Razorpay rejects ID
          console.warn(`⚠️ Razorpay refund failed for payment ${paymentId}: ${refundResult.error}`);
          refundStatus = 'pending_manual_review';
          refundWarning = `Automatic refund failed: "${refundResult.error}". Our support will process manually.`;

          refundRecord = await prisma.refund.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              amount: order.totalPrice,
              reason: reason || 'Customer cancellation',
              refundType: 'razorpay_manual_pending',
              refundStatus: 'pending',
              notes: `Razorpay rejected refund: "${refundResult.error}". Support must refund manually.`,
            },
          });
        }
      }
    }
    // ============================================================
    // CASE 2: COD ORDER AFTER DELIVERY -> REQUESTS BANK MANUALLY
    // ============================================================
    else if (isCOD && order.isDelivered) {
      if (!bankDetails) {
        return NextResponse.json({
          error: 'Bank transfer or UPI details are required for COD returns.',
          requiresBankDetails: true,
        }, { status: 400 });
      }

      refundType = bankDetails.refundMethod === 'upi' ? 'upi_transfer' : 'bank_transfer';
      refundStatus = 'pending';

      refundRecord = await prisma.refund.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.totalPrice,
          reason: reason || 'Customer return after delivery',
          refundType,
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

    // Automatically restore product stock levels
    if (order.orderItems && order.orderItems.length > 0) {
      await Promise.allSettled(
        order.orderItems.map(async (item) => {
          if (item.productId) {
            try {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: Number(item.quantity) || 1,
                  },
                },
              });
            } catch (stockErr) {
              console.error(`❌ Failed to restore stock for item ${item.productId}:`, stockErr);
            }
          }
        })
      );
    }

    // Update order status fields in DB
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
        refundedAt: refundStatus === 'completed' || refundStatus === 'processing' ? new Date() : null,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // Send emails (Non-blocking)
    try {
      if (updatedOrder.user?.email) {
        await sendOrderCancelled(
          updatedOrder,
          updatedOrder.user.email,
          updatedOrder.user.name,
          reason || 'Customer requested cancellation'
        );

        if (razorpayRefund && refundRecord) {
          await sendRefundProcessed(
            updatedOrder,
            refundRecord,
            updatedOrder.user.email,
            updatedOrder.user.name
          );
        }
      }

      await sendAdminCancelNotification(
        updatedOrder,
        updatedOrder.user,
        reason || 'Customer requested cancellation',
        refundRecord
      );
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder,
      refund: refundRecord,
      refundType,
      refundStatus,
      refundWarning,
    });

  } catch (error) {
    console.error('❌ Cancel order error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to cancel order',
    }, { status: 500 });
  }
}