import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const productIds = [...new Set(reviews.map(r => r.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = {};
    products.forEach(p => { productMap[p.id] = p.name; });

    const enriched = reviews.map(r => ({
      ...r,
      productName: productMap[r.productId] || 'Unknown Product',
    }));

    return NextResponse.json({ reviews: enriched });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}