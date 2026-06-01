import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
// ✅ Create Instant Refund
// speed: 'optimum' = instant (within 2-3 hrs on Live mode)
// speed: 'normal'  = 5-7 business days (fallback)
// ============================================================
export async function createRefund(paymentId, amount, notes = {}) {
  try {
    console.log('⚡ Attempting INSTANT refund for:', paymentId, 'Amount:', amount);

    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // paise
      speed: 'optimum',                 // ✅ instant refund
      notes: {
        reason:  notes.reason  || 'Customer request',
        orderId: notes.orderId || '',
      },
    });

    console.log('✅ Instant Razorpay refund created:', refund.id, '| Speed:', refund.speed);
    return { success: true, refund, speed: 'optimum' };

  } catch (error) {
    console.error('❌ Instant refund failed, trying normal speed...', error?.error?.description || error.message);

    // ── Fallback to normal speed ──
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        speed: 'normal',
        notes: {
          reason:  notes.reason  || 'Customer request',
          orderId: notes.orderId || '',
        },
      });

      console.log('✅ Normal speed refund created:', refund.id);
      return { success: true, refund, speed: 'normal' };

    } catch (fallbackError) {
      console.error('❌ Both refund attempts failed:', fallbackError?.error?.description || fallbackError.message);
      return {
        success: false,
        error: fallbackError?.error?.description || fallbackError.message || 'Refund failed',
      };
    }
  }
}

// ============================================================
// ✅ Fetch Refund Status from Razorpay
// ============================================================
export async function getRefundDetails(paymentId, refundId) {
  try {
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
    return { success: true, refund };
  } catch (error) {
    console.error('❌ Fetch refund error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// ✅ Fetch Payment Details (to get paymentId from orderId)
// ============================================================
export async function getPaymentDetails(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error('❌ Fetch payment error:', error);
    return { success: false, error: error.message };
  }
}