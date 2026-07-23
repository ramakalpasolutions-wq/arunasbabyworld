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

// ============================================================
// ✅ EXCHANGE REQUEST CONFIRMATION — Customer
// ============================================================
export const sendExchangeRequestConfirmation = async (exchange, order, customerEmail, customerName, paymentLinkUrl = null) => {
  const priceDiff   = exchange.priceDifference;
  const needsPay    = priceDiff > 0;
  const getsRefund  = priceDiff < 0;
  const samePrice   = priceDiff === 0;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#FF6B35,#7B2FBE);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">🔄 Exchange Request Received!</h1>
        <p style="color:#FFE4CC;margin:8px 0 0;font-size:15px;">We're processing your exchange</p>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Your exchange request has been received. Here are the details:</p>

        <!-- Product Comparison -->
        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B35;">
          <h3 style="margin:0 0 16px;color:#FF6B35;">Exchange Details</h3>

          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:45%;padding:12px;background:#FEF2F2;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#DC2626;text-transform:uppercase;">↩️ Returning</p>
                <img src="${exchange.oldProductImage || 'https://via.placeholder.com/60'}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin:6px 0;"/>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#7F1D1D;">${exchange.oldProductName}</p>
                <p style="margin:0;font-size:15px;font-weight:900;color:#DC2626;">₹${exchange.oldPrice?.toLocaleString('en-IN')}</p>
              </td>
              <td style="width:10%;text-align:center;font-size:24px;color:#7B2FBE;">→</td>
              <td style="width:45%;padding:12px;background:#ECFDF5;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#10B981;text-transform:uppercase;">📦 Getting</p>
                <img src="${exchange.newProductImage || 'https://via.placeholder.com/60'}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin:6px 0;"/>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#065F46;">${exchange.newProductName}</p>
                <p style="margin:0;font-size:15px;font-weight:900;color:#10B981;">₹${exchange.newPrice?.toLocaleString('en-IN')}</p>
              </td>
            </tr>
          </table>

          <p style="margin:16px 0 8px;"><strong>Reason:</strong> ${exchange.reason}</p>
          <p style="margin:0;"><strong>Order ID:</strong> #${order.id?.slice(-8).toUpperCase()}</p>
        </div>

        <!-- Price Difference Box -->
        <div style="background:${samePrice ? '#ECFDF5' : needsPay ? '#FFFBEB' : '#EFF6FF'};padding:20px;border-radius:10px;margin:20px 0;border:2px solid ${samePrice ? '#10B981' : needsPay ? '#F59E0B' : '#3B82F6'};text-align:center;">
          <p style="margin:0;font-size:14px;font-weight:800;color:${samePrice ? '#065F46' : needsPay ? '#92400E' : '#1E40AF'};text-transform:uppercase;letter-spacing:0.6px;">
            ${samePrice ? '✅ Free Exchange' : needsPay ? '💰 Price Difference' : '💸 Refund Coming'}
          </p>
          <p style="margin:10px 0;font-size:2rem;font-weight:900;color:${samePrice ? '#10B981' : needsPay ? '#F59E0B' : '#3B82F6'};">
            ${samePrice ? 'No payment needed' : needsPay ? `+ ₹${priceDiff.toLocaleString('en-IN')}` : `− ₹${Math.abs(priceDiff).toLocaleString('en-IN')}`}
          </p>
          <p style="margin:0;font-size:13px;color:${samePrice ? '#047857' : needsPay ? '#78350F' : '#1E40AF'};">
            ${samePrice
              ? 'We will swap your product after pickup & verification.'
              : needsPay
                ? 'Please complete payment below to proceed with exchange.'
                : 'We will auto-refund the difference to your original payment method.'}
          </p>
        </div>

        <!-- Payment Link (if needed) -->
        ${needsPay && paymentLinkUrl ? `
          <div style="background:linear-gradient(135deg,#FFEDD5,#FED7AA);padding:20px;border-radius:10px;margin:20px 0;border:2px solid #FB923C;text-align:center;">
            <p style="margin:0 0 12px;font-size:14px;font-weight:800;color:#9A3412;">
              💳 Complete Payment to Continue
            </p>
            <a href="${paymentLinkUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#F97316,#EA580C);color:white;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">
              Pay ₹${priceDiff.toLocaleString('en-IN')} Now →
            </a>
            <p style="margin:10px 0 0;font-size:12px;color:#9A3412;">
              Secure payment via Razorpay
            </p>
          </div>
        ` : ''}

        <!-- Process Steps -->
        <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;">
          <h4 style="margin:0 0 8px;color:#92400e;">📋 Exchange Process</h4>
          <ol style="margin:0;padding-left:20px;color:#78350f;line-height:1.8;">
            <li>Admin reviews your request (within 24 hours)</li>
            <li>${needsPay ? 'Complete payment using link above' : 'Pickup arranged at your delivery address'}</li>
            <li>Returned item verified at our warehouse</li>
            <li>New product packed and shipped to you</li>
            <li>Track your new product with tracking number</li>
          </ol>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/exchanges"
             style="background:linear-gradient(135deg,#FF6B35,#7B2FBE);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            Track My Exchanges
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">
          Questions? care@Arunas Baby World.in | Thank you for shopping with Arunas Baby World! 🍼
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `🔄 Exchange Request - #${order.id?.slice(-8).toUpperCase()} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ ADMIN — Exchange Notification
// ============================================================
export const sendAdminExchangeNotification = async (exchange, order, customer) => {
  const priceDiff  = exchange.priceDifference;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#FF6B35,#7B2FBE);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">🔄 New Exchange Request</h2>
      </div>
      <div style="padding:24px;background:#FFF7ED;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B35;">
          <h3 style="margin:0 0 10px;color:#FF6B35;">Customer Info</h3>
          <p><strong>Name:</strong> ${customer.name}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Phone:</strong> ${order.shippingAddress?.phone || 'N/A'}</p>
          <p><strong>Order:</strong> #${order.id?.slice(-8).toUpperCase()}</p>
          <p><strong>Reason:</strong> <strong style="color:#FF6B35;">${exchange.reason}</strong></p>
          ${exchange.description ? `<p><strong>Details:</strong> ${exchange.description}</p>` : ''}
        </div>

        <!-- Products -->
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;">
          <h3 style="margin:0 0 14px;color:#2D1A4A;">Product Exchange</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:45%;padding:12px;background:#FEF2F2;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#DC2626;">↩️ RETURNING</p>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#7F1D1D;">${exchange.oldProductName}</p>
                <p style="margin:0;font-weight:900;color:#DC2626;">₹${exchange.oldPrice?.toLocaleString('en-IN')}</p>
              </td>
              <td style="width:10%;text-align:center;font-size:24px;">→</td>
              <td style="width:45%;padding:12px;background:#ECFDF5;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#10B981;">📦 GIVING</p>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#065F46;">${exchange.newProductName}</p>
                <p style="margin:0;font-weight:900;color:#10B981;">₹${exchange.newPrice?.toLocaleString('en-IN')}</p>
              </td>
            </tr>
          </table>
          ${priceDiff !== 0 ? `
            <div style="margin-top:14px;padding:10px;background:${priceDiff > 0 ? '#FFFBEB' : '#EFF6FF'};border-radius:8px;text-align:center;">
              <strong style="color:${priceDiff > 0 ? '#F59E0B' : '#3B82F6'};">
                ${priceDiff > 0 ? '💰 Customer pays' : '💸 Refund to customer'}: ₹${Math.abs(priceDiff).toLocaleString('en-IN')}
              </strong>
            </div>
          ` : '<p style="margin-top:14px;text-align:center;color:#10B981;font-weight:800;">✅ Same price — Free Exchange</p>'}
        </div>

        <!-- Pickup Address -->
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #8B5CF6;">
          <h4 style="margin:0 0 10px;color:#8B5CF6;">📍 Pickup Address</h4>
          <p style="margin:0;line-height:1.7;color:#2D1A4A;">
            <strong>${order.shippingAddress?.name}</strong><br/>
            📞 ${order.shippingAddress?.phone}<br/>
            ${order.shippingAddress?.address}<br/>
            ${order.shippingAddress?.city}, ${order.shippingAddress?.state} — ${order.shippingAddress?.pincode}
          </p>
        </div>

        <div style="background:#fef2f2;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #ef4444;">
          <h4 style="margin:0 0 8px;color:#dc2626;">⚠️ Action Required</h4>
          <ol style="margin:0;padding-left:20px;color:#7f1d1d;line-height:1.8;">
            <li>Review exchange request in admin panel</li>
            <li>Approve or reject the request</li>
            <li>Arrange courier pickup if approved</li>
            <li>Verify returned product condition</li>
            <li>Ship new product after verification</li>
          </ol>
        </div>

        <div style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/exchanges/${exchange.id}"
             style="background:#FF6B35;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `🔄 Exchange: #${order.id?.slice(-8).toUpperCase()} - ${exchange.oldProductName}`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE APPROVED — Customer
// ============================================================
export const sendExchangeApproved = async (exchange, order, customerEmail, customerName) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#3B82F6,#2563EB);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">✅ Exchange Approved!</h1>
        <p style="color:#BFDBFE;margin:8px 0 0;font-size:15px;">Your exchange is moving forward</p>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Great news! Your exchange request has been <strong style="color:#10B981;">approved</strong>.</p>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #3B82F6;">
          <h3 style="margin:0 0 10px;color:#3B82F6;">What's Next?</h3>
          <ol style="margin:10px 0 0;padding-left:20px;line-height:2;color:#374151;">
            <li><strong>📦 Pickup Scheduled</strong> — Our courier will pick up the product within 2–3 business days</li>
            <li><strong>🔍 Verification</strong> — Product will be inspected at our warehouse</li>
            <li><strong>🚚 New Product Shipped</strong> — Once verified, we'll ship your replacement</li>
            <li><strong>🎉 Delivered</strong> — Track delivery with the shipment tracking number</li>
          </ol>
        </div>

        <div style="background:#ecfdf5;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
          <p style="margin:0;color:#065f46;font-weight:600;">
            📞 Please ensure someone is available at the delivery address for pickup.
          </p>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/exchanges"
             style="background:linear-gradient(135deg,#3B82F6,#2563EB);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            Track Exchange Status
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">Thank you for shopping with Arunas Baby World! 🍼</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `✅ Exchange Approved - #${order.id?.slice(-8).toUpperCase()} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE SHIPPED — Customer
// ============================================================
export const sendExchangeShipped = async (exchange, order, customerEmail, customerName) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#06B6D4,#0891B2);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">🚚 New Product Shipped!</h1>
        <p style="color:#CFFAFE;margin:8px 0 0;font-size:15px;">Your replacement is on the way</p>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Your exchange is almost complete! We've shipped your new product.</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #06B6D4;">
          <h3 style="margin:0 0 14px;color:#06B6D4;">📦 New Product</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:80px;padding-right:14px;vertical-align:top;">
                <img src="${exchange.newProductImage || 'https://via.placeholder.com/70'}" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:10px;"/>
              </td>
              <td>
                <p style="margin:0 0 6px;font-weight:800;color:#2D1A4A;">${exchange.newProductName}</p>
                <p style="margin:0;color:#10B981;font-weight:900;font-size:18px;">₹${exchange.newPrice?.toLocaleString('en-IN')}</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Tracking -->
        <div style="background:linear-gradient(135deg,#CFFAFE,#A5F3FC);padding:20px;border-radius:10px;margin:20px 0;border:2px solid #06B6D4;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:800;color:#0E7490;text-transform:uppercase;letter-spacing:0.6px;">
            🚚 Tracking Number
          </p>
          <p style="margin:10px 0;font-size:1.4rem;font-weight:900;color:#155E75;font-family:monospace;">
            ${exchange.shipmentTracking}
          </p>
          <p style="margin:0;font-size:12px;color:#0E7490;">
            Use this tracking number on the courier's website to track delivery
          </p>
        </div>

        <div style="background:#d1fae5;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#065f46;font-weight:600;">
            🎉 Your exchange is almost complete! Expected delivery in 3–5 business days.
          </p>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/exchanges"
             style="background:linear-gradient(135deg,#06B6D4,#0891B2);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View Exchange Details
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">Thank you for shopping with Arunas Baby World! 🍼</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `🚚 Exchange Shipped - #${order.id?.slice(-8).toUpperCase()} | Arunas Baby World`,
    html,
  });
};