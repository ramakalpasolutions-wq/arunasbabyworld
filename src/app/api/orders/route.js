import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';

const STANDARD_SHIPPING_FEE = 50;
const COD_EXTRA_FEE = 20;
const FREE_SHIPPING_THRESHOLD = 800;
const BABY_FOOD_CATEGORY_ID = '6a5473f71736df8447776561';

function isGunturLocation(address) {
  if (!address) return false;
  const city = (address.city || '').toLowerCase().trim();
  const pincode = (address.pincode || '').toString().trim();
  return city.includes('guntur') || pincode.startsWith('522');
}

function isFoodItem(item) {
  const catId = String(item.categoryId || item.category?.id || item.category?._id || item.category || '');
  const catSlug = (item.categorySlug || item.category?.slug || '').toString().toLowerCase();
  const catName = (item.categoryName || item.category?.name || '').toString().toLowerCase();
  const foodCat = (item.foodCategory || '').toLowerCase();

  return (
    item.isFood === true ||
    catId === BABY_FOOD_CATEGORY_ID ||
    catSlug.includes('food') ||
    catName.includes('food') ||
    catSlug.includes('baby-food') ||
    catName.includes('baby food') ||
    Boolean(foodCat)
  );
}

function calculateShipping(orderItems, itemsPrice, address, paymentMethod) {
  if (!orderItems || orderItems.length === 0) return 0;

  const isGuntur = isGunturLocation(address);
  const hasFood = orderItems.some(isFoodItem);
  const isCOD = paymentMethod === 'COD';

  let baseShipping = 0;

  if (hasFood && !isGuntur) {
    baseShipping = STANDARD_SHIPPING_FEE;
  } else if (itemsPrice >= FREE_SHIPPING_THRESHOLD) {
    baseShipping = 0;
  } else {
    baseShipping = STANDARD_SHIPPING_FEE;
  }

  const codFee = isCOD ? COD_EXTRA_FEE : 0;
  return baseShipping + codFee;
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
          let categoryId = product?.categoryId || item.categoryId || '';

          if (categoryId) {
            try {
              const cat = await prisma.category.findUnique({
                where: { id: categoryId },
                select: { slug: true, name: true },
              });
              categorySlug = cat?.slug || '';
              categoryName = cat?.name || '';
            } catch {}
          }

          return {
            ...item,
            categoryId,
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

    const shippingPrice = calculateShipping(
      enrichedItems,
      itemsPrice,
      shippingAddress,
      paymentMethod
    );
    const discountAmount = Number(data.discountAmount) || 0;
    const taxPrice = Number(data.taxPrice) || 0;
    const totalPrice = Math.max(0, Math.round(itemsPrice + shippingPrice + taxPrice - discountAmount));

    const orderNumber = await getNextOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber:     orderNumber ?? undefined,
        userId:          session.user.id,
        orderItems:      enrichedItems || orderItems || [],
        shippingAddress: shippingAddress,
        paymentMethod:   paymentMethod || 'Razorpay',
        itemsPrice:      itemsPrice,
        shippingPrice:   shippingPrice,
        taxPrice:        taxPrice,
        discountAmount:  discountAmount,
        totalPrice:      totalPrice,
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
      '| Total:', totalPrice
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