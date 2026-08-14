import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const brand  = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    return NextResponse.json({ brand });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id }     = await params;
    const body       = await request.json();
    const updateData = {};

    if (body.name     !== undefined) updateData.name     = body.name;
    if (body.color    !== undefined) updateData.color    = body.color;
    if (body.link     !== undefined) updateData.link     = body.link;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.order    !== undefined) updateData.order    = parseInt(body.order) || 0;

    if (body.logo?.url) {
      updateData.logo = {
        url:      body.logo.url,
        publicId: body.logo.publicId || '',
      };
    } else if (body.logo === null) {
      updateData.logo = null;
    }

    const brand = await prisma.brand.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json({ brand });

  } catch (error) {
    console.error('Brand PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ message: 'Brand deleted successfully' });

  } catch (error) {
    console.error('Brand DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}