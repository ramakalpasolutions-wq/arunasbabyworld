import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyCaptcha, clientIp } from '@/lib/turnstile';

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

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || null,
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