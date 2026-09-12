import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/nodemailer';
import { validateCheckoutRules, ELIGIBLE_GUNTUR_PINCODES } from '@/lib/checkoutRules';

const STANDARD_SHIPPING_FEE = 50;
const COD_EXTRA_FEE = 20;
const FREE_SHIPPING_THRESHOLD = 800;
const BABY_FOOD_CATEGORY_ID = '6a5473f71736df8447776561';

function isGunturLocation(address) {
  if (!address) return false;
  const pincode = String(address.pincode || address.pin || '').trim();
  return ELIGIBLE_GUNTUR_PINCODES.includes(pincode);
}

function isFoodItem(item) {
  const catId = String(item.categoryId || '');
  const catSlug = (item.categorySlug || '').toLowerCase();
  const catName = (item.categoryName || '').toLowerCase();

  return (
    item.isFood === true ||
    catId === BABY_FOOD_CATEGORY_ID ||
    catSlug.includes('food') ||
    catName.includes('food') ||
    catSlug.includes('baby-food') ||
    catName.includes('baby baby-food')
  );
}

function calculateShipping(orderItems, itemsPrice, address, paymentMethod) {
  if (!orderItems || orderItems.length === 0) return 0;

  const isGuntur = isGunturLocation(address);
  const foodItems = orderItems.filter(isFoodItem);
  const nonFoodItems = orderItems.filter(item => !isFoodItem(item));
  const isOnlyFood = foodItems.length > 0 && nonFoodItems.length === 0;
  const totalFoodQty = foodItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const isCOD = paymentMethod === 'COD';

  let baseShipping = 0;

  if (isOnlyFood) {
    if (isGuntur) {
      baseShipping = 0;
    } else {
      if (totalFoodQty >= 2) {
        baseShipping = 0;
      } else {
        baseShipping = STANDARD_SHIPPING_FEE;
      }
    }
  } else {
    const hasFood = foodItems.length > 0;
    if (hasFood && !isGuntur) {
      baseShipping = STANDARD_SHIPPING_FEE;
    } else if (itemsPrice >= FREE_SHIPPING_THRESHOLD) {
      baseShipping = 0;
    } else {
      baseShipping = STANDARD_SHIPPING_FEE;
    }
  }

  const codFee = isCOD ? COD_EXTRA_FEE : 0;
  return baseShipping + codFee;
}

