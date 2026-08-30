import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';

// ═══════════════════════════════════════
// SHIPPING RULES (same as CartContext)
// ═══════════════════════════════════════
const SHIPPING_FEE = 50;
const FREE_SHIPPING_THRESHOLD = 800;

function isFoodItem(item) {
  const catSlug = (
    item.categorySlug ||
    item.category?.slug ||
    (typeof item.category === 'string' ? item.category : '') ||
    ''
  ).toLowerCase();

  const catName = (
    item.categoryName ||
    item.category?.name ||
    ''
  ).toLowerCase();

  const foodCat = (item.foodCategory || '').toLowerCase();

  return (
    catSlug.includes('food') ||
    catName.includes('food') ||
    catSlug.includes('baby-food') ||
    catName.includes('baby food') ||
    Boolean(foodCat) ||
    item.isFood === true
  );
}

function calculateShipping(orderItems, itemsPrice) {
  if (!orderItems || orderItems.length === 0) return 0;
  const hasFood = orderItems.some(isFoodItem);
  if (hasFood) return SHIPPING_FEE;
  if (itemsPrice >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEE;
}

async function getNextOrderNumber() {
  try {
    const counter = await prisma.counter.upsert({
      where:  { name: 'orderNumber' },
      update: { value: { increment: 1 } },
      create: { name: 'orderNumber', value: 40001 },
    });
    return counter.value;
  } catch (err) {
    console.error('Counter error:', err);
    return null;
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status                = searchParams.get('status');
    const paymentStatus         = searchParams.get('paymentStatus');
    const excludeFailedPayments = searchParams.get('excludeFailedPayments');
    const startDate             = searchParams.get('startDate');
    const endDate               = searchParams.get('endDate');
    const page                  = parseInt(searchParams.get('page')  || '1');
    const limit                 = parseInt(searchParams.get('limit') || '10');

    const where = {};
    if (session.user.role !== 'admin') where.userId = session.user.id;
    if (status) where.orderStatus = status;

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    } else if (excludeFailedPayments === 'true') {
      where.NOT = [
        {
          AND: [
            { paymentStatus: 'failed' },
            { isPaid: false },
          ],
        },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate)   where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const total  = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.orderItems || data.orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    if (!data.shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Enrich order items with category info from DB (for accurate food detection)
    const enrichedItems = await Promise.all(
      data.orderItems.map(async (item) => {
        try {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              categoryId: true,
              category: true,
              foodCategory: true,
            },
          });

          let categorySlug = '';
          let categoryName = '';

          if (product?.categoryId) {
            try {
              const cat = await prisma.category.findUnique({
                where: { id: product.categoryId },
                select: { slug: true, name: true },
              });
              categorySlug = cat?.slug || '';
              categoryName = cat?.name || '';
            } catch {}
          }

          return {
            ...item,
            categorySlug,
            categoryName,
            category: categorySlug || categoryName || item.category,
            foodCategory: product?.foodCategory || item.foodCategory || null,
          };
        } catch {
          return item;
        }
      })
    );

    const itemsPrice = enrichedItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );

    // ✅ Server-side shipping recalculation (cannot be bypassed by client)
    const shippingPrice = calculateShipping(enrichedItems, itemsPrice);
    const discountAmount = Number(data.discountAmount) || 0;
    const taxPrice = Number(data.taxPrice) || 0;
    const totalPrice = Math.round(itemsPrice + shippingPrice + taxPrice - discountAmount);

    const orderNumber = await getNextOrderNumber();

    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      couponCode,
      isPaid,
      paidAt,
      orderStatus,
      paymentStatus,
    } = data;

    const order = await prisma.order.create({
      data: {
        orderNumber:     orderNumber ?? undefined,
        userId:          session.user.id,
        orderItems:      orderItems || [],
        shippingAddress: shippingAddress,
        paymentMethod:   paymentMethod || 'Razorpay',
        itemsPrice:      itemsPrice,
        shippingPrice:   shippingPrice,   // ✅ server-calculated
        taxPrice:        taxPrice,
        discountAmount:  discountAmount,
        totalPrice:      totalPrice,      // ✅ server-calculated
        couponCode:      couponCode    || null,
        isPaid:          isPaid        || false,
        paidAt:          paidAt        || null,
        orderStatus:     orderStatus   || 'Pending',
        paymentStatus:   paymentStatus || (paymentMethod === 'COD' ? 'not_applicable' : 'pending'),
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    console.log(
      '✅ Order created:', order.id,
      '| Shipping:', shippingPrice,
      '| Total:', totalPrice,
      '| Food shipping applied:', shippingPrice === SHIPPING_FEE && itemsPrice >= FREE_SHIPPING_THRESHOLD
    );

    if (paymentMethod === 'COD') {
      try {
        await sendOrderConfirmation(
          order,
          session.user.email,
          session.user.name
        );
      } catch (emailErr) {
        console.error('❌ Email error (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ order }, { status: 201 });

  } catch (error) {
    console.error('Order POST error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate order detected' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Related record not found' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}