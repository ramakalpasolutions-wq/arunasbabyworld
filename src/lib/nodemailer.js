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
    from: `"Arunas Baby World" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

// ============================================================
// ✅ HELPER — Format Order Number as ABW-40001
// ============================================================
const fmtOrderNum = (order) => {
  return order?.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order?.id?.slice(-8)?.toUpperCase()}`;
};

// ============================================================
// 🎨 BRAND COLORS
// Primary:   #FF6B9D | Secondary: #7C3AED
// ============================================================

// ============================================================
// ✅ ORDER CONFIRMATION EMAIL
// ============================================================
export const sendOrderConfirmation = async (order, customerEmail, customerName) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">
      
      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">🎉</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Order Confirmed!</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">Thank you for shopping with us!</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;line-height:1.6;">Your order has been confirmed and we are getting it ready for you! 🛍️</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 14px;color:#7C3AED;font-size:16px;">📋 Order Details</h3>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Total Amount:</strong> <span style="color:#10B981;font-weight:800;font-size:16px;">₹${order.totalPrice?.toLocaleString('en-IN')}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Payment:</strong> ${order.paymentMethod || 'Razorpay'}</p>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h3 style="margin:0 0 14px;color:#7C3AED;font-size:16px;">🛒 Items Ordered</h3>
          ${order.orderItems?.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F3E8FF;">
              <span style="color:#555;font-size:14px;">${item.name} × ${item.quantity}</span>
              <span style="color:#7C3AED;font-weight:700;font-size:14px;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
            </div>
          `).join('')}
          <div style="text-align:right;margin-top:14px;font-size:17px;font-weight:800;color:#FF6B9D;">
            Total: ₹${order.totalPrice?.toLocaleString('en-IN')}
          </div>
        </div>

        <div style="background:linear-gradient(135deg,#F3E8FF,#FCE7F3);padding:16px;border-radius:10px;margin:20px 0;border:1px solid #E9D5FF;">
          <p style="margin:0;color:#7C3AED;font-weight:600;font-size:14px;">
            📦 We will notify you when your order is shipped!
          </p>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            📦 Track Your Order
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `✅ Order Confirmed - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ ORDER STATUS UPDATE
// ============================================================
export const sendOrderStatusUpdate = async (order, customerEmail, customerName) => {
  const orderNum = fmtOrderNum(order);
  const statusEmoji = {
    Confirmed:  '✅', Processing: '⚙️', Shipped: '🚚',
    Delivered:  '🎉', Cancelled: '❌',
  };
  const emoji = statusEmoji[order.orderStatus] || '📦';

  const statusMessages = {
    Confirmed:  'Your order has been confirmed and is being prepared.',
    Processing: 'Your order is being processed and packed with care.',
    Shipped:    'Your order has been shipped! It is on its way to you.',
    Delivered:  'Your order has been delivered successfully! Enjoy your purchase 🎉',
    Cancelled:  'Your order has been cancelled.',
  };

  const isDelivered = order.orderStatus === 'Delivered';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">${emoji}</div>
        <h1 style="color:white;margin:0;font-size:1.6rem;font-weight:800;">
          ${isDelivered ? 'Order Delivered!' : `Order ${order.orderStatus}!`}
        </h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">
          ${statusMessages[order.orderStatus] || 'Your order status has been updated.'}
        </p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">
          Your order <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span> is now 
          <strong style="color:#FF6B9D;">${order.orderStatus}</strong>.
        </p>

        ${order.orderStatus === 'Shipped' && order.trackingNumber ? `
          <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border:2px solid #7C3AED;text-align:center;box-shadow:0 2px 8px rgba(124,58,237,0.10);">
            <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#7C3AED;text-transform:uppercase;letter-spacing:0.8px;">
              🚚 Tracking Number
            </p>
            <p style="margin:0;font-family:monospace;font-weight:900;color:#FF6B9D;font-size:1.3rem;">
              ${order.trackingNumber}
            </p>
            <p style="margin:10px 0 0;font-size:12px;color:#888;">
              Use this number on the courier's website to track your delivery
            </p>
          </div>
        ` : ''}

        ${isDelivered ? `
          <div style="background:white;padding:24px;border-radius:12px;margin:20px 0;border:2px solid #FF6B9D;text-align:center;box-shadow:0 2px 12px rgba(255,107,157,0.12);">
            <div style="font-size:3rem;margin-bottom:10px;">🎉</div>
            <h2 style="margin:0;color:#7C3AED;font-size:1.3rem;font-weight:800;">Delivered Successfully!</h2>
            <p style="margin:10px 0 0;color:#FF6B9D;font-weight:700;">
              ${order.deliveredAt
                ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`
                : 'Your package has reached you!'}
            </p>
            <p style="margin:14px 0 0;font-size:13px;color:#888;">Hope you love your purchase! 💖</p>
          </div>

          <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
            <h4 style="margin:0 0 8px;color:#7C3AED;">📋 Not Happy with Your Order?</h4>
            <p style="margin:0;color:#555;font-size:13px;line-height:1.8;">
              You can <strong>return</strong> or <strong>request a refund</strong> within 7 days.<br/>
              <strong>Exchange window:</strong> 3 days after delivery.<br/>
              Visit your order page to raise a request.
            </p>
          </div>

          <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
            <h3 style="margin:0 0 14px;color:#7C3AED;">📦 Items Delivered</h3>
            ${order.orderItems?.map(item => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F3E8FF;">
                <span style="color:#555;font-size:14px;">${item.name} × ${item.quantity}</span>
                <span style="color:#7C3AED;font-weight:700;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${order.orderStatus === 'Cancelled' ? `
          <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
            <p style="margin:0;color:#FF6B9D;font-weight:700;">
              ❌ Your order has been cancelled. If you have any questions, please contact our support.
            </p>
          </div>
        ` : ''}

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            ${isDelivered ? '🎉 View Delivered Order' : '📦 View Order Details'}
          </a>
        </div>

        ${isDelivered ? `
          <div style="text-align:center;margin-top:14px;">
            <a href="${process.env.NEXTAUTH_URL}/products"
               style="display:inline-block;color:#7C3AED;text-decoration:none;font-weight:700;font-size:14px;border:2px solid #7C3AED;padding:10px 24px;border-radius:10px;">
              🛍️ Continue Shopping
            </a>
          </div>
        ` : ''}

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `${emoji} Order ${order.orderStatus} - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ ORDER CANCELLED EMAIL
// ============================================================
export const sendOrderCancelled = async (order, customerEmail, customerName, reason) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">
      
      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">❌</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Order Cancelled</h1>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">Your order has been cancelled. We're sorry to see it go!</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">📋 Order Details</h3>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Amount:</strong> <span style="color:#10B981;font-weight:800;">₹${order.totalPrice?.toLocaleString('en-IN')}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Payment:</strong> ${order.paymentMethod}</p>
          ${reason ? `<p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Reason:</strong> ${reason}</p>` : ''}
        </div>

        ${order.isPaid && order.paymentMethod === 'Razorpay' ? `
          <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
            <p style="margin:0;color:#7C3AED;font-weight:700;">
              ⚡ <strong>Auto Refund Initiated!</strong><br/>
              <span style="color:#555;font-weight:400;">₹${order.totalPrice?.toLocaleString('en-IN')} refund has been automatically initiated.</span><br/>
              <strong>Expected: Within 2–3 hours</strong> (Instant refund via Razorpay)
            </p>
          </div>
        ` : ''}

        ${order.paymentMethod === 'COD' && !order.isDelivered ? `
          <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
            <p style="margin:0;color:#7C3AED;font-weight:700;">✅ No refund needed — COD order not yet paid.</p>
          </div>
        ` : ''}

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/products"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            🛍️ Continue Shopping
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `❌ Order Cancelled - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ REFUND PROCESSED EMAIL
// ============================================================
export const sendRefundProcessed = async (order, refund, customerEmail, customerName, refundSpeed = 'optimum') => {
  const orderNum = fmtOrderNum(order);
  const isInstant = refundSpeed === 'optimum';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">${isInstant ? '⚡' : '💰'}</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">
          ${isInstant ? 'Instant Refund Initiated!' : 'Refund Initiated!'}
        </h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">
          ${isInstant ? 'Your money is on its way!' : 'Refund has been processed'}
        </p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">
          ${isInstant
            ? 'Great news! Your refund has been <strong>instantly initiated</strong> via Razorpay.'
            : 'Your refund has been successfully processed.'}
        </p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">💳 Refund Details</h3>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Refund Amount:</strong>
            <span style="color:#10B981;font-size:1.4rem;font-weight:900;"> ₹${(refund.amount || order.totalPrice)?.toLocaleString('en-IN')}</span>
          </p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Refund ID:</strong> <code style="background:#F3E8FF;padding:2px 6px;border-radius:4px;color:#7C3AED;">${refund.razorpayRefundId || refund.id || 'Processing'}</code></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Initiated On:</strong> ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Refund To:</strong> 💳 Original Payment Method</p>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border:2px solid #7C3AED;text-align:center;box-shadow:0 2px 8px rgba(124,58,237,0.10);">
          <p style="margin:0;font-size:13px;font-weight:800;color:#7C3AED;text-transform:uppercase;letter-spacing:0.6px;">
            ${isInstant ? '⚡ Expected Refund Time' : '⏱️ Expected Refund Time'}
          </p>
          <p style="margin:10px 0;font-size:2rem;font-weight:900;color:#FF6B9D;">
            ${isInstant ? 'Within 2–3 Hours' : '5–7 Business Days'}
          </p>
          <p style="margin:0;font-size:13px;color:#888;">
            ${isInstant
              ? 'The refund will appear in your bank account, UPI, or card statement shortly.'
              : 'The refund will be credited to your original payment method.'}
          </p>
        </div>

        <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h4 style="margin:0 0 10px;color:#7C3AED;">📋 What to Check</h4>
          <ul style="margin:0;padding-left:20px;color:#555;line-height:1.9;font-size:14px;">
            <li>Check your <strong>bank account / UPI app</strong> for the credit</li>
            <li>Check your <strong>card statement</strong> if paid by card</li>
            <li>Reference: <code style="background:#F3E8FF;padding:2px 6px;border-radius:4px;color:#7C3AED;">${refund.razorpayRefundId || refund.id || 'Processing'}</code></li>
          </ul>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            View Order & Refund Status
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `⚡ Refund of ₹${(refund.amount || order.totalPrice)?.toLocaleString('en-IN')} Initiated - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ REFUND COMPLETED EMAIL
// ============================================================
export const sendRefundCompleted = async (order, refund, customerEmail, customerName) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">✅</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Refund Completed!</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">Money has been credited to your account</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">
          Great news! Your refund of 
          <strong style="color:#10B981;">₹${(refund.amount || order.totalPrice)?.toLocaleString('en-IN')}</strong> 
          has been completed successfully.
        </p>

        <div style="background:white;padding:24px;border-radius:12px;margin:20px 0;border:2px solid #FF6B9D;text-align:center;box-shadow:0 2px 12px rgba(255,107,157,0.12);">
          <p style="margin:0;font-size:12px;font-weight:800;color:#7C3AED;text-transform:uppercase;letter-spacing:0.8px;">✅ Refund Amount</p>
          <p style="margin:10px 0;font-size:3rem;font-weight:900;color:#FF6B9D;">
            ₹${(refund.amount || order.totalPrice)?.toLocaleString('en-IN')}
          </p>
          <p style="margin:0;font-size:14px;color:#7C3AED;font-weight:700;">Credited to your account</p>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">📋 Refund Information</h3>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          ${refund.razorpayRefundId ? `<p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Refund ID:</strong> <code style="background:#F3E8FF;padding:2px 6px;border-radius:4px;color:#7C3AED;">${refund.razorpayRefundId}</code></p>` : ''}
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Completed On:</strong> ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>

        <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h4 style="margin:0 0 10px;color:#FF6B9D;">💡 Check Your Account</h4>
          <ul style="margin:0;padding-left:20px;color:#555;line-height:1.9;font-size:13px;">
            <li>Check your <strong>bank statement</strong> for the credit</li>
            <li>Check your <strong>UPI app history</strong></li>
            <li>If not received within 2–3 hours, contact our support</li>
          </ul>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            View Order
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `✅ Refund Completed ₹${(refund.amount || order.totalPrice)?.toLocaleString('en-IN')} - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ RETURN REQUEST CONFIRMATION — Customer
// ============================================================
export const sendReturnRequestConfirmation = async (order, customerEmail, customerName, returnData) => {
  const orderNum = fmtOrderNum(order);
  const isUPI = returnData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">🔄</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Return Request Received</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">We've got your return request!</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">We have received your return request. Our team will contact you within <strong>24–48 hours</strong>.</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">📋 Return Details</h3>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Return Reason:</strong> ${returnData.reason}</p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Refund Amount:</strong>
            <span style="color:#10B981;font-weight:800;font-size:16px;"> ₹${order.totalPrice?.toLocaleString('en-IN')}</span>
          </p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Status:</strong>
            <span style="background:#F3E8FF;color:#7C3AED;padding:3px 12px;border-radius:20px;font-weight:700;font-size:13px;">🟡 Under Review</span>
          </p>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">${isUPI ? '📱 UPI Refund' : '🏦 Bank Refund'}</h3>
          ${isUPI ? `
            <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">UPI ID:</strong> ${returnData.upiId}</p>
            <p style="margin:8px 0 0;color:#7C3AED;font-weight:700;">⚡ Refund within <strong>1–2 business days</strong> after item pickup</p>
          ` : `
            <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Account Holder:</strong> ${returnData.bankDetails?.accountHolderName || ''}</p>
            <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">IFSC Code:</strong> ${returnData.bankDetails?.ifscCode || ''}</p>
            ${returnData.bankDetails?.bankName ? `<p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Bank:</strong> ${returnData.bankDetails.bankName}</p>` : ''}
            <p style="margin:8px 0 0;color:#7C3AED;font-weight:700;">🏦 Refund within <strong>5–7 business days</strong> after item pickup</p>
          `}
        </div>

        <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h4 style="margin:0 0 10px;color:#FF6B9D;">📋 Return Process</h4>
          <ol style="margin:0;padding-left:20px;color:#555;line-height:1.9;font-size:14px;">
            <li>Team contacts you within <strong>24–48 hours</strong></li>
            <li>Pickup arranged at your delivery address</li>
            <li>Item quality check completed</li>
            <li>Refund processed after inspection</li>
          </ol>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">📦 Items Being Returned</h3>
          ${order.orderItems?.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F3E8FF;">
              <span style="color:#555;font-size:14px;">${item.name} × ${item.quantity}</span>
              <span style="color:#7C3AED;font-weight:700;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
            </div>
          `).join('')}
          <div style="text-align:right;margin-top:14px;font-size:16px;font-weight:800;color:#FF6B9D;">
            Refund: ₹${order.totalPrice?.toLocaleString('en-IN')}
          </div>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            View Return Status
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `🔄 Return Request - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ REFUND REQUEST CONFIRMATION — Customer (COD manual)
// ============================================================
export const sendRefundRequestConfirmation = async (order, customerEmail, customerName, refundData) => {
  const orderNum = fmtOrderNum(order);
  const isUPI = refundData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">💰</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Refund Request Received</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">Your refund is being processed!</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">We have received your refund request and our team will process it shortly.</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">💳 Refund Details</h3>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Refund Amount:</strong>
            <span style="color:#10B981;font-weight:900;font-size:1.2rem;"> ₹${order.totalPrice?.toLocaleString('en-IN')}</span>
          </p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Date:</strong> ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border:2px solid #7C3AED;text-align:center;box-shadow:0 2px 8px rgba(124,58,237,0.10);">
          <p style="margin:0;font-size:14px;font-weight:800;color:#7C3AED;">
            ${isUPI ? '📱 Refund via UPI' : '🏦 Refund via Bank Transfer'}
          </p>
          ${isUPI ? `
            <p style="margin:8px 0;font-size:1.1rem;color:#4B0082;font-weight:700;">${refundData.upiId}</p>
          ` : `
            <p style="margin:6px 0;color:#555;font-size:14px;">${refundData.bankDetails?.accountHolderName}</p>
            <p style="margin:4px 0;color:#555;font-size:14px;">IFSC: ${refundData.bankDetails?.ifscCode}</p>
          `}
          <p style="margin:12px 0 0;font-size:1.6rem;font-weight:900;color:#FF6B9D;">
            ${isUPI ? '1–2 Business Days' : '5–7 Business Days'}
          </p>
          <p style="margin:6px 0 0;font-size:12px;color:#888;">
            Our team will process your refund manually after verification.
          </p>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            View Refund Status
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `💰 Refund Request ₹${order.totalPrice?.toLocaleString('en-IN')} - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ ADMIN — Return Request Notification
// ============================================================
export const sendAdminReturnNotification = async (order, customer, returnData) => {
  const orderNum = fmtOrderNum(order);
  const isUPI = returnData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">🔄 New Return Request</h2>
      </div>
      <div style="padding:24px;background:#FDF2F8;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B9D;">
          <h3 style="margin:0 0 10px;color:#7C3AED;">Order Info</h3>
          <p style="margin:6px 0;color:#555;"><strong>Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
          <p style="margin:6px 0;color:#555;"><strong>Phone:</strong> ${order.shippingAddress?.phone || 'N/A'}</p>
          <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> <span style="color:#10B981;font-weight:800;">₹${order.totalPrice?.toLocaleString('en-IN')}</span></p>
          <p style="margin:6px 0;color:#555;"><strong>Payment:</strong> ${order.paymentMethod} ${order.isPaid ? '✅ PAID' : '❌ NOT PAID'}</p>
          <p style="margin:6px 0;color:#555;"><strong>Return Reason:</strong> <strong style="color:#FF6B9D;">${returnData.reason}</strong></p>
          <p style="margin:6px 0;color:#555;"><strong>Address:</strong> ${order.shippingAddress?.address}, ${order.shippingAddress?.city} - ${order.shippingAddress?.pincode}</p>
        </div>

        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #7C3AED;">
          <h3 style="margin:0 0 10px;color:#7C3AED;">${isUPI ? '📱 UPI Refund Details' : '🏦 Bank Transfer Details'}</h3>
          ${isUPI ? `
            <p style="margin:6px 0;color:#555;"><strong>UPI ID:</strong> <strong style="color:#7C3AED;">${returnData.upiId}</strong></p>
            <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          ` : `
            <p style="margin:6px 0;color:#555;"><strong>Account Holder:</strong> ${returnData.bankDetails?.accountHolderName}</p>
            <p style="margin:6px 0;color:#555;"><strong>IFSC Code:</strong> ${returnData.bankDetails?.ifscCode}</p>
            ${returnData.bankDetails?.bankName ? `<p style="margin:6px 0;color:#555;"><strong>Bank:</strong> ${returnData.bankDetails.bankName}</p>` : ''}
            <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          `}
        </div>

        <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B9D;">
          <h4 style="margin:0 0 8px;color:#FF6B9D;">⚠️ Action Required</h4>
          <ol style="margin:0;padding-left:20px;color:#555;line-height:1.9;">
            <li>Contact customer to arrange pickup</li>
            <li>Inspect returned items</li>
            <li>${isUPI ? `Transfer ₹${order.totalPrice?.toLocaleString('en-IN')} to UPI: <strong>${returnData.upiId}</strong>` : `Transfer ₹${order.totalPrice?.toLocaleString('en-IN')} via NEFT/IMPS`}</li>
            <li>Update order status in admin panel</li>
          </ol>
        </div>

        <div style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `🔄 Return: ${orderNum} - ₹${order.totalPrice?.toLocaleString('en-IN')}`,
    html,
  });
};

