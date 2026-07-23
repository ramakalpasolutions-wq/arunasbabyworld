// src/lib/invoiceGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_INFO = {
  name:    'Arunas Baby World',
  address: 'Koritipadu, Guntur',
  city:    'Andhra Pradesh — 522007',
  phone:   '+91 9010561998',
  email:   'arunasbabyworld947@gmail.com',
  website: 'www.arunasbabyworld.com',
  gstin:   '',
};

const COLORS = {
  primary:   [255, 107, 157],
  secondary: [123, 47, 190],
  dark:      [45, 26, 74],
  gray:      [107, 114, 128],
  lightGray: [243, 244, 246],
  green:     [16, 185, 129],
  red:       [239, 68, 68],
};

function fmtOrderNum(order) {
  return order?.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order?.id?.slice(-8)?.toUpperCase()}`;
}

function fmtDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtAmount(n) {
  return `Rs. ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
}

export function generateInvoice(order) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // ═══════════════════════════════════
  // HEADER — Company + Invoice Info
  // ═══════════════════════════════════
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 14, 27);
  doc.text(COMPANY_INFO.city, 14, 32);
  doc.text(`Phone: ${COMPANY_INFO.phone}`, 14, 37);
  doc.text(`Email: ${COMPANY_INFO.email}`, 14, 42);

  // Invoice label (right side)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 14, 22, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${fmtOrderNum(order)}`, pageWidth - 14, 30, { align: 'right' });
  doc.text(`Date: ${fmtDate(order.createdAt)}`, pageWidth - 14, 36, { align: 'right' });
  if (order.isPaid && order.paidAt) {
    doc.text(`Paid on: ${fmtDate(order.paidAt)}`, pageWidth - 14, 42, { align: 'right' });
  }

  y = 55;

  // ═══════════════════════════════════
  // STATUS BADGE
  // ═══════════════════════════════════
  const statusColor = order.isCancelled
    ? COLORS.red
    : order.isPaid
      ? COLORS.green
      : [245, 158, 11];

  const statusText = order.isCancelled
    ? 'CANCELLED'
    : order.isPaid
      ? 'PAID'
      : 'PAYMENT PENDING';

  doc.setFillColor(...statusColor);
  doc.roundedRect(14, y, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, 34, y + 5.5, { align: 'center' });

  // Payment method badge
  doc.setFillColor(...COLORS.dark);
  doc.roundedRect(58, y, 40, 8, 2, 2, 'F');
  doc.text(order.paymentMethod || 'N/A', 78, y + 5.5, { align: 'center' });

  y += 15;

  // ═══════════════════════════════════
  // BILL TO / SHIP TO
  // ═══════════════════════════════════
  const address = order.shippingAddress || {};

  // Bill To
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 14, y);

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.text(order.user?.name || address.name || 'Customer', 14, y + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  if (order.user?.email) doc.text(order.user.email, 14, y + 11);
  if (address.phone)     doc.text(`Phone: ${address.phone}`, 14, y + 16);

  // Ship To
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIP TO', pageWidth / 2 + 5, y);

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.text(address.name || 'Customer', pageWidth / 2 + 5, y + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);

  const addrLine1 = address.address || '';
  const addrLine2 = `${address.city || ''}, ${address.state || ''}`;
  const addrLine3 = `Pincode: ${address.pincode || ''}`;

  // Wrap address if too long
  const wrappedAddr = doc.splitTextToSize(addrLine1, 85);
  doc.text(wrappedAddr, pageWidth / 2 + 5, y + 11);
  doc.text(addrLine2, pageWidth / 2 + 5, y + 11 + (wrappedAddr.length * 4));
  doc.text(addrLine3, pageWidth / 2 + 5, y + 15 + (wrappedAddr.length * 4));

  y += 35;

  // ═══════════════════════════════════
  // ITEMS TABLE
  // ═══════════════════════════════════
  const tableRows = (order.orderItems || []).map((item, i) => [
    (i + 1).toString(),
    item.name || 'Product',
    (item.quantity || 1).toString(),
    fmtAmount(item.price),
    fmtAmount((item.price || 0) * (item.quantity || 1)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Product', 'Qty', 'Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor:  COLORS.primary,
      textColor:  [255, 255, 255],
      fontSize:   10,
      fontStyle: 'bold',
      halign:    'center',
    },
    bodyStyles: {
      fontSize:  9,
      textColor: COLORS.dark,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left',   cellWidth: 90 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right',  cellWidth: 30 },
      4: { halign: 'right',  cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ═══════════════════════════════════
  // TOTALS SECTION
  // ═══════════════════════════════════
  const totalsX = pageWidth - 90;
  const totalsWidth = 76;

  doc.setDrawColor(...COLORS.lightGray);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(totalsX, y, totalsWidth, 45, 2, 2, 'FD');

  y += 7;

  // Items subtotal
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Items Subtotal:', totalsX + 4, y);
  doc.setTextColor(...COLORS.dark);
  doc.text(fmtAmount(order.itemsPrice), totalsX + totalsWidth - 4, y, { align: 'right' });

  y += 6;

  // Shipping
  doc.setTextColor(...COLORS.gray);
  doc.text('Shipping:', totalsX + 4, y);
  doc.setTextColor(order.shippingPrice === 0 ? COLORS.green[0] : COLORS.dark[0],
                   order.shippingPrice === 0 ? COLORS.green[1] : COLORS.dark[1],
                   order.shippingPrice === 0 ? COLORS.green[2] : COLORS.dark[2]);
  doc.text(
    order.shippingPrice === 0 ? 'FREE' : fmtAmount(order.shippingPrice),
    totalsX + totalsWidth - 4, y, { align: 'right' }
  );

  y += 6;

  // Discount
  if (order.discountAmount > 0) {
    doc.setTextColor(...COLORS.gray);
    doc.text(`Discount ${order.couponCode ? `(${order.couponCode})` : ''}:`, totalsX + 4, y);
    doc.setTextColor(...COLORS.green);
    doc.text(`- ${fmtAmount(order.discountAmount)}`, totalsX + totalsWidth - 4, y, { align: 'right' });
    y += 6;
  }

  // Divider
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(totalsX + 4, y, totalsX + totalsWidth - 4, y);
  y += 6;

  // Grand Total
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX + 4, y);
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(14);
  doc.text(fmtAmount(order.totalPrice), totalsX + totalsWidth - 4, y, { align: 'right' });

  y += 12;

  // ═══════════════════════════════════
  // PAYMENT INFO (if paid)
  // ═══════════════════════════════════
  if (order.isPaid && order.paymentResult?.razorpayPaymentId) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(...COLORS.green);
    doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

    doc.setTextColor(...COLORS.green);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 18, y + 6);

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Transaction ID: ${order.paymentResult.razorpayPaymentId}`, 18, y + 11);
    doc.text(`Payment Method: ${order.paymentMethod}`, 18, y + 15);

    y += 24;
  }

  // ═══════════════════════════════════
  // TRACKING INFO (if shipped)
  // ═══════════════════════════════════
  if (order.awbNumber || order.trackingNumber) {
    doc.setFillColor(224, 242, 254);
    doc.setDrawColor(3, 105, 161);
    doc.roundedRect(14, y, pageWidth - 28, 15, 2, 2, 'FD');

    doc.setTextColor(3, 105, 161);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tracking: ${order.awbNumber || order.trackingNumber}`, 18, y + 6);

    if (order.courierName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Via: ${order.courierName}`, 18, y + 11);
    }

    y += 20;
  }

  // ═══════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════
  const footerY = pageHeight - 25;

  doc.setDrawColor(...COLORS.lightGray);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for shopping with us!', pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text(
    `This is a computer-generated invoice. For queries: ${COMPANY_INFO.email}`,
    pageWidth / 2, footerY + 11, { align: 'center' }
  );
  doc.text(
    `${COMPANY_INFO.name} © ${new Date().getFullYear()}`,
    pageWidth / 2, footerY + 16, { align: 'center' }
  );

  // ═══════════════════════════════════
  // DOWNLOAD
  // ═══════════════════════════════════
  const filename = `Invoice_${fmtOrderNum(order).replace('#', '')}.pdf`;
  doc.save(filename);

  return filename;
}