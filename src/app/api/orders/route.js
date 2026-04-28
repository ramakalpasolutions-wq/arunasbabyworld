import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where = {};
    if (session.user.role !== 'admin') where.userId = session.user.id;
    if (status) where.orderStatus = status;

    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const data = await request.json();

    const order = await prisma.order.create({
      data: { ...data, userId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
    });

    // ✅ Send email to CUSTOMER'S login email
    const customerEmail = session.user.email;
    const customerName = session.user.name;

    console.log('Sending order confirmation to:', customerEmail);

    try {
      await sendOrderConfirmation(order, customerEmail, customerName);
      console.log('✅ Email sent to customer:', customerEmail);
    } catch (emailErr) {
      console.error('❌ Email error:', emailErr);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Order POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}