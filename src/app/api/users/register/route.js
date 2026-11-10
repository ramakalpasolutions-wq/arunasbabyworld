import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyCaptcha, clientIp } from '@/lib/turnstile';
import { normalizePhone, isValidEmail } from '@/lib/phone';

export async function POST(request) {
  try {
    const { name, email, password, phone, acceptedPolicies, captchaToken } = await request.json();

    if (acceptedPolicies !== true) {
      return NextResponse.json(
        { error: 'Please accept the Terms & Conditions and store policies to create an account' },
        { status: 400 }
      );
    }

    const human = await verifyCaptcha(captchaToken, clientIp(request.headers));
    if (!human) {
      return NextResponse.json(
        { error: 'Human verification failed. Please try again.', code: 'CAPTCHA_FAILED' },
        { status: 400 }
      );
    }

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone number, email and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // ✅ Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // The phone number is the login ID, so it must be unique too
    const samePhone = await prisma.user.findMany({
      where: { phone: { endsWith: normalizedPhone } },
      select: { phone: true },
    });
    if (samePhone.some((u) => normalizePhone(u.phone) === normalizedPhone)) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists. Please login.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone,
        isActive: true,    // ✅ Always true when registering
        role: 'user',      // ✅ Default role
      },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}