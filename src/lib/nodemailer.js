import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"BabyBliss" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

// ============================================================
// ✅ ORDER CONFIRMATION EMAIL
// ============================================================
export const sendOrderConfirmation = async (order, customerEmail, customerName) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#ff6b9d,#7c3aed);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">🎉 Order Confirmed!</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Thank you for your order! Your order has been confirmed.</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ff6b9d;">
          <h3 style="margin:0 0 12px;color:#ff6b9d;">Order Details</h3>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod || 'Razorpay'}</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#333;">Items Ordered</h3>
          ${order.orderItems?.map(item => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
              <span>${item.name} × ${item.quantity}</span>
              <span><strong>₹${((item.price||0)*(item.quantity||1)).toLocaleString('en-IN')}</strong></span>
            </div>
          `).join('')}
          <div style="text-align:right;margin-top:12px;font-size:18px;font-weight:bold;color:#ff6b9d;">
            Total: ₹${order.totalPrice?.toLocaleString('en-IN')}
          </div>
        </div>
        <div style="background:#e0f2fe;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;color:#0369a1;">📦 We will notify you when your order is shipped!</p>
        </div>
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#ff6b9d,#7c3aed);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            Track Your Order
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">
          Thank you for shopping with BabyBliss! 🍼
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `✅ Order Confirmed - #${order.id?.slice(-8)?.toUpperCase()} | BabyBliss`,
    html,
  });
};

// ============================================================
// ✅ ORDER STATUS UPDATE
// ============================================================
export const sendOrderStatusUpdate = async (order, customerEmail, customerName) => {
  const statusEmoji = {
    Confirmed:'✅', Processing:'⚙️', Shipped:'🚚', Delivered:'🎉', Cancelled:'❌',
  };
  const emoji = statusEmoji[order.orderStatus] || '📦';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#ff6b9d,#7c3aed);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">${emoji} Order ${order.orderStatus}!</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Your order <strong>#${order.id?.slice(-8)?.toUpperCase()}</strong> is now <strong>${order.orderStatus}</strong>.</p>
        ${order.orderStatus === 'Shipped' && order.trackingNumber ? `
          <div style="background:#e0f2fe;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#0369a1;">🚚 Tracking: <strong>${order.trackingNumber}</strong></p>
          </div>
        ` : ''}
        ${order.orderStatus === 'Delivered' ? `
          <div style="background:#d1fae5;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#065f46;">🎉 Your order has been delivered! Enjoy your purchase.</p>
          </div>
        ` : ''}
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#ff6b9d,#7c3aed);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View Order
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">Thank you for shopping with BabyBliss! 🍼</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `${emoji} Order ${order.orderStatus} - #${order.id?.slice(-8)?.toUpperCase()} | BabyBliss`,
    html,
  });
};

// ============================================================
// ✅ ORDER CANCELLED EMAIL
// ============================================================
export const sendOrderCancelled = async (order, customerEmail, customerName, reason) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">❌ Order Cancelled</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Your order has been cancelled.</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ef4444;">
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        ${order.isPaid && order.paymentMethod === 'Razorpay' ? `
          <div style="background:#dcfce7;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
            <p style="margin:0;color:#065f46;">
              ⚡ <strong>Auto Refund Initiated!</strong><br/>
              ₹${order.totalPrice?.toLocaleString('en-IN')} refund has been automatically initiated.<br/>
              <strong>Expected: Within 2–3 hours</strong> (Instant refund via Razorpay)
            </p>
          </div>
        ` : ''}
        ${order.paymentMethod === 'COD' && !order.isDelivered ? `
          <div style="background:#dcfce7;padding:16px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;color:#065f46;">✅ No refund needed — COD order not yet paid.</p>
          </div>
        ` : ''}
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/products"
             style="background:linear-gradient(135deg,#ff6b9d,#7c3aed);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            Continue Shopping
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">Need help? Contact us at care@babybliss.in</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `❌ Order Cancelled - #${order.id?.slice(-8)?.toUpperCase()} | BabyBliss`,
    html,
  });
};

