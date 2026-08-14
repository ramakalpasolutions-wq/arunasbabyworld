import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date required' }, { status: 400 });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // ✅ Fetch paid orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        isPaid: true,
        orderStatus: { not: 'Cancelled' },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // ✅ Fetch company settings for GSTIN
    let company = await prisma.companySettings.findFirst();

    // ✅ Calculate totals
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalAmount = 0;
    let totalOrders = orders.length;

    const companyState = (company?.state || 'Andhra Pradesh').toLowerCase();

    const reportData = orders.map(order => {
      const total      = Math.round(order.totalPrice || 0);
      const shipping   = Math.round(order.shippingPrice || 0);
      const discount   = Math.round(order.discountAmount || 0);
      const itemsTotal = Math.round(order.itemsPrice || 0);

      // GST is inclusive — reverse calculate
      // Assuming 5% GST (change if different)
      const gstRate     = 5;
      const taxable     = Math.round((total * 100) / (100 + gstRate));
      const totalGST    = total - taxable;

      const customerState = (order.shippingAddress?.state || '').toLowerCase();
      const isIntraState  = customerState === companyState;

      const cgst = isIntraState ? Math.round(totalGST / 2) : 0;
      const sgst = isIntraState ? Math.round(totalGST / 2) : 0;
      const igst = isIntraState ? 0 : totalGST;

      totalTaxable += taxable;
      totalCGST    += cgst;
      totalSGST    += sgst;
      totalIGST    += igst;
      totalAmount  += total;

      return {
        invoiceNo:    order.orderNumber ? `ABW-${order.orderNumber}` : `#${order.id?.slice(-8).toUpperCase()}`,
        date:         new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        customerName: order.user?.name || order.shippingAddress?.name || 'Customer',
        customerPhone: order.shippingAddress?.phone || '',
        customerState: order.shippingAddress?.state || '',
        customerCity:  order.shippingAddress?.city || '',
        paymentMethod: order.paymentMethod || '',
        items:         order.orderItems?.length || 0,
        itemsPrice:    itemsTotal,
        shipping:      shipping,
        discount:      discount,
        taxableValue:  taxable,
        gstRate:       gstRate,
        cgst:          cgst,
        sgst:          sgst,
        igst:          igst,
        totalAmount:   total,
        isIntraState:  isIntraState,
        orderId:       order.id,
        isPaid:        order.isPaid,
        paidAt:        order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '',
        transactionId: order.paymentResult?.razorpayPaymentId || '',
      };
    });

    return NextResponse.json({
      success: true,
      report: reportData,
      summary: {
        totalOrders,
        totalTaxable,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST: totalCGST + totalSGST + totalIGST,
        totalAmount,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        gstRate: 5,
        companyGSTIN: company?.gstin || company?.gstNumber || '',
        companyName: company?.companyName || 'Arunas Baby World',
        companyState: company?.state || 'Andhra Pradesh',
      },
    });

  } catch (error) {
    console.error('GST Report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}