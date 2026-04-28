import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/nodemailer';

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Contact GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, email, phone, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required' },
        { status: 400 }
      );
    }

    // ✅ Save to database
    const contact = await prisma.contact.create({
      data: { name, email, phone: phone || null, subject: subject || null, message },
    });

    // ✅ Send email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `📩 New Contact: ${subject || 'General Inquiry'} - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b9d, #7c3aed); padding: 24px; border-radius: 10px 10px 0 0;">
              <h2 style="color: white; margin: 0;">📩 New Contact Message</h2>
            </div>
            <div style="padding: 24px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: 700; color: #666; width: 120px;">Name</td>
                  <td style="padding: 10px;">${name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: 700; color: #666;">Email</td>
                  <td style="padding: 10px;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                ${phone ? `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: 700; color: #666;">Phone</td>
                  <td style="padding: 10px;">${phone}</td>
                </tr>` : ''}
                ${subject ? `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: 700; color: #666;">Subject</td>
                  <td style="padding: 10px;">${subject}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 10px; font-weight: 700; color: #666; vertical-align: top;">Message</td>
                  <td style="padding: 10px;">${message}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/admin/contacts"
                   style="background: linear-gradient(135deg, #ff6b9d, #7c3aed); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
                  View in Admin Panel
                </a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Admin email error:', emailErr);
    }

    // ✅ Send confirmation email to customer
    try {
      await sendEmail({
        to: email,
        subject: '✅ We received your message - BabyBliss',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b9d, #7c3aed); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">✅ Message Received!</h2>
            </div>
            <div style="padding: 24px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
              <p>Dear <strong>${name}</strong>,</p>
              <p>Thank you for contacting <strong>BabyBliss</strong>! We have received your message and will get back to you within <strong>24 hours</strong>.</p>
              <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ff6b9d;">
                <p style="margin: 0; color: #666; font-size: 14px;"><strong>Your message:</strong></p>
                <p style="margin: 8px 0 0; color: #333;">${message}</p>
              </div>
              <p style="color: #888; font-size: 13px;">
                If you need urgent help, call us at <strong>1800-123-456</strong> (Mon-Sat, 9am-6pm IST)
              </p>
              <p style="color: #888; font-size: 13px;">
                With love, 🍼<br/>
                <strong>BabyBliss Team</strong>
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Customer email error:', emailErr);
    }

    return NextResponse.json(
      { message: 'Message sent successfully', id: contact.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}