// ============================================================
// ✅ INSTANT REFUND INITIATED EMAIL — Razorpay auto refund
// ============================================================
export const sendRefundProcessed = async (order, refund, customerEmail, customerName, refundSpeed = 'optimum') => {
  const isInstant = refundSpeed === 'optimum';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">${isInstant ? '⚡ Instant Refund Initiated!' : '💰 Refund Initiated!'}</h1>
        <p style="color:#a7f3d0;margin:8px 0 0;font-size:15px;">
          ${isInstant ? 'Your money is on its way!' : 'Refund has been processed'}
        </p>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>
          ${isInstant
            ? 'Great news! Your refund has been <strong>instantly initiated</strong> via Razorpay.'
            : 'Your refund has been successfully processed.'
          }
        </p>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
          <h3 style="margin:0 0 12px;color:#10b981;">Refund Details</h3>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Refund Amount:</strong>
            <span style="color:#10b981;font-size:1.4rem;font-weight:900;">
              ₹${(refund.amount || order.totalPrice)?.toLocaleString('en-IN')}
            </span>
          </p>
          <p><strong>Refund ID:</strong> <code>${refund.razorpayRefundId || refund.id || 'Processing'}</code></p>
          <p><strong>Initiated On:</strong> ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
          <p><strong>Refund To:</strong> 💳 Original Payment Method (Card/UPI/Net Banking)</p>
        </div>

        <!-- ✅ Time estimate box -->
        <div style="background:${isInstant ? '#f0fdf4' : '#fef3c7'};padding:20px;border-radius:8px;margin:20px 0;border:2px solid ${isInstant ? '#10b981' : '#f59e0b'};text-align:center;">
          <p style="margin:0;font-size:1rem;font-weight:800;color:${isInstant ? '#065f46' : '#92400e'};">
            ${isInstant ? '⚡ Expected Refund Time' : '⏱️ Expected Refund Time'}
          </p>
          <p style="margin:8px 0 0;font-size:1.8rem;font-weight:900;color:${isInstant ? '#10b981' : '#f59e0b'};">
            ${isInstant ? 'Within 2–3 Hours' : '5–7 Business Days'}
          </p>
          <p style="margin:6px 0 0;font-size:0.85rem;color:${isInstant ? '#047857' : '#92400e'};">
            ${isInstant
              ? 'The refund will appear in your bank account, UPI, or card statement shortly.'
              : 'The refund will be credited to your original payment method.'
            }
          </p>
        </div>

        <div style="background:white;padding:16px;border-radius:8px;margin:20px 0;">
          <h4 style="margin:0 0 8px;color:#333;">📋 What to check</h4>
          <ul style="margin:0;padding-left:20px;color:#555;line-height:1.8;">
            <li>Check your <strong>bank account / UPI app</strong> for the credit</li>
            <li>Check your <strong>card statement</strong> if paid by card</li>
            <li>Refund reference: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${refund.razorpayRefundId || refund.id || 'Processing'}</code></li>
          </ul>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View Order & Refund Status
          </a>
        </div>

        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">
          Need help? Contact us at care@babybliss.in<br/>
          Thank you for shopping with BabyBliss! 🍼
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `⚡ Refund of ₹${(refund.amount || order.totalPrice)?.toLocaleString('en-IN')} Initiated | BabyBliss`,
    html,
  });
};

