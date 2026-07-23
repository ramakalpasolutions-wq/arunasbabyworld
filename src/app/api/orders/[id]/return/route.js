import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createRefund } from '@/lib/razorpay';
import {
  sendReturnRequestConfirmation,
  sendRefundRequestConfirmation,
  sendAdminReturnNotification,
  sendAdminRefundNotification,
  sendRefundProcessed,
} from '@/lib/nodemailer';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason, refundMethod, upiId, bankDetails } = body;

    /* ── Validate ── */
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Return reason is required' }, { status: 400 });
    }
    if (!['upi', 'bank'].includes(refundMethod)) {
      return NextResponse.json({ error: 'Invalid refund method' }, { status: 400 });
    }
    if (refundMethod === 'upi' && !upiId?.trim()) {
      return NextResponse.json({ error: 'UPI ID is required' }, { status: 400 });
    }
    if (refundMethod === 'bank') {
      if (!bankDetails?.accountHolderName?.trim())
        return NextResponse.json({ error: 'Account holder name required' }, { status: 400 });
      if (!bankDetails?.accountNumber?.trim())
        return NextResponse.json({ error: 'Account number required' }, { status: 400 });
      if (!bankDetails?.ifscCode?.trim())
        return NextResponse.json({ error: 'IFSC code required' }, { status: 400 });
    }

    /* ── Fetch order ── */
    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    /* ── Auth ── */
    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    /* ── Business rules ── */
    if (!order.isDelivered || order.orderStatus !== 'Delivered') {
      return NextResponse.json(
        { error: 'Return/Refund only for delivered orders' },
        { status: 400 }
      );
    }
    if (order.returnRequest) {
      return NextResponse.json(
        { error: 'Return/Refund request already submitted' },
        { status: 400 }
      );
    }

    /* ── Is this a Return or Refund request? ── */
    const isRefundOnly = reason === 'Refund requested by customer';

    /* ── Build email refund data ── */
    const emailRefundData = {
      refundMethod,
      reason,
      ...(refundMethod === 'upi'
        ? { upiId }
        : {
            bankDetails: {
              accountHolderName: bankDetails?.accountHolderName,
              accountNumberMasked: bankDetails?.accountNumber?.slice(-4).padStart(bankDetails.accountNumber.length, '*'),
              ifscCode: bankDetails?.ifscCode,
              bankName: bankDetails?.bankName || '',
            },
          }),
    };

    /* ══════════════════════════════════════════
       STEP 1: TRY RAZORPAY AUTO REFUND first (if applicable)
    ══════════════════════════════════════════ */
    let razorpayRefundResult = null;
    let refundSpeed = 'normal';

    if (order.isPaid && order.paymentMethod === 'Razorpay') {
      const paymentId = order.paymentResult?.razorpayPaymentId;

      if (paymentId) {
        console.log('⚡ AUTO initiating instant Razorpay refund:', paymentId);
        razorpayRefundResult = await createRefund(paymentId, order.totalPrice, {
          reason: reason || 'Customer return/refund request',
          orderId: order.id,
        });

        if (razorpayRefundResult.success) {
          refundSpeed = razorpayRefundResult.speed || 'optimum';
          console.log(`✅ Razorpay refund created: ${razorpayRefundResult.refund.id} | Speed: ${refundSpeed}`);
        } else {
          console.error('❌ Auto refund failed:', razorpayRefundResult.error);
        }
      }
    }

    /* ══════════════════════════════════════════
       ✅ STEP 2: ALWAYS CREATE REFUND RECORD (KEY FIX!)
       This ensures admin can see ALL refund requests
    ══════════════════════════════════════════ */
    
    // Determine refund type based on method + payment
    let refundType;
    let refundStatus;
    
    if (razorpayRefundResult?.success) {
      // Razorpay auto-refund succeeded
      refundType   = 'razorpay';
      refundStatus = 'processing';
    } else if (refundMethod === 'upi') {
      // Manual UPI refund needed
      refundType   = 'upi_transfer';
      refundStatus = 'pending';
    } else {
      // Manual Bank refund needed
      refundType   = 'bank_transfer';
      refundStatus = 'pending';
    }

    // Build bank details object for Refund record
    const refundBankDetails = refundMethod === 'upi'
      ? {
          upiId: upiId,
          accountHolderName: null,
          accountNumber: null,
          ifscCode: null,
          bankName: null,
        }
      : {
          upiId: null,
          accountHolderName: bankDetails?.accountHolderName || null,
          accountNumber:     bankDetails?.accountNumber || null,
          ifscCode:          bankDetails?.ifscCode || null,
          bankName:          bankDetails?.bankName || null,
        };

    // ✅ ALWAYS create Refund record (not just for Razorpay!)
    const refundRecord = await prisma.refund.create({
      data: {
        orderId:          order.id,
        userId:           order.userId,
        amount:           order.totalPrice,
        reason:           reason || 'Customer return/refund',
        refundType:       refundType,
        refundStatus:     refundStatus,
        razorpayRefundId: razorpayRefundResult?.refund?.id || null,
        razorpayPaymentId: order.paymentResult?.razorpayPaymentId || null,
        bankDetails:      refundBankDetails,
      },
    });

    console.log(`✅ Refund record created: ${refundRecord.id} | Type: ${refundType} | Status: ${refundStatus}`);

    /* ── Build return payload ── */
    const returnPayload = {
      reason,
      refundMethod,
      type: isRefundOnly ? 'refund' : 'return',
      status: razorpayRefundResult?.success ? 'Refund_Initiated' : 'Pending',
      requestedAt: new Date().toISOString(),
      ...(refundMethod === 'upi'
        ? { upiId }
        : {
            bankName: bankDetails?.bankName || '',
            accountHolderName: bankDetails?.accountHolderName,
            accountNumberMasked: bankDetails?.accountNumber
              ?.slice(-4)
              .padStart(bankDetails.accountNumber.length, '*'),
            ifscCode: bankDetails?.ifscCode,
          }),
      ...(razorpayRefundResult?.success && {
        razorpayRefundId: razorpayRefundResult.refund.id,
        razorpayRefundStatus: razorpayRefundResult.refund.status,
        refundSpeed,
      }),
    };

    /* ── Update order in DB (link to refund) ── */
    const updated = await prisma.order.update({
      where: { id },
      data: {
        returnRequest: returnPayload,
        returnStatus:  'Pending',
        orderStatus:   'Return_Requested',
        // ✅ Always link refund to order (not just for Razorpay)
        refundId:      refundRecord.id,
        refundStatus:  refundStatus,
        refundAmount:  order.totalPrice,
      },
    });

    /* ══════════════════════════════════════════
       SEND EMAILS (non-blocking)
    ══════════════════════════════════════════ */
    const customerEmail = order.user?.email || session.user.email;
    const customerName  = order.user?.name  || session.user.name;
    const adminInfo     = { name: customerName, email: customerEmail };

    Promise.allSettled([
      // 1. Customer confirmation email
      (isRefundOnly
        ? sendRefundRequestConfirmation(order, customerEmail, customerName, emailRefundData)
        : sendReturnRequestConfirmation(order, customerEmail, customerName, emailRefundData)
      ).catch(e => console.error('❌ Customer email error:', e)),

      // 2. If Razorpay auto-refund succeeded → send "refund initiated" email
      (razorpayRefundResult?.success
        ? sendRefundProcessed(
            order,
            {
              amount: order.totalPrice,
              razorpayRefundId: razorpayRefundResult.refund.id,
              id: refundRecord.id,
            },
            customerEmail,
            customerName,
            refundSpeed
          )
        : Promise.resolve()
      ).catch(e => console.error('❌ Refund processed email error:', e)),

      // 3. Admin notification
      (isRefundOnly
        ? sendAdminRefundNotification(order, adminInfo, emailRefundData)
        : sendAdminReturnNotification(order, adminInfo, emailRefundData)
      ).catch(e => console.error('❌ Admin email error:', e)),

    ]).then(results => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Email ${i} failed:`, r.reason);
        else console.log(`✅ Email ${i} sent`);
      });
    });

    /* ── Response ── */
    return NextResponse.json({
      success: true,
      message: isRefundOnly
        ? 'Refund request submitted successfully'
        : 'Return request submitted successfully',
      returnRequest: updated.returnRequest,
      refundId: refundRecord.id, // ✅ Always return refundId

      refundInfo: {
        autoRefunded: !!razorpayRefundResult?.success,
        refundSpeed,
        refundType,
        estimatedTime: razorpayRefundResult?.success
          ? (refundSpeed === 'optimum' ? 'Within 2–3 hours' : 'Within 5–7 business days')
          : 'Manual processing — 5–7 business days',
        razorpayRefundId: razorpayRefundResult?.refund?.id || null,
        refundRecordId: refundRecord.id,
      },
    });

  } catch (err) {
    console.error('[RETURN POST ERROR]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true, userId: true,
        returnRequest: true, returnStatus: true, orderStatus: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      returnRequest: order.returnRequest,
      returnStatus: order.returnStatus,
    });

  } catch (err) {
    console.error('[RETURN GET ERROR]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}