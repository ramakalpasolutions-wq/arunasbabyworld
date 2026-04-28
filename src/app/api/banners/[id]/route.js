import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // ✅ Clean update data
    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.buttonText !== undefined) updateData.buttonText = body.buttonText;
    if (body.buttonLink !== undefined) updateData.buttonLink = body.buttonLink;
    if (body.bgColor !== undefined) updateData.bgColor = body.bgColor;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.order !== undefined) updateData.order = parseInt(body.order) || 0;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.emoji !== undefined) updateData.emoji = body.emoji;
    if (body.price !== undefined) updateData.price = body.price ? parseFloat(body.price) : null;
    if (body.offer !== undefined) updateData.offer = body.offer;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.slug !== undefined) updateData.slug = body.slug;

    if (body.image && body.image.url) {
      updateData.image = {
        url: body.image.url,
        publicId: body.image.publicId || '',
      };
    } else if (body.image === null) {
      updateData.image = null;
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Banner PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Banner DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}