// ============================================================
// ✅ RETURN REQUEST EMAIL — Customer
// ============================================================
export const sendReturnRequestConfirmation = async (order, customerEmail, customerName, returnData) => {
  const isUPI = returnData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">🔄 Return Request Received</h1>
        <p style="color:#fed7aa;margin:8px 0 0;">We've got your return request!</p>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>We have received your return request. Our team will contact you within <strong>24–48 hours</strong>.</p>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f97316;">
          <h3 style="margin:0 0 12px;color:#f97316;">Return Details</h3>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Return Reason:</strong> ${returnData.reason}</p>
          <p><strong>Refund Amount:</strong>
            <span style="color:#10b981;font-weight:900;font-size:1.1rem;">
              ₹${order.totalPrice?.toLocaleString('en-IN')}
            </span>
          </p>
          <p><strong>Status:</strong>
            <span style="background:#fff7ed;color:#f97316;padding:3px 10px;border-radius:20px;font-weight:700;font-size:13px;">
              🟡 Under Review
            </span>
          </p>
        </div>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid ${isUPI ? '#10b981' : '#3b82f6'};">
          <h3 style="margin:0 0 12px;color:${isUPI ? '#10b981' : '#3b82f6'};">
            ${isUPI ? '📱 UPI Refund' : '🏦 Bank Refund'}
          </h3>
          ${isUPI ? `
            <p><strong>UPI ID:</strong> ${returnData.upiId}</p>
            <p style="color:#10b981;font-weight:700;">
              ⚡ Refund within <strong>1–2 business days</strong> after item pickup
            </p>
          ` : `
            <p><strong>Account Holder:</strong> ${returnData.bankDetails?.accountHolderName || ''}</p>
            <p><strong>IFSC Code:</strong> ${returnData.bankDetails?.ifscCode || ''}</p>
            ${returnData.bankDetails?.bankName ? `<p><strong>Bank:</strong> ${returnData.bankDetails.bankName}</p>` : ''}
            <p style="color:#3b82f6;font-weight:700;">
              🏦 Refund within <strong>5–7 business days</strong> after item pickup
            </p>
          `}
        </div>

        <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;">
          <h4 style="margin:0 0 8px;color:#92400e;">📋 Return Process</h4>
          <ol style="margin:0;padding-left:20px;color:#78350f;line-height:1.8;">
            <li>Team contacts you within <strong>24–48 hours</strong></li>
            <li>Pickup arranged at your delivery address</li>
            <li>Item quality check completed</li>
            <li>Refund processed after inspection</li>
          </ol>
        </div>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#333;">Items Being Returned</h3>
          ${order.orderItems?.map(item => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
              <span>${item.name} × ${item.quantity}</span>
              <span><strong>₹${((item.price||0)*(item.quantity||1)).toLocaleString('en-IN')}</strong></span>
            </div>
          `).join('')}
          <div style="text-align:right;margin-top:12px;font-size:16px;font-weight:bold;color:#10b981;">
            Refund: ₹${order.totalPrice?.toLocaleString('en-IN')}
          </div>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#f97316,#ea580c);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View Return Status
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">
          Questions? care@babybliss.in | Thank you for shopping with BabyBliss! 🍼
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `🔄 Return Request - #${order.id?.slice(-8)?.toUpperCase()} | BabyBliss`,
    html,
  });
};

// ============================================================
// ✅ REFUND REQUEST EMAIL — Customer (COD manual refund)
// ============================================================
export const sendRefundRequestConfirmation = async (order, customerEmail, customerName, refundData) => {
  const isUPI = refundData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#7b2fbe,#9333ea);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;">💰 Refund Request Received</h1>
        <p style="color:#e9d5ff;margin:8px 0 0;">Your refund is being processed!</p>
      </div>
      <div style="padding:30px;background:#f9f9f9;border-radius:0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>We have received your refund request.</p>

        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #7b2fbe;">
          <h3 style="margin:0 0 12px;color:#7b2fbe;">Refund Details</h3>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Refund Amount:</strong>
            <span style="color:#10b981;font-weight:900;font-size:1.2rem;">
              ₹${order.totalPrice?.toLocaleString('en-IN')}
            </span>
          </p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>

        <!-- Refund time box -->
        <div style="background:${isUPI ? '#f0fdf4' : '#eff6ff'};padding:20px;border-radius:8px;margin:20px 0;border:2px solid ${isUPI ? '#10b981' : '#3b82f6'};text-align:center;">
          <p style="margin:0;font-size:0.9rem;font-weight:700;color:${isUPI ? '#065f46' : '#1e40af'};">
            ${isUPI ? '📱 Refund via UPI' : '🏦 Refund via Bank Transfer'}
          </p>
          ${isUPI ? `
            <p style="margin:4px 0;font-size:1.1rem;color:#065f46;"><strong>UPI ID:</strong> ${refundData.upiId}</p>
          ` : `
            <p style="margin:4px 0;font-size:0.9rem;color:#1e40af;"><strong>Account:</strong> ${refundData.bankDetails?.accountHolderName}</p>
            <p style="margin:4px 0;font-size:0.9rem;color:#1e40af;"><strong>IFSC:</strong> ${refundData.bankDetails?.ifscCode}</p>
          `}
          <p style="margin:10px 0 0;font-size:1.6rem;font-weight:900;color:${isUPI ? '#10b981' : '#3b82f6'};">
            ${isUPI ? '1–2 Business Days' : '5–7 Business Days'}
          </p>
          <p style="margin:4px 0 0;font-size:0.82rem;color:${isUPI ? '#047857' : '#1e40af'};">
            Our team will process your refund manually after verification.
          </p>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#7b2fbe,#9333ea);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View Refund Status
          </a>
        </div>
        <p style="margin-top:24px;color:#888;font-size:13px;text-align:center;">
          Questions? care@babybliss.in | Thank you for shopping with BabyBliss! 🍼
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `💰 Refund Request - ₹${order.totalPrice?.toLocaleString('en-IN')} | BabyBliss`,
    html,
  });
};

