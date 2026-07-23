import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // ✅ Update your specific email to admin
    const updated = await prisma.user.update({
      where: { email: 'lalithlalli18@gmail.com' },
      data:  { role: 'admin' },
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated to admin!',
      email:   updated.email,
      role:    updated.role,
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json({
      success: false,
      error:   error.message,
    }, { status: 500 });
  }
}