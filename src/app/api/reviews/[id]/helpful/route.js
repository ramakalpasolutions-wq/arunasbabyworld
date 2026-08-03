import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Please login' }, { status: 401 });

    const { id } = await params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const userId = session.user.id;
    const helpfulBy = review.helpfulBy || [];
    const alreadyMarked = helpfulBy.includes(userId);

    const newHelpfulBy = alreadyMarked
      ? helpfulBy.filter(id => id !== userId)
      : [...helpfulBy, userId];

    const updated = await prisma.review.update({
      where: { id },
      data: {
        helpfulBy:    newHelpfulBy,
        helpfulCount: newHelpfulBy.length,
      },
    });

    return NextResponse.json({ helpful: !alreadyMarked, count: updated.helpfulCount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}