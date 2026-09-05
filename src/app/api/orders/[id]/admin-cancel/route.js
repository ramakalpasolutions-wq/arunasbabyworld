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

    // ✅ Validate Admin Privileges
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized. Admin access required.' }, { status: 403 });
    }

    // Await params safely for compatibility with Next.js 14 and Next.js 15
    const params = await Promise.resolve(context.params);
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      reason,
      adminNotes,
      refundMethod,      // 'razorpay' | 'manual' | 'none'
      bankDetails,       // optional for manual
    } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    // Get order details
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

    let refundType = 'not_required';
    let refundStatus = 'not_required';
    let refundRecord = null;
    let razorpayRefund = null;
    let refundWarning = null;

    const isRazorpay = order.paymentMethod?.toUpperCase() === 'RAZORPAY';
    const isPaid     = Boolean(order.isPaid || order.paymentStatus === 'paid');

    // Extract payment ID from nested payment result properties securely
    const paymentId =
      order.paymentResult?.razorpayPaymentId ||
      order.paymentResult?.id ||
      order.paymentResult?.razorpay_payment_id ||
      null;

    // ============================================================
    // CASE A: AUTOMATED RAZORPAY REFUND REQUESTED
    // ============================================================
    if (isPaid && refundMethod === 'razorpay') {
      refundType = 'razorpay';

      if (!paymentId) {
        console.warn(`⚠️ Paid order ${order.id} has no payment ID. Initializing manual pending refund.`);
        refundStatus = 'pending_manual_review';
        refundWarning = 'Paid online, but no transaction ID was found in the database. Marked for manual refund.';

        refundRecord = await prisma.refund.create({
          data: {
            orderId:           order.id,
            userId:            order.userId,
            amount:            order.totalPrice,
            reason:            reason,
            refundType:        'razorpay_manual_pending',
            refundStatus:      'pending',
            notes:             adminNotes || `Cancelled by admin: ${session.user.name}. (Payment ID not found)`,
            scheduledByAdmin:  session.user.email || session.user.name,
          },
        });
      } else {
        // Trigger automated refund via Razorpay helper
        const refundResult = await createRefund(paymentId, order.totalPrice, {
          reason:  reason,
          orderId: order.id,
        });

        if (refundResult.success) {
          razorpayRefund = refundResult.refund;
          refundStatus = razorpayRefund.status === 'processed' ? 'completed' : 'processing';

          // Log transaction in Refund table
          refundRecord = await prisma.refund.create({
            data: {
              orderId:           order.id,
              userId:            order.userId,
              amount:            order.totalPrice,
              reason:            reason,
              refundType:        'razorpay',
              refundStatus:      refundStatus,
              razorpayRefundId:  razorpayRefund.id,
              razorpayPaymentId: paymentId,
              notes:             adminNotes || `Cancelled by admin: ${session.user.name}`,
              scheduledByAdmin:  session.user.email || session.user.name,
              processedAt:       new Date(),
            },
          });
        } else {
          // ✅ SAFE FALLBACK: Convert to manual pending review if Razorpay rejects ID
          console.warn(`⚠️ Admin automated refund failed: ${refundResult.error}. Marking as pending manual review.`);
          refundStatus = 'pending_manual_review';
          refundWarning = `Razorpay API rejected refund: "${refundResult.error}". Order is cancelled, please refund manually.`;

          refundRecord = await prisma.refund.create({
            data: {
              orderId:           order.id,
              userId:            order.userId,
              amount:            order.totalPrice,
              reason:            reason,
              refundType:        'razorpay_manual_pending',
              refundStatus:      'pending',
              notes:             `Auto refund failed with error: "${refundResult.error}". Admin must process manually.`,
              scheduledByAdmin:  session.user.email || session.user.name,
            },
          });
        }
      }
    }
    // ============================================================
    // CASE B: MANUAL UPI / BANK REFUND REQUESTED
    // ============================================================
    else if (isPaid && refundMethod === 'manual') {
      if (!bankDetails || (!bankDetails.upiId && !bankDetails.accountNumber)) {
        return NextResponse.json({
          error: 'Bank details or UPI ID required for manual refund',
        }, { status: 400 });
      }

      refundType = bankDetails.upiId ? 'upi_transfer' : 'bank_transfer';
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

    // ✅ Restore stock levels instantly (never let API gateway errors block inventory updates)
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

    // ✅ Update Order status to Cancelled
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
        refundedAt:    refundStatus === 'completed' || refundStatus === 'processing' ? new Date() : null,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // ✅ Send emails (Non-blocking)
    try {
      if (updatedOrder.user?.email) {
        await sendOrderCancelled(
          updatedOrder,
          updatedOrder.user.email,
          updatedOrder.user.name,
          `Cancelled by admin: ${reason}`
        );

        if (refundRecord && refundStatus !== 'pending_manual_review') {
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
        `Cancelled by admin: ${reason}`,
        refundRecord
      );
    } catch (emailErr) {
      console.error('❌ Email error (non-blocking):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: refundWarning 
        ? `Order cancelled. ⚠️ ${refundWarning}` 
        : 'Order cancelled by admin successfully.',
      order: updatedOrder,
      refund: refundRecord,
      refundType,
      refundWarning,
    });

  } catch (error) {
    console.error('❌ Admin cancel error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to cancel order',
    }, { status: 500 });
  }
}