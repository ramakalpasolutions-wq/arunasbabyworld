import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/nodemailer';
import { verifyCaptcha, clientIp } from '@/lib/turnstile';
import { normalizePhone } from '@/lib/phone';
import { createResetToken, maskEmail, RESET_LINK_MINUTES } from '@/lib/passwordReset';

function resetEmailHtml(name, link) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#FFFBF2;border:1px solid #E8E2D2;border-radius:16px;overflow:hidden">
    <div style="height:6px;background:linear-gradient(90deg,#E53935,#FB8C00,#F9B800,#43A047,#1E88E5,#3949AB,#8E24AA)"></div>
    <div style="padding:28px 28px 24px;color:#264653">
      <h1 style="margin:0 0 12px;font-size:22px;color:#264653">Reset your password</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Hi ${name || 'there'},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6">
        We received a request to reset the password for your Arunas Baby World account.
        Click the button below to choose a new one. This link works once and expires in ${RESET_LINK_MINUTES} minutes.
      </p>
      <p style="margin:0 0 22px">
        <a href="${link}" style="display:inline-block;background:#264653;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 26px;border-radius:999px">Choose a new password</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#4F6B76">If the button does not work, copy this link into your browser:</p>
      <p style="margin:0 0 20px;font-size:12px;line-height:1.5;word-break:break-all;color:#4F6B76">${link}</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#4F6B76">
        If you did not ask for this, you can ignore this email. Your password will stay the same.
      </p>
    </div>
  </div>`;
}

export async function POST(request) {
  try {
    const { identifier, captchaToken } = await request.json();

    const human = await verifyCaptcha(captchaToken, clientIp(request.headers));
    if (!human) {
      return NextResponse.json(
        { error: 'Human verification failed. Please try again.', code: 'CAPTCHA_FAILED' },
        { status: 400 }
      );
    }

    const typed = String(identifier || '').trim();
    if (!typed) {
      return NextResponse.json({ error: 'Please enter your phone number' }, { status: 400 });
    }

    let users = [];
    if (typed.includes('@')) {
      const byEmail = await prisma.user.findUnique({ where: { email: typed.toLowerCase() } });
      if (byEmail) users = [byEmail];
    } else {
      const phone = normalizePhone(typed);
      if (!phone) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit mobile number' },
          { status: 400 }
        );
      }
      const matches = await prisma.user.findMany({ where: { phone: { endsWith: phone } } });
      users = matches.filter((u) => normalizePhone(u.phone) === phone);
    }

    users = users.filter((u) => u.isActive !== false && u.password && u.email).slice(0, 3);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No account found with these details.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const origin = (process.env.NEXTAUTH_URL || new URL(request.url).origin).replace(/\/$/, '');

    for (const user of users) {
      const link = `${origin}/reset-password?token=${encodeURIComponent(createResetToken(user))}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your Arunas Baby World password',
        html: resetEmailHtml(user.name?.split(' ')[0], link),
      });
    }

    return NextResponse.json({
      message: 'Reset link sent',
      sentTo: users.map((u) => maskEmail(u.email)),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'We could not send the reset email. Please try again in a few minutes.' },
      { status: 500 }
    );
  }
}