// ============================================================
// ✅ ADMIN — Refund Request Notification
// ============================================================
export const sendAdminRefundNotification = async (order, customer, refundData) => {
  const orderNum = fmtOrderNum(order);
  const isUPI = refundData.refundMethod === 'upi';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">💰 New Refund Request</h2>
      </div>
      <div style="padding:24px;background:#FDF2F8;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B9D;">
          <h3 style="margin:0 0 10px;color:#7C3AED;">Order Info</h3>
          <p style="margin:6px 0;color:#555;"><strong>Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
          <p style="margin:6px 0;color:#555;"><strong>Refund Amount:</strong> <strong style="color:#10B981;font-size:1.2rem;">₹${order.totalPrice?.toLocaleString('en-IN')}</strong></p>
          <p style="margin:6px 0;color:#555;"><strong>Payment:</strong> ${order.paymentMethod} ${order.isPaid ? '✅ PAID' : '❌ NOT PAID'}</p>
        </div>

        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #7C3AED;">
          <h3 style="margin:0 0 10px;color:#7C3AED;">${isUPI ? '📱 UPI Transfer' : '🏦 Bank Transfer'}</h3>
          ${isUPI ? `
            <p style="margin:6px 0;color:#555;"><strong>UPI ID:</strong> <strong style="color:#7C3AED;">${refundData.upiId}</strong></p>
            <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
            <p style="margin:8px 0 0;color:#FF6B9D;font-weight:700;">⚡ Process quickly for faster refund!</p>
          ` : `
            <p style="margin:6px 0;color:#555;"><strong>Account Holder:</strong> ${refundData.bankDetails?.accountHolderName}</p>
            <p style="margin:6px 0;color:#555;"><strong>IFSC:</strong> ${refundData.bankDetails?.ifscCode}</p>
            ${refundData.bankDetails?.bankName ? `<p style="margin:6px 0;color:#555;"><strong>Bank:</strong> ${refundData.bankDetails.bankName}</p>` : ''}
            <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          `}
        </div>

        <div style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `💰 Refund: ${orderNum} - ₹${order.totalPrice?.toLocaleString('en-IN')}`,
    html,
  });
};