// ============================================================
// ✅ ADMIN — Return Request Notification
// ============================================================
export const sendAdminReturnNotification = async (order, customer, returnData) => {
  const isUPI = returnData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">🔄 New Return Request</h2>
      </div>
      <div style="padding:24px;background:#fff7ed;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #f97316;">
          <h3 style="margin:0 0 10px;color:#f97316;">Order Info</h3>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
          <p><strong>Phone:</strong> ${order.shippingAddress?.phone || 'N/A'}</p>
          <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod} ${order.isPaid ? '✅ PAID' : '❌ NOT PAID'}</p>
          <p><strong>Return Reason:</strong> <strong>${returnData.reason}</strong></p>
          <p><strong>Address:</strong> ${order.shippingAddress?.address}, ${order.shippingAddress?.city} - ${order.shippingAddress?.pincode}</p>
        </div>

        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid ${isUPI ? '#10b981' : '#3b82f6'};">
          <h3 style="margin:0 0 10px;color:${isUPI ? '#10b981' : '#3b82f6'};">
            ${isUPI ? '📱 UPI Refund Details' : '🏦 Bank Transfer Details'}
          </h3>
          ${isUPI ? `
            <p><strong>UPI ID:</strong> <strong style="color:#065f46;font-size:1.1rem;">${returnData.upiId}</strong></p>
            <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          ` : `
            <p><strong>Account Holder:</strong> ${returnData.bankDetails?.accountHolderName}</p>
            <p><strong>IFSC Code:</strong> ${returnData.bankDetails?.ifscCode}</p>
            ${returnData.bankDetails?.bankName ? `<p><strong>Bank:</strong> ${returnData.bankDetails.bankName}</p>` : ''}
            <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          `}
        </div>

        <div style="background:#fef2f2;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #ef4444;">
          <h4 style="margin:0 0 8px;color:#dc2626;">⚠️ Action Required</h4>
          <ol style="margin:0;padding-left:20px;color:#7f1d1d;line-height:1.8;">
            <li>Contact customer to arrange pickup</li>
            <li>Inspect returned items</li>
            <li>${isUPI ? `Transfer ₹${order.totalPrice?.toLocaleString('en-IN')} to UPI: <strong>${returnData.upiId}</strong>` : `Transfer ₹${order.totalPrice?.toLocaleString('en-IN')} via NEFT/IMPS`}</li>
            <li>Update order status in admin panel</li>
          </ol>
        </div>

        <div style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/orders/${order.id}"
             style="background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `🔄 Return: #${order.id?.slice(-8)?.toUpperCase()} - ₹${order.totalPrice?.toLocaleString('en-IN')}`,
    html,
  });
};

