import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { fromId, toId } = await request.json();

    if (!fromId || !toId) {
      return NextResponse.json(
        { error: 'Both fromId and toId are required' },
        { status: 400 }
      );
    }

    if (fromId === toId) {
      return NextResponse.json(
        { error: 'Cannot merge same category' },
        { status: 400 }
      );
    }

    // ✅ Check both categories exist
    const fromCat = await prisma.category.findUnique({ where: { id: fromId } });
    const toCat   = await prisma.category.findUnique({ where: { id: toId } });

    if (!fromCat) return NextResponse.json({ error: 'FROM category not found' }, { status: 404 });
    if (!toCat)   return NextResponse.json({ error: 'TO category not found' },   { status: 404 });

    // ✅ Count products in FROM category
    const productCount = await prisma.product.count({
      where: { categoryId: fromId },
    });

    // ✅ Move all products from FROM → TO
    await prisma.product.updateMany({
      where: { categoryId: fromId },
      data:  { categoryId: toId },
    });

    // ✅ Delete FROM category
    await prisma.category.delete({ where: { id: fromId } });

    return NextResponse.json({
      message: `✅ Merged! ${productCount} products moved from "${fromCat.name}" to "${toCat.name}". "${fromCat.name}" deleted.`,
      productsMoved: productCount,
      deletedCategory: fromCat.name,
      targetCategory: toCat.name,
    });

  } catch (error) {
    console.error('Category merge error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}