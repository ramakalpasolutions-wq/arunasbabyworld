import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PATCH(req, { params }) {
  try {
    // ✅ Admin check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // ✅ FIX — await params in Next.js 15
    const { id } = await params;
    const { isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    // ✅ Find user first
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ✅ Protect admin accounts
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot deactivate admin accounts' },
        { status: 400 }
      );
    }

    // ✅ Update isActive
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });

  } catch (error) {
    console.error('Toggle user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}