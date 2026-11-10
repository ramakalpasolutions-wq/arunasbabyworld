import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { peekResetUserId, isValidResetToken } from '@/lib/passwordReset';

const EXPIRED = 'This reset link is invalid or has expired. Please request a new one.';

async function userForToken(token) {
  const uid = peekResetUserId(token);
  if (!uid) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || user.isActive === false) return null;
  return isValidResetToken(token, user) ? user : null;
}

// Lets the page check a link before showing the form
export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    const user = await userForToken(token);
    if (!user) return NextResponse.json({ valid: false, error: EXPIRED }, { status: 400 });
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Reset link check error:', error);
    return NextResponse.json({ valid: false, error: EXPIRED }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await userForToken(token);
    if (!user) return NextResponse.json({ error: EXPIRED }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 12) },
    });

    return NextResponse.json({ message: 'Password updated. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