// ============================================================
// ✅ ADMIN CANCEL NOTIFICATION
// ============================================================
export const sendAdminCancelNotification = async (order, customer, reason, refund = null) => {
  const orderNum = fmtOrderNum(order);
  const refundInfo = refund?.bankDetails || {};
  const isUPI  = refund?.refundType === 'upi_transfer';
  const isBank = refund?.refundType === 'bank_transfer';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">❌ Order Cancelled by Customer</h2>
      </div>
      <div style="padding:24px;background:#FDF2F8;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B9D;">
          <p style="margin:6px 0;color:#555;"><strong>Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
          <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> <span style="color:#10B981;font-weight:800;">₹${order.totalPrice?.toLocaleString('en-IN')}</span></p>
          <p style="margin:6px 0;color:#555;"><strong>Payment:</strong> ${order.paymentMethod} ${order.isPaid ? '(PAID)' : '(NOT PAID)'}</p>
          <p style="margin:6px 0;color:#555;"><strong>Was Delivered:</strong> ${order.isDelivered ? 'Yes' : 'No'}</p>
          ${reason ? `<p style="margin:6px 0;color:#555;"><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>

        ${order.isPaid && order.paymentMethod === 'Razorpay' ? `
          <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #7C3AED;">
            <p style="margin:0;color:#7C3AED;font-weight:700;">✅ Auto instant refund initiated via Razorpay API (within 2–3 hrs)</p>
          </div>
        ` : ''}

        ${isUPI ? `
          <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B9D;">
            <p style="margin:6px 0;color:#555;"><strong>UPI ID:</strong> <strong style="color:#7C3AED;">${refundInfo.upiId}</strong></p>
            <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          </div>
        ` : ''}

        ${isBank ? `
          <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #7C3AED;">
            <p style="margin:6px 0;color:#555;"><strong>Account Holder:</strong> ${refundInfo.accountHolderName}</p>
            <p style="margin:6px 0;color:#555;"><strong>Account Number:</strong> ${refundInfo.accountNumber}</p>
            <p style="margin:6px 0;color:#555;"><strong>IFSC:</strong> ${refundInfo.ifscCode}</p>
            ${refundInfo.bankName ? `<p style="margin:6px 0;color:#555;"><strong>Bank:</strong> ${refundInfo.bankName}</p>` : ''}
            <p style="margin:6px 0;color:#555;"><strong>Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          </div>
        ` : ''}

        <div style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/orders/${order.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `❌ Cancelled: ${orderNum} - ₹${order.totalPrice?.toLocaleString('en-IN')}`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE REQUEST CONFIRMATION — Customer
// ============================================================
export const sendExchangeRequestConfirmation = async (exchange, order, customerEmail, customerName, paymentLinkUrl = null) => {
  const orderNum = fmtOrderNum(order);
  const priceDiff = exchange.priceDifference;
  const needsPay  = priceDiff > 0;
  const samePrice = priceDiff === 0;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">🔄</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Exchange Request Received!</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">We're processing your exchange</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">Your exchange request has been received. Here are the details:</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 16px;color:#7C3AED;">🔄 Exchange Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:45%;padding:12px;background:#FEF2F2;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#FF6B9D;text-transform:uppercase;">↩️ Returning</p>
                <img src="${exchange.oldProductImage || 'https://via.placeholder.com/60'}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin:6px 0;"/>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#4B0082;">${exchange.oldProductName}</p>
                <p style="margin:0;font-size:15px;font-weight:900;color:#FF6B9D;">₹${exchange.oldPrice?.toLocaleString('en-IN')}</p>
              </td>
              <td style="width:10%;text-align:center;font-size:24px;color:#7C3AED;">→</td>
              <td style="width:45%;padding:12px;background:#F3E8FF;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#7C3AED;text-transform:uppercase;">📦 Getting</p>
                <img src="${exchange.newProductImage || 'https://via.placeholder.com/60'}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin:6px 0;"/>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#4B0082;">${exchange.newProductName}</p>
                <p style="margin:0;font-size:15px;font-weight:900;color:#7C3AED;">₹${exchange.newPrice?.toLocaleString('en-IN')}</p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 6px;color:#555;"><strong style="color:#4B0082;">Reason:</strong> ${exchange.reason}</p>
          <p style="margin:0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border:2px solid ${samePrice ? '#7C3AED' : '#FF6B9D'};text-align:center;box-shadow:0 2px 8px rgba(124,58,237,0.10);">
          <p style="margin:0;font-size:13px;font-weight:800;color:#7C3AED;text-transform:uppercase;letter-spacing:0.6px;">
            ${samePrice ? '✅ Free Exchange' : needsPay ? '💰 Price Difference to Pay' : '💸 Refund Coming'}
          </p>
          <p style="margin:10px 0;font-size:2rem;font-weight:900;color:#FF6B9D;">
            ${samePrice ? 'No payment needed' : needsPay ? `+ ₹${priceDiff.toLocaleString('en-IN')}` : `− ₹${Math.abs(priceDiff).toLocaleString('en-IN')}`}
          </p>
          <p style="margin:0;font-size:13px;color:#888;">
            ${samePrice
              ? 'We will swap your product after pickup & verification.'
              : needsPay
                ? 'Please complete payment below to proceed with exchange.'
                : 'We will auto-refund the difference to your original payment method.'}
          </p>
        </div>

        ${needsPay && paymentLinkUrl ? `
          <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border:2px solid #FF6B9D;text-align:center;box-shadow:0 2px 8px rgba(255,107,157,0.12);">
            <p style="margin:0 0 12px;font-size:14px;font-weight:800;color:#7C3AED;">💳 Complete Payment to Continue</p>
            <a href="${paymentLinkUrl}"
               style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">
              Pay ₹${priceDiff.toLocaleString('en-IN')} Now →
            </a>
            <p style="margin:10px 0 0;font-size:12px;color:#888;">Secure payment via Razorpay</p>
          </div>
        ` : ''}

        <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h4 style="margin:0 0 10px;color:#7C3AED;">📋 Exchange Process</h4>
          <ol style="margin:0;padding-left:20px;color:#555;line-height:1.9;font-size:14px;">
            <li>Admin reviews your request (within 24 hours)</li>
            <li>${needsPay ? 'Complete payment using link above' : 'Pickup arranged at your delivery address'}</li>
            <li>Returned item verified at our warehouse</li>
            <li>New product packed and shipped to you</li>
            <li>Track your new product with tracking number</li>
          </ol>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/exchanges"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Track My Exchanges
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `🔄 Exchange Request - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ ADMIN — Exchange Notification
// ============================================================
export const sendAdminExchangeNotification = async (exchange, order, customer) => {
  const orderNum = fmtOrderNum(order);
  const priceDiff = exchange.priceDifference;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">🔄 New Exchange Request</h2>
      </div>
      <div style="padding:24px;background:#FDF2F8;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B9D;">
          <h3 style="margin:0 0 10px;color:#7C3AED;">Customer Info</h3>
          <p style="margin:6px 0;color:#555;"><strong>Name:</strong> ${customer.name}</p>
          <p style="margin:6px 0;color:#555;"><strong>Email:</strong> ${customer.email}</p>
          <p style="margin:6px 0;color:#555;"><strong>Phone:</strong> ${order.shippingAddress?.phone || 'N/A'}</p>
          <p style="margin:6px 0;color:#555;"><strong>Order:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong>Reason:</strong> <strong style="color:#FF6B9D;">${exchange.reason}</strong></p>
          ${exchange.description ? `<p style="margin:6px 0;color:#555;"><strong>Details:</strong> ${exchange.description}</p>` : ''}
        </div>

        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;">
          <h3 style="margin:0 0 14px;color:#7C3AED;">Product Exchange</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:45%;padding:12px;background:#FEF2F2;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#FF6B9D;">↩️ RETURNING</p>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#4B0082;">${exchange.oldProductName}</p>
                <p style="margin:0;font-weight:900;color:#FF6B9D;">₹${exchange.oldPrice?.toLocaleString('en-IN')}</p>
              </td>
              <td style="width:10%;text-align:center;font-size:24px;">→</td>
              <td style="width:45%;padding:12px;background:#F3E8FF;border-radius:8px;text-align:center;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#7C3AED;">📦 GIVING</p>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#4B0082;">${exchange.newProductName}</p>
                <p style="margin:0;font-weight:900;color:#7C3AED;">₹${exchange.newPrice?.toLocaleString('en-IN')}</p>
              </td>
            </tr>
          </table>
          ${priceDiff !== 0 ? `
            <div style="margin-top:14px;padding:10px;background:#FDF2F8;border-radius:8px;text-align:center;border:1px solid #E9D5FF;">
              <strong style="color:${priceDiff > 0 ? '#FF6B9D' : '#7C3AED'};">
                ${priceDiff > 0 ? '💰 Customer pays' : '💸 Refund to customer'}: ₹${Math.abs(priceDiff).toLocaleString('en-IN')}
              </strong>
            </div>
          ` : '<p style="margin-top:14px;text-align:center;color:#7C3AED;font-weight:800;">✅ Same price — Free Exchange</p>'}
        </div>

        <div style="background:white;padding:18px;border-radius:8px;margin-bottom:16px;border-left:4px solid #7C3AED;">
          <h4 style="margin:0 0 10px;color:#7C3AED;">📍 Pickup Address</h4>
          <p style="margin:0;line-height:1.8;color:#555;">
            <strong>${order.shippingAddress?.name}</strong><br/>
            📞 ${order.shippingAddress?.phone}<br/>
            ${order.shippingAddress?.address}<br/>
            ${order.shippingAddress?.city}, ${order.shippingAddress?.state} — ${order.shippingAddress?.pincode}
          </p>
        </div>

        <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #FF6B9D;">
          <h4 style="margin:0 0 8px;color:#FF6B9D;">⚠️ Action Required</h4>
          <ol style="margin:0;padding-left:20px;color:#555;line-height:1.9;">
            <li>Review exchange request in admin panel</li>
            <li>Approve or reject the request</li>
            <li>Arrange courier pickup if approved</li>
            <li>Verify returned product condition</li>
            <li>Ship new product after verification</li>
          </ol>
        </div>

        <div style="text-align:center;">
          <a href="${process.env.NEXTAUTH_URL}/admin/exchanges/${exchange.id}"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `🔄 Exchange: ${orderNum} - ${exchange.oldProductName}`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE APPROVED — Customer
// ============================================================
export const sendExchangeApproved = async (exchange, order, customerEmail, customerName) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">✅</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Exchange Approved!</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">Your exchange is moving forward</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">Great news! Your exchange request for order <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span> has been <strong style="color:#7C3AED;">approved</strong>.</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h3 style="margin:0 0 12px;color:#7C3AED;">📋 What's Next?</h3>
          <ol style="margin:10px 0 0;padding-left:20px;line-height:2;color:#555;font-size:14px;">
            <li><strong style="color:#FF6B9D;">📦 Pickup Scheduled</strong> — Our courier will pick up the product within 2–3 business days</li>
            <li><strong style="color:#FF6B9D;">🔍 Verification</strong> — Product will be inspected at our warehouse</li>
            <li><strong style="color:#FF6B9D;">🚚 New Product Shipped</strong> — Once verified, we'll ship your replacement</li>
            <li><strong style="color:#FF6B9D;">🎉 Delivered</strong> — Track delivery with shipment tracking number</li>
          </ol>
        </div>

        <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <p style="margin:0;color:#7C3AED;font-weight:600;font-size:14px;">
            📞 Please ensure someone is available at the delivery address for pickup.
          </p>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/exchanges"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Track Exchange Status
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `✅ Exchange Approved - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE PICKED UP — Customer
// ============================================================
export const sendExchangePickedUp = async (exchange, order, customerEmail, customerName) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">📦</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Product Picked Up!</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">Your item is on the way to our warehouse</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">We've successfully picked up your <strong>${exchange.oldProductName}</strong> for exchange (Order <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span>).</p>

        ${exchange.pickupTracking ? `
          <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border:2px solid #7C3AED;text-align:center;box-shadow:0 2px 8px rgba(124,58,237,0.10);">
            <p style="margin:0;font-size:12px;font-weight:800;color:#7C3AED;text-transform:uppercase;letter-spacing:0.8px;">📦 Pickup Tracking</p>
            <p style="margin:10px 0;font-size:1.3rem;font-weight:900;color:#FF6B9D;font-family:monospace;">${exchange.pickupTracking}</p>
          </div>
        ` : ''}

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h3 style="margin:0 0 12px;color:#7C3AED;">📋 What Happens Next?</h3>
          <ol style="margin:10px 0 0;padding-left:20px;line-height:2;color:#555;font-size:14px;">
            <li>📬 Package arrives at warehouse</li>
            <li>🔍 Quality verification by team</li>
            <li>🚚 New product shipped to you</li>
          </ol>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/exchanges"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Track Exchange
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `📦 Product Picked Up - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE SHIPPED — Customer
// ============================================================
export const sendExchangeShipped = async (exchange, order, customerEmail, customerName) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">🚚</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">New Product Shipped!</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">Your replacement is on the way</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">Your exchange for order <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span> is almost complete! We've shipped your new product.</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">📦 New Product</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:80px;padding-right:14px;vertical-align:top;">
                <img src="${exchange.newProductImage || 'https://via.placeholder.com/70'}" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:10px;"/>
              </td>
              <td>
                <p style="margin:0 0 6px;font-weight:800;color:#4B0082;">${exchange.newProductName}</p>
                <p style="margin:0;color:#FF6B9D;font-weight:900;font-size:18px;">₹${exchange.newPrice?.toLocaleString('en-IN')}</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border:2px solid #7C3AED;text-align:center;box-shadow:0 2px 8px rgba(124,58,237,0.10);">
          <p style="margin:0;font-size:12px;font-weight:800;color:#7C3AED;text-transform:uppercase;letter-spacing:0.8px;">🚚 Tracking Number</p>
          <p style="margin:10px 0;font-size:1.4rem;font-weight:900;color:#FF6B9D;font-family:monospace;">${exchange.shipmentTracking}</p>
          <p style="margin:0;font-size:12px;color:#888;">Use this tracking number on the courier's website to track delivery</p>
        </div>

        <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <p style="margin:0;color:#7C3AED;font-weight:600;font-size:14px;">
            🎉 Your exchange is almost complete! Expected delivery in 3–5 business days.
          </p>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/exchanges"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            View Exchange Details
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `🚚 Exchange Shipped - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE COMPLETED — Customer
// ============================================================
export const sendExchangeCompleted = async (exchange, order, customerEmail, customerName) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3.5rem;margin-bottom:10px;">🎉</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Exchange Completed!</h1>
        <p style="color:#FCE7F3;margin:10px 0 0;font-size:15px;">Your exchange has been successfully completed</p>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">🎉 Your exchange for order <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span> has been <strong style="color:#7C3AED;">completed successfully</strong>.</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 14px;color:#7C3AED;">📋 Exchange Summary</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:45%;padding:12px;background:#FEF2F2;border-radius:8px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#FF6B9D;">↩️ RETURNED</p>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#4B0082;">${exchange.oldProductName}</p>
                <p style="margin:0;font-weight:900;color:#FF6B9D;">₹${exchange.oldPrice?.toLocaleString('en-IN')}</p>
              </td>
              <td style="width:10%;text-align:center;font-size:24px;color:#7C3AED;">→</td>
              <td style="width:45%;padding:12px;background:#F3E8FF;border-radius:8px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#7C3AED;">✅ RECEIVED</p>
                <p style="margin:6px 0 4px;font-size:13px;font-weight:700;color:#4B0082;">${exchange.newProductName}</p>
                <p style="margin:0;font-weight:900;color:#7C3AED;">₹${exchange.newPrice?.toLocaleString('en-IN')}</p>
              </td>
            </tr>
          </table>
        </div>

        ${exchange.priceDifference < 0 && exchange.razorpayRefundId ? `
          <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
            <p style="margin:0;color:#7C3AED;font-weight:700;">
              ✅ ₹${Math.abs(exchange.priceDifference)?.toLocaleString('en-IN')} refunded to your original payment method
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:#888;font-family:monospace;">Ref: ${exchange.razorpayRefundId}</p>
          </div>
        ` : ''}

        <div style="background:white;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #FF6B9D;text-align:center;box-shadow:0 2px 12px rgba(255,107,157,0.12);">
          <div style="font-size:2.5rem;margin-bottom:8px;">💖</div>
          <p style="margin:0;color:#7C3AED;font-weight:800;font-size:1.1rem;">Hope you love your new product!</p>
          <p style="margin:8px 0 0;font-size:13px;color:#888;">
            Completed on ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="${process.env.NEXTAUTH_URL}/products"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            🛍️ Continue Shopping
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `🎉 Exchange Completed - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ EXCHANGE REJECTED — Customer
// ============================================================
export const sendExchangeRejected = async (exchange, order, customerEmail, customerName, rejectionReason) => {
  const orderNum = fmtOrderNum(order);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:36px 30px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">❌</div>
        <h1 style="color:white;margin:0;font-size:1.7rem;font-weight:800;">Exchange Request Rejected</h1>
      </div>

      <div style="padding:30px;background:#FDF2F8;">
        <p style="color:#4B0082;font-size:15px;">Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p style="color:#555;font-size:14px;">We're sorry to inform you that your exchange request for order <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span> has been rejected.</p>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;border-left:4px solid #FF6B9D;box-shadow:0 2px 8px rgba(255,107,157,0.08);">
          <h3 style="margin:0 0 12px;color:#7C3AED;">❌ Rejection Reason</h3>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            ${rejectionReason || 'Unable to process exchange at this time.'}
          </p>
        </div>

        <div style="background:white;padding:20px;border-radius:10px;margin:20px 0;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <h3 style="margin:0 0 12px;color:#7C3AED;">📋 Exchange Details</h3>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Order ID:</strong> <span style="font-family:monospace;background:#F3E8FF;color:#7C3AED;padding:3px 10px;border-radius:6px;font-weight:800;">${orderNum}</span></p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Product:</strong> ${exchange.oldProductName}</p>
          <p style="margin:6px 0;color:#555;"><strong style="color:#4B0082;">Reason for Exchange:</strong> ${exchange.reason}</p>
        </div>

        <div style="background:white;padding:16px;border-radius:10px;margin:20px 0;border-left:4px solid #7C3AED;box-shadow:0 2px 8px rgba(124,58,237,0.06);">
          <p style="margin:0;color:#7C3AED;font-weight:600;font-size:14px;">
            💡 You can contact our support team for further assistance or request a refund instead.
          </p>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="mailto:care@arunasbabyworld.in"
             style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            📧 Contact Support
          </a>
        </div>

        <p style="margin-top:28px;color:#999;font-size:13px;text-align:center;border-top:1px solid #F3E8FF;padding-top:20px;">
          Thank you for shopping with <strong style="color:#FF6B9D;">Arunas Baby World</strong>! 🍼<br/>
          Need help? <a href="mailto:care@arunasbabyworld.in" style="color:#7C3AED;">care@arunasbabyworld.in</a>
        </p>
      </div>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject: `❌ Exchange Rejected - ${orderNum} | Arunas Baby World`,
    html,
  });
};

// ============================================================
// ✅ CONTACT EMAIL (no order — unchanged)
// ============================================================
export const sendContactEmail = async ({ name, email, phone, subject, message }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <div style="background:linear-gradient(135deg,#FF6B9D,#7C3AED);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">📩 New Contact Message</h2>
      </div>
      <div style="padding:24px;background:#FDF2F8;border-radius:0 0 10px 10px;">
        <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #FF6B9D;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 8px 8px 0;font-weight:700;color:#7C3AED;width:80px;">Name</td><td style="padding:8px;color:#555;">${name}</td></tr>
            <tr><td style="padding:8px 8px 8px 0;font-weight:700;color:#7C3AED;">Email</td><td style="padding:8px;"><a href="mailto:${email}" style="color:#FF6B9D;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px 8px 8px 0;font-weight:700;color:#7C3AED;">Phone</td><td style="padding:8px;color:#555;">${phone}</td></tr>` : ''}
            ${subject ? `<tr><td style="padding:8px 8px 8px 0;font-weight:700;color:#7C3AED;">Subject</td><td style="padding:8px;color:#555;">${subject}</td></tr>` : ''}
            <tr><td style="padding:8px 8px 8px 0;font-weight:700;color:#7C3AED;vertical-align:top;">Message</td><td style="padding:8px;color:#555;line-height:1.6;">${message}</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `📩 Contact: ${subject || name}`,
    html,
  });
};

export default transporter;