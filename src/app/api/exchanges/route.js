import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { razorpay, createRefund } from '@/lib/razorpay';
import {
  sendExchangeRequestConfirmation,
  sendAdminExchangeNotification,
} from '@/lib/nodemailer';

// ============================================================
// ✅ GET — List exchanges (customer's own OR all for admin)
// ============================================================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page   = parseInt(searchParams.get('page')  || '1');
    const limit  = parseInt(searchParams.get('limit') || '20');

    const where = {};
    if (session.user.role !== 'admin') where.userId = session.user.id;
    if (status && status !== 'all')    where.status = status;

    const total = await prisma.exchange.count({ where });
    const exchanges = await prisma.exchange.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrich with user + order info (for admin)
    const enriched = await Promise.all(
      exchanges.map(async (ex) => {
        const [user, order] = await Promise.all([
          prisma.user.findUnique({
            where: { id: ex.userId },
            select: { name: true, email: true, phone: true },
          }),
          prisma.order.findUnique({
            where: { id: ex.orderId },
            select: { id: true, shippingAddress: true, totalPrice: true },
          }),
        ]);
        return { ...ex, user, order };
      })
    );

    return NextResponse.json({
      exchanges: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Exchanges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// ✅ POST — Create new exchange request
// ============================================================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      oldProductId,
      newProductId,
      reason,
      description,
      images = [],
    } = body;

    /* ── Validate ── */
    if (!orderId || !oldProductId || !newProductId || !reason?.trim()) {
      return NextResponse.json(
        { error: 'Order ID, products, and reason are required' },
        { status: 400 }
      );
    }

    if (oldProductId === newProductId) {
      return NextResponse.json(
        { error: 'New product must be different from old product' },
        { status: 400 }
      );
    }

    /* ── Fetch order ── */
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    /* ── Auth ── */
    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    /* ── Business rules ── */
    if (!order.isDelivered || order.orderStatus !== 'Delivered') {
      return NextResponse.json(
        { error: 'Exchange only available for delivered orders' },
        { status: 400 }
      );
    }

    /* ── 3-DAY WINDOW CHECK ── */
    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
    const now         = new Date();
    const daysSince   = Math.floor((now - deliveredAt) / (1000 * 60 * 60 * 24));
    if (daysSince > 3) {
      return NextResponse.json(
        { error: `Exchange window expired. Items can only be exchanged within 3 days of delivery (${daysSince} days passed).` },
        { status: 400 }
      );
    }

    /* ── Check existing pending exchange ── */
    if (order.exchangeId && order.exchangeStatus !== 'rejected' && order.exchangeStatus !== 'completed') {
      return NextResponse.json(
        { error: 'An exchange request is already in progress for this order' },
        { status: 400 }
      );
    }

    /* ── Find OLD item in order ── */
    const oldItem = order.orderItems?.find(item => item.productId === oldProductId);
    if (!oldItem) {
      return NextResponse.json(
        { error: 'Product not found in this order' },
        { status: 400 }
      );
    }

    /* ── Fetch NEW product ── */
    const newProduct = await prisma.product.findUnique({
      where: { id: newProductId },
      select: {
        id: true, name: true, price: true, discountPrice: true,
        stock: true, images: true, isActive: true,
      },
    });

    if (!newProduct) {
      return NextResponse.json({ error: 'Replacement product not found' }, { status: 404 });
    }

    if (!newProduct.isActive) {
      return NextResponse.json({ error: 'Replacement product is no longer available' }, { status: 400 });
    }

    if (newProduct.stock < 1) {
      return NextResponse.json({ error: 'Replacement product is out of stock' }, { status: 400 });
    }

    /* ── Calculate prices ── */
    const oldPrice = oldItem.price || 0;
    const newPrice = newProduct.discountPrice || newProduct.price || 0;
    const priceDifference = newPrice - oldPrice;
    // positive = customer pays extra | negative = we refund difference | 0 = same price

    /* ── Create Exchange record ── */
    const exchange = await prisma.exchange.create({
      data: {
        orderId,
        userId: order.userId,

        oldProductId,
        oldProductName:  oldItem.name,
        oldProductImage: oldItem.image,
        oldPrice,
        oldQuantity:     oldItem.quantity || 1,

        newProductId:    newProduct.id,
        newProductName:  newProduct.name,
        newProductImage: newProduct.images?.[0]?.url || null,
        newPrice,
        newQuantity:     1,

        priceDifference,

        reason,
        description: description || null,
        images,

        status: 'pending',
        paymentStatus: priceDifference > 0 ? 'pending' : null,
      },
    });

    /* ── Handle price difference ── */
    let paymentLinkUrl = null;

    // 💰 Customer needs to pay extra → create payment link
    if (priceDifference > 0) {
      try {
        const paymentLink = await razorpay.paymentLink.create({
          amount: Math.round(priceDifference * 100),
          currency: 'INR',
          accept_partial: false,
          description: `Exchange fee — Order #${orderId.slice(-8).toUpperCase()}`,
          customer: {
            name:    order.user.name || 'Customer',
            email:   order.user.email,
            contact: order.shippingAddress?.phone || '',
          },
          notify: { sms: true, email: true },
          reminder_enable: true,
          notes: {
            exchange_id: exchange.id,
            order_id: orderId,
            type: 'exchange_price_difference',
          },
          callback_url:    `${process.env.NEXTAUTH_URL}/orders/${orderId}`,
          callback_method: 'get',
        });

        paymentLinkUrl = paymentLink.short_url;

        await prisma.exchange.update({
          where: { id: exchange.id },
          data: {
            paymentLinkId:  paymentLink.id,
            paymentLinkUrl: paymentLink.short_url,
          },
        });
      } catch (plErr) {
        console.error('❌ Payment link creation failed:', plErr);
      }
    }

    // 💸 New product is cheaper → auto-refund difference via Razorpay
    if (priceDifference < 0 && order.paymentMethod === 'Razorpay' && order.paymentResult?.razorpayPaymentId) {
      try {
        const refundAmount = Math.abs(priceDifference);
        const refundResult = await createRefund(
          order.paymentResult.razorpayPaymentId,
          refundAmount,
          {
            reason: 'Exchange price difference refund',
            orderId,
          }
        );

        if (refundResult.success) {
          await prisma.exchange.update({
            where: { id: exchange.id },
            data: {
              razorpayRefundId: refundResult.refund.id,
              refundAmount,
              refundedAt: new Date(),
            },
          });
        }
      } catch (refErr) {
        console.error('❌ Auto-refund failed:', refErr);
      }
    }

    /* ── Update Order ── */
    await prisma.order.update({
      where: { id: orderId },
      data: {
        exchangeId:     exchange.id,
        exchangeStatus: 'pending',
      },
    });

    /* ── Send emails (non-blocking) ── */
    const customerEmail = order.user?.email || session.user.email;
    const customerName  = order.user?.name  || session.user.name;

    Promise.allSettled([
      sendExchangeRequestConfirmation(
        exchange, order, customerEmail, customerName, paymentLinkUrl
      ).catch(e => console.error('❌ Customer exchange email:', e)),

      sendAdminExchangeNotification(
        exchange, order, { name: customerName, email: customerEmail }
      ).catch(e => console.error('❌ Admin exchange email:', e)),
    ]);

    /* ── Response ── */
    return NextResponse.json({
      success: true,
      message: 'Exchange request submitted successfully',
      exchange,
      paymentLink: paymentLinkUrl,
      priceDifference,
      requiresPayment: priceDifference > 0,
      autoRefunded: priceDifference < 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Exchange POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}