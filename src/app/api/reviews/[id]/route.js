import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

async function recalculateProductRating(productId) {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });
  const numReviews = reviews.length;
  const avgRating = numReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews
    : 0;

  await prisma.product.update({
    where: { id: productId },
    data: { rating: parseFloat(avgRating.toFixed(1)), numReviews },
  });
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { rating, title, comment, images } = await request.json();

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(rating  && { rating: parseInt(rating) }),
        ...(title !== undefined  && { title:   title?.trim() || null }),
        ...(comment && { comment: comment.trim() }),
        ...(images  && { images:  Array.isArray(images) ? images.filter(img => img?.url) : [] }),
      },
    });

    await recalculateProductRating(review.productId);

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error('Review PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    if (review.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });
    await recalculateProductRating(review.productId);

    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}