async function getNextOrderNumber() {
  try {
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    return lastOrder?.orderNumber ? lastOrder.orderNumber + 1 : 40001;
  } catch (err) {
    console.error('Error fetching last order number sequence:', err);
    return Math.floor(40000 + Math.random() * 50000);
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
    const limit                 = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const where = {};
    if (session.user.role !== 'admin') where.userId = session.user.id;
    if (status && status !== 'all') where.orderStatus = status;

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

    const statusCountsWhere = {};
    if (session.user.role !== 'admin') {
      statusCountsWhere.userId = session.user.id;
    }
    if (excludeFailedPayments === 'true') {
      statusCountsWhere.NOT = [
        {
          AND: [
            { paymentStatus: 'failed' },
            { isPaid: false },
          ],
        },
      ];
    }

    const [total, orders, statusGroups] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          paymentMethod: true,
          itemsPrice: true,
          shippingPrice: true,
          taxPrice: true,
          discountAmount: true,
          totalPrice: true,
          couponCode: true,
          isPaid: true,
          paidAt: true,
          orderStatus: true,
          paymentStatus: true,
          createdAt: true,
          orderItems: {
            select: {
              productId: true,
              name: true,
              image: true,
              price: true,
              quantity: true,
            }
          },
          shippingAddress: true,
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.groupBy({
        by: ['orderStatus'],
        where: statusCountsWhere,
        _count: { _all: true },
      })
    ]);

    const statusCounts = {
      all: 0,
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
      Refunded: 0,
    };

    statusGroups.forEach(g => {
      const count = g._count._all || 0;
      if (g.orderStatus) {
        statusCounts[g.orderStatus] = count;
      }
      statusCounts.all += count;
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statusCounts,
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    if (!data.shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    const {
      shippingAddress,
      paymentMethod,
      couponCode,
      isPaid,
      paidAt,
      orderStatus,
      paymentStatus,
    } = data;

    const isGuntur = isGunturLocation(shippingAddress);

    // Fetch active brand discounts
    const brandDiscounts = await prisma.gunturFoodDiscount.findMany({
      where: { isActive: true },
    });

    const enrichedItems = await Promise.all(
      data.orderItems.map(async (item) => {
        try {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              price: true,
              discountPrice: true,
              brand: true,
              categoryId: true,
              category: {
                select: {
                  slug: true,
                  name: true,
                },
              },
            },
          });

          let categorySlug = product?.category?.slug || '';
          let categoryName = product?.category?.name || '';
          let categoryId = product?.categoryId || item.categoryId || '';

          if (!categorySlug && categoryId) {
            try {
              const cat = await prisma.category.findUnique({
                where: { id: categoryId },
                select: { slug: true, name: true },
              });
              categorySlug = cat?.slug || '';
              categoryName = cat?.name || '';
            } catch {}
          }

          const itemIsFood = !!(
            item.isFood ||
            categoryId === BABY_FOOD_CATEGORY_ID ||
            categorySlug.toLowerCase().includes('food') ||
            categoryName.toLowerCase().includes('food')
          );

          const baseDbPrice = product ? (product.discountPrice || product.price) : (item.price || 0);
          
          let finalVerifiedPrice = baseDbPrice;
          
          if (itemIsFood && isGuntur) {
            const itemBrand = (product?.brand || item.brand || '').trim().toLowerCase();
            const brandRule = brandDiscounts.find(
              d => d.brand.toLowerCase() === itemBrand && d.isActive
            );
            const discountPct = brandRule ? brandRule.discountPercent : 10;
            finalVerifiedPrice = Math.round(baseDbPrice * (1 - discountPct / 100));
          }

          return {
            ...item,
            price: finalVerifiedPrice,
            categoryId,
            categorySlug,
            categoryName,
            isFood: itemIsFood
          };
        } catch (enrichErr) {
          console.error(`Error enriching item ${item.productId}:`, enrichErr);
          return item;
        }
      })
    );

    const foodItems = enrichedItems.filter(isFoodItem);
    const nonFoodItems = enrichedItems.filter(item => !isFoodItem(item));
    const isOnlyFood = foodItems.length > 0 && nonFoodItems.length === 0;
    const totalFoodQty = foodItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    // Minimum 2 food items required outside Guntur
    if (isOnlyFood && !isGuntur && totalFoodQty < 2) {
      return NextResponse.json(
        { error: 'Minimum order of 2 food items is required for delivery outside Guntur city.' },
        { status: 400 }
      );
    }

    const itemsPrice = enrichedItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );

    const shippingPrice = calculateShipping(
      enrichedItems,
      itemsPrice,
      shippingAddress,
      paymentMethod
    );
    const discountAmount = Number(data.discountAmount) || 0;
    const taxPrice = Number(data.taxPrice) || 0;
    const totalPrice = Math.max(0, Math.round(itemsPrice + shippingPrice + taxPrice - discountAmount));

    // --------------------------------------------------------------------------
    // Backend Enforcement of Food MOV & Cash On Delivery (COD) Rules
    // --------------------------------------------------------------------------
    const companySettings = await prisma.companySettings.findFirst({
      select: { codEnabled: true }
    });
    const isCodAdminEnabled = companySettings?.codEnabled !== false;

    const rules = validateCheckoutRules({
      cartItems: enrichedItems,
      pincode: shippingAddress?.pincode,
      isCodAdminEnabled,
      finalTotal: totalPrice,
    });

    if (!rules.isFoodMovValid) {
      return NextResponse.json(
        { error: rules.foodMovError },
        { status: 400 }
      );
    }

    if (paymentMethod === 'COD' && !rules.isCodAvailable) {
      return NextResponse.json(
        { error: rules.codDisabledReason },
        { status: 400 }
      );
    }

    const orderNumber = await getNextOrderNumber();

    const sanitizedOrderItems = enrichedItems.map((item) => ({
      productId: item.productId || null,
      name: item.name || '',
      image: item.image || '',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    }));

    const order = await prisma.order.create({
      data: {
        orderNumber:     orderNumber,
        userId:          session.user.id,
        orderItems:      sanitizedOrderItems,
        shippingAddress: {
          name:    shippingAddress.name || '',
          phone:   shippingAddress.phone || '',
          address: shippingAddress.address || '',
          city:    shippingAddress.city || '',
          state:   shippingAddress.state || '',
          pincode: shippingAddress.pincode || '',
        },
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
      '✅ Order created securely:', order.id,
      '| Guntur Check:', isGuntur,
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
      return NextResponse.json({ error: 'Duplicate order detected' }, { status: 400 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Related record not found' }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
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