// ============================================================
// ✅ ADMIN — Refund Request Notification
// ============================================================
export const sendAdminRefundNotification = async (order, customer, refundData) => {
  const isUPI = refundData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#7b2fbe,#9333ea);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">💰 New Refund Request</h2>
      </div>
      <div style="padding:24px;background:#f5f3ff;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #7b2fbe;">
          <h3 style="margin:0 0 10px;color:#7b2fbe;">Order Info</h3>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
          <p><strong>Refund Amount:</strong> <strong style="color:#10b981;font-size:1.2rem;">₹${order.totalPrice?.toLocaleString('en-IN')}</strong></p>
          <p><strong>Payment:</strong> ${order.paymentMethod} ${order.isPaid ? '✅ PAID' : '❌ NOT PAID'}</p>
        </div>

        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid ${isUPI ? '#10b981' : '#3b82f6'};">
          <h3 style="margin:0 0 10px;color:${isUPI ? '#10b981' : '#3b82f6'};">
            ${isUPI ? '📱 UPI Transfer' : '🏦 Bank Transfer'}
          </h3>
          ${isUPI ? `
            <p><strong>UPI ID:</strong> <strong style="color:#065f46;font-size:1.1rem;">${refundData.upiId}</strong></p>
            <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
            <p style="color:#10b981;font-weight:700;">⚡ Process quickly for faster refund!</p>
          ` : `
            <p><strong>Account Holder:</strong> ${refundData.bankDetails?.accountHolderName}</p>
            <p><strong>IFSC:</strong> ${refundData.bankDetails?.ifscCode}</p>
            ${refundData.bankDetails?.bankName ? `<p><strong>Bank:</strong> ${refundData.bankDetails.bankName}</p>` : ''}
            <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          `}
        </div>

        <div style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/orders/${order.id}"
             style="background:linear-gradient(135deg,#7b2fbe,#9333ea);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `💰 Refund: #${order.id?.slice(-8)?.toUpperCase()} - ₹${order.totalPrice?.toLocaleString('en-IN')}`,
    html,
  });
};

// ============================================================
// ✅ ADMIN CANCEL NOTIFICATION
// ============================================================
export const sendAdminCancelNotification = async (order, customer, reason, refund = null) => {
  const refundInfo = refund?.bankDetails || {};
  const isUPI  = refund?.refundType === 'upi_transfer';
  const isBank = refund?.refundType === 'bank_transfer';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <h2 style="color:#ef4444;">❌ Order Cancelled by Customer</h2>
      <div style="background:#fef2f2;padding:20px;border-radius:8px;border-left:4px solid #ef4444;">
        <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
        <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
        <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod} ${order.isPaid ? '(PAID)' : '(NOT PAID)'}</p>
        <p><strong>Was Delivered:</strong> ${order.isDelivered ? 'Yes' : 'No'}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      ${order.isPaid && order.paymentMethod === 'Razorpay' ? `
        <div style="background:#dcfce7;padding:16px;border-radius:8px;margin-top:16px;">
          <p style="margin:0;color:#065f46;">✅ Auto instant refund initiated via Razorpay API (within 2–3 hrs)</p>
        </div>
      ` : ''}
      ${isUPI ? `
        <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin-top:16px;">
          <p><strong>UPI ID:</strong> ${refundInfo.upiId}</p>
          <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
        </div>
      ` : ''}
      ${isBank ? `
        <div style="background:#f5f3ff;padding:16px;border-radius:8px;margin-top:16px;">
          <p><strong>Account Holder:</strong> ${refundInfo.accountHolderName}</p>
          <p><strong>Account Number:</strong> ${refundInfo.accountNumber}</p>
          <p><strong>IFSC:</strong> ${refundInfo.ifscCode}</p>
          ${refundInfo.bankName ? `<p><strong>Bank:</strong> ${refundInfo.bankName}</p>` : ''}
          <p><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
        </div>
      ` : ''}
      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXTAUTH_URL}/admin/orders/${order.id}"
           style="background:#ef4444;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
          View in Admin Panel
        </a>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `❌ Cancelled: #${order.id?.slice(-8)?.toUpperCase()} - ₹${order.totalPrice?.toLocaleString('en-IN')}`,
    html,
  });
};

// ============================================================
// ✅ CONTACT EMAIL
// ============================================================
export const sendContactEmail = async ({ name, email, phone, subject, message }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <h2 style="color:#ff6b9d;">📩 New Contact Message</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;font-weight:700;color:#666;width:100px;">Name</td><td style="padding:8px;">${name}</td></tr>
        <tr><td style="padding:8px;font-weight:700;color:#666;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:8px;font-weight:700;color:#666;">Phone</td><td style="padding:8px;">${phone}</td></tr>` : ''}
        ${subject ? `<tr><td style="padding:8px;font-weight:700;color:#666;">Subject</td><td style="padding:8px;">${subject}</td></tr>` : ''}
        <tr><td style="padding:8px;font-weight:700;color:#666;vertical-align:top;">Message</td><td style="padding:8px;">${message}</td></tr>
      </table>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `📩 Contact: ${subject || name}`,
    html,
  });
};

export default transporter;