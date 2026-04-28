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

// ✅ Send to customer's email
export const sendOrderConfirmation = async (order, customerEmail, customerName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b9d, #7c3aed); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 Order Confirmed!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Thank you for your order! Your order has been confirmed.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b9d;">
          <h3 style="margin: 0 0 12px; color: #ff6b9d;">Order Details</h3>
          <p><strong>Order ID:</strong> #${order.id?.slice(-8)?.toUpperCase()}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod || 'Razorpay'}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px; color: #333;">Items Ordered</h3>
          ${order.orderItems?.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>${item.name} × ${item.quantity}</span>
              <span><strong>₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</strong></span>
            </div>
          `).join('')}
          <div style="text-align: right; margin-top: 12px; font-size: 18px; font-weight: bold; color: #ff6b9d;">
            Total: ₹${order.totalPrice?.toLocaleString('en-IN')}
          </div>
        </div>

        <div style="background: #e0f2fe; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0369a1;">
            📦 We will notify you when your order is shipped!<br/>
            You can track your order by logging into your account.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background: linear-gradient(135deg, #ff6b9d, #7c3aed); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
            Track Your Order
          </a>
        </div>

        <p style="margin-top: 24px; color: #888; font-size: 13px; text-align: center;">
          Thank you for shopping with BabyBliss! 🍼<br/>
          If you have any questions, contact us at care@babybliss.in
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

// ✅ Send status update to customer
export const sendOrderStatusUpdate = async (order, customerEmail, customerName) => {
  const statusEmoji = {
    Confirmed: '✅',
    Processing: '⚙️',
    Shipped: '🚚',
    Delivered: '🎉',
    Cancelled: '❌',
  };

  const emoji = statusEmoji[order.orderStatus] || '📦';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b9d, #7c3aed); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${emoji} Order ${order.orderStatus}!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <p>Dear <strong>${customerName || 'Customer'}</strong>,</p>
        <p>Your order <strong>#${order.id?.slice(-8)?.toUpperCase()}</strong> status has been updated to <strong>${order.orderStatus}</strong>.</p>

        ${order.orderStatus === 'Shipped' ? `
          <div style="background: #e0f2fe; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #0369a1;">
              🚚 Your order is on the way!<br/>
              ${order.trackingNumber ? `<strong>Tracking Number:</strong> ${order.trackingNumber}` : ''}
            </p>
          </div>
        ` : ''}

        ${order.orderStatus === 'Delivered' ? `
          <div style="background: #d1fae5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #065f46;">
              🎉 Your order has been delivered! Enjoy your purchase.<br/>
              We hope you love it!
            </p>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.NEXTAUTH_URL}/orders/${order.id}"
             style="background: linear-gradient(135deg, #ff6b9d, #7c3aed); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
            View Order Details
          </a>
        </div>

        <p style="margin-top: 24px; color: #888; font-size: 13px; text-align: center;">
          Thank you for shopping with BabyBliss! 🍼
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `${emoji} Order ${order.orderStatus} - #${order.id?.slice(-8)?.toUpperCase()} | BabyBliss`,
    html,
  });
};

export const sendContactEmail = async ({ name, email, phone, subject, message }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #ff6b9d;">📩 New Contact Message</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: 700; color: #666; width: 100px;">Name</td><td style="padding: 8px;">${name}</td></tr>
        <tr><td style="padding: 8px; font-weight: 700; color: #666;">Email</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding: 8px; font-weight: 700; color: #666;">Phone</td><td style="padding: 8px;">${phone}</td></tr>` : ''}
        ${subject ? `<tr><td style="padding: 8px; font-weight: 700; color: #666;">Subject</td><td style="padding: 8px;">${subject}</td></tr>` : ''}
        <tr><td style="padding: 8px; font-weight: 700; color: #666; vertical-align: top;">Message</td><td style="padding: 8px;">${message}</td></tr>
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