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
    data: {
      rating:     parseFloat(avgRating.toFixed(1)),
      numReviews,
    },
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page      = parseInt(searchParams.get('page')  || '1');
    const limit     = parseInt(searchParams.get('limit') || '10');
    const sort      = searchParams.get('sort') || 'newest';

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    let orderBy;
    switch (sort) {
      case 'oldest':       orderBy = { createdAt:    'asc'  }; break;
      case 'highest':      orderBy = { rating:       'desc' }; break;
      case 'lowest':       orderBy = { rating:       'asc'  }; break;
      case 'most-helpful': orderBy = { helpfulCount: 'desc' }; break;
      default:             orderBy = { createdAt:    'desc' };
    }

    const [reviews, total, ratingBreakdown] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { productId, isApproved: true } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId, isApproved: true },
        _count: true,
      }),
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingBreakdown.forEach(r => {
      breakdown[r.rating] = r._count;
    });

    const totalReviews = total;
    const avgRating = totalReviews > 0
      ? Object.entries(breakdown).reduce((sum, [rating, count]) => sum + (rating * count), 0) / totalReviews
      : 0;

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalReviews,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Please login to review' }, { status: 401 });
    }

    const { productId, rating, title, comment, images } = await request.json();

    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (!comment || comment.trim().length < 10) {
      return NextResponse.json({ error: 'Comment must be at least 10 characters' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existingReview = await prisma.review.findFirst({
      where: { productId, userId: session.user.id },
    });
    if (existingReview) {
      return NextResponse.json({
        error: 'You already reviewed this product. Edit your existing review.',
      }, { status: 400 });
    }

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        orderStatus: 'Delivered',
        orderItems: {
          some: { productId },
        },
      },
    });

    const isVerified = !!deliveredOrder;

    const review = await prisma.review.create({
      data: {
        productId,
        userId:  session.user.id,
        orderId: deliveredOrder?.id || null,
        name:    session.user.name  || 'Anonymous',
        email:   session.user.email || null,
        rating:  parseInt(rating),
        title:   title?.trim() || null,
        comment: comment.trim(),
        images:  Array.isArray(images) ? images.filter(img => img?.url) : [],
        isVerified,
        isApproved: true,
      },
    });

    await recalculateProductRating(productId);

    return NextResponse.json({ review, message: 'Review posted successfully!' }, { status: 201 });

  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}