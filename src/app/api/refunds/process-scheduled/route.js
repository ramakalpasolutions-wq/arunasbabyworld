import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createRefund } from '@/lib/razorpay';
import { sendRefundProcessed } from '@/lib/nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { refundId } = body;

    if (!refundId) {
      return NextResponse.json({ error: 'refundId required' }, { status: 400 });
    }

    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    if (refund.refundStatus !== 'scheduled') {
      return NextResponse.json({
        success: false,
        message: `Refund is ${refund.refundStatus}, not scheduled. Skipping.`,
      });
    }

    const now = new Date();
    if (refund.scheduledAt && new Date(refund.scheduledAt) > now) {
      return NextResponse.json({
        success: false,
        message: 'Scheduled time has not yet passed',
        timeLeft: new Date(refund.scheduledAt).getTime() - now.getTime(),
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: refund.orderId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let razorpayResult = null;
    let finalStatus = 'completed';
    let isAlreadyRefunded = false;
    let successMessage = '';

    /* ══════════════════════════════════════════
       TRY RAZORPAY AUTO REFUND
    ══════════════════════════════════════════ */
    if (order.paymentMethod === 'Razorpay' && order.isPaid && refund.razorpayPaymentId) {
      console.log(`⚡ Triggering Razorpay refund for: ${refund.razorpayPaymentId}`);

      razorpayResult = await createRefund(
        refund.razorpayPaymentId,
        refund.amount,
        {
          reason: refund.reason || 'Customer return approved',
          orderId: refund.orderId,
        }
      );

      if (razorpayResult.success) {
        finalStatus = 'processing';
        successMessage = `Razorpay refund triggered: ${razorpayResult.refund.id}`;
        console.log(`✅ ${successMessage}`);
      } else {
        // ✅ KEY FIX: Check if payment was ALREADY refunded
        const errorMsg = razorpayResult.error?.toLowerCase() || '';
        
        if (errorMsg.includes('already') || errorMsg.includes('fully refunded')) {
          // Payment was already refunded earlier → MARK AS COMPLETED!
          finalStatus = 'completed';
          isAlreadyRefunded = true;
          successMessage = '✅ Payment was already refunded earlier. Marking as completed.';
          console.log(`✅ ${successMessage}`);
        } else {
          // Real failure
          finalStatus = 'failed';
          console.error('❌ Razorpay refund failed:', razorpayResult.error);
        }
      }
    } else {
      // COD/manual refunds - just mark as completed
      finalStatus = 'completed';
      successMessage = 'Manual refund - marked as completed';
    }

    // Build notes
    let notesMessage;
    if (isAlreadyRefunded) {
      notesMessage = `✅ Already refunded by Razorpay earlier. Customer received money.`;
    } else if (razorpayResult?.success) {
      notesMessage = `Auto-refund triggered. Razorpay ID: ${razorpayResult.refund.id}`;
    } else if (razorpayResult?.error && finalStatus === 'failed') {
      notesMessage = `Auto-refund failed: ${razorpayResult.error}`;
    } else {
      notesMessage = `Auto-processed at ${now.toLocaleString('en-IN')}`;
    }

    // Update refund record
    const updated = await prisma.refund.update({
      where: { id: refundId },
      data: {
        refundStatus: finalStatus,
        processedAt: now,
        razorpayRefundId: razorpayResult?.refund?.id || refund.razorpayRefundId,
        notes: notesMessage,
      },
    });

    // Update order
    await prisma.order.update({
      where: { id: refund.orderId },
      data: {
        refundStatus: finalStatus,
        ...(finalStatus === 'completed' && {
          refundedAt: now,
          orderStatus: 'Refunded',
        }),
        ...(finalStatus === 'processing' && {
          orderStatus: 'Refunded',
        }),
      },
    });

    // Send email (only if not failed)
    if (order.user?.email && finalStatus !== 'failed') {
      try {
        await sendRefundProcessed(
          order,
          {
            amount: refund.amount,
            razorpayRefundId: razorpayResult?.refund?.id || refund.razorpayRefundId,
            id: refund.id,
          },
          order.user.email,
          order.user.name,
          razorpayResult?.speed || 'optimum'
        );
        console.log('✅ Refund email sent');
      } catch (emailErr) {
        console.error('❌ Email error:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: successMessage || 'Refund processed',
      isAlreadyRefunded,
      finalStatus,
      refund: updated,
      razorpayResult,
    });
  } catch (err) {
    console.error('Process scheduled error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST with { refundId } to process scheduled refund',
  });
}