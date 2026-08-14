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
  gstin:   '37CCAPB6572Q3Z3',
  logoUrl: '/logo.png',  // ✅ from /public/logo.png
};

// ✅ Sky Blue + Cyan Theme
const COLORS = {
  primary:      [56, 189, 248],    // Sky Blue #38BDF8
  primaryDark:  [3, 105, 161],     // Deep Sky #0369A1
  secondary:    [14, 116, 144],    // Cyan Dark #0E7490
  accent:       [125, 211, 252],   // Light Sky #7DD3FC
  dark:         [15, 23, 42],      // Slate 900
  gray:         [100, 116, 139],   // Slate 500
  lightGray:    [241, 245, 249],   // Slate 100
  bgLight:      [240, 249, 255],   // Sky 50
  green:        [16, 185, 129],
  red:          [239, 68, 68],
  amber:        [245, 158, 11],
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

// ✅ Load logo as base64
async function loadLogoBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Logo load error:', err);
    return null;
  }
}

export async function generateInvoice(order) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // ═══════════════════════════════════
  // HEADER — Sky Blue Banner with Logo
  // ═══════════════════════════════════
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Decorative cyan strip at bottom of header
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 47, pageWidth, 3, 'F');

  // ✅ Load and add logo
  try {
    const logoBase64 = await loadLogoBase64(COMPANY_INFO.logoUrl);
    if (logoBase64) {
      // White circle background for logo
      doc.setFillColor(255, 255, 255);
      doc.circle(24, 24, 12, 'F');

      // Add logo inside circle
      doc.addImage(logoBase64, 'PNG', 14, 14, 20, 20);
    }
  } catch (err) {
    console.error('Logo error:', err);
  }

  // Company info (right of logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 42, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 42, 26);
  doc.text(COMPANY_INFO.city, 42, 30);
  doc.text(`Phone: ${COMPANY_INFO.phone}`, 42, 34);
  doc.text(`Email: ${COMPANY_INFO.email}`, 42, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`GSTIN: ${COMPANY_INFO.gstin}`, 42, 43);

  // Invoice label (right side)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 14, 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${fmtOrderNum(order)}`, pageWidth - 14, 30, { align: 'right' });
  doc.text(`Date: ${fmtDate(order.createdAt)}`, pageWidth - 14, 35, { align: 'right' });
  if (order.isPaid && order.paidAt) {
    doc.text(`Paid on: ${fmtDate(order.paidAt)}`, pageWidth - 14, 40, { align: 'right' });
  }

  y = 60;

  // ═══════════════════════════════════
  // STATUS BADGES
  // ═══════════════════════════════════
  const statusColor = order.isCancelled
    ? COLORS.red
    : order.isPaid
      ? COLORS.green
      : COLORS.amber;

  const statusText = order.isCancelled
    ? 'CANCELLED'
    : order.isPaid
      ? 'PAID'
      : 'PAYMENT PENDING';

  doc.setFillColor(...statusColor);
  doc.roundedRect(14, y, 42, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, 35, y + 5.5, { align: 'center' });

  // Payment method badge (Cyan Dark)
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(60, y, 42, 8, 2, 2, 'F');
  doc.text(order.paymentMethod || 'N/A', 81, y + 5.5, { align: 'center' });

  y += 15;

  // ═══════════════════════════════════
  // BILL TO / SHIP TO
  // ═══════════════════════════════════
  const address = order.shippingAddress || {};

  // Bill To
  doc.setTextColor(...COLORS.secondary);
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
  doc.setTextColor(...COLORS.secondary);
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
      lineColor: COLORS.primaryDark,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize:  9,
      textColor: COLORS.dark,
      lineColor: COLORS.lightGray,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left',   cellWidth: 90 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right',  cellWidth: 30 },
      4: { halign: 'right',  cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: COLORS.bgLight,
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ═══════════════════════════════════
  // TOTALS SECTION — Light Sky Card
  // ═══════════════════════════════════
  const totalsX = pageWidth - 90;
  const totalsWidth = 76;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(totalsX, y, totalsWidth, 45, 3, 3, 'FD');

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

  if (order.shippingPrice === 0) {
    doc.setTextColor(...COLORS.green);
    doc.text('FREE', totalsX + totalsWidth - 4, y, { align: 'right' });
  } else {
    doc.setTextColor(...COLORS.dark);
    doc.text(fmtAmount(order.shippingPrice), totalsX + totalsWidth - 4, y, { align: 'right' });
  }

  y += 6;

  // Discount
  if (order.discountAmount > 0) {
    doc.setTextColor(...COLORS.gray);
    doc.text(`Discount ${order.couponCode ? `(${order.couponCode})` : ''}:`, totalsX + 4, y);
    doc.setTextColor(...COLORS.green);
    doc.text(`- ${fmtAmount(order.discountAmount)}`, totalsX + totalsWidth - 4, y, { align: 'right' });
    y += 6;
  }

  // Divider line (primary color)
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.4);
  doc.line(totalsX + 4, y, totalsX + totalsWidth - 4, y);
  y += 6;

  // Grand Total
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX + 4, y);
  doc.setTextColor(...COLORS.primaryDark);
  doc.setFontSize(14);
  doc.text(fmtAmount(order.totalPrice), totalsX + totalsWidth - 4, y, { align: 'right' });

  y += 12;

  // ═══════════════════════════════════
  // PAYMENT INFO (if paid) — Green success card
  // ═══════════════════════════════════
  if (order.isPaid && order.paymentResult?.razorpayPaymentId) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(...COLORS.green);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, y, pageWidth - 28, 18, 3, 3, 'FD');

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
  // TRACKING INFO (if shipped) — Sky Blue Card
  // ═══════════════════════════════════
  if (order.awbNumber || order.trackingNumber) {
    doc.setFillColor(...COLORS.bgLight);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, y, pageWidth - 28, 16, 3, 3, 'FD');

    doc.setTextColor(...COLORS.primaryDark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPMENT TRACKING', 18, y + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    doc.text(`AWB: ${order.awbNumber || order.trackingNumber}`, 18, y + 11);

    if (order.courierName) {
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.text(`Via: ${order.courierName}`, pageWidth - 18, y + 11, { align: 'right' });
    }

    y += 22;
  }

  // ═══════════════════════════════════
  // GST NOTE — Compliance line
  // ═══════════════════════════════════
  doc.setFillColor(...COLORS.lightGray);
  doc.setDrawColor(...COLORS.gray);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, 'FD');

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('GST Registration: ' + COMPANY_INFO.gstin, 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text('Prices are inclusive of applicable taxes | This is a valid GST invoice', 18, y + 9);

  y += 18;

  // ═══════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════
  const footerY = pageHeight - 25;

  // Sky blue bottom accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

  doc.setDrawColor(...COLORS.lightGray);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for shopping with us!', pageWidth / 2, footerY + 6, { align: 'center' });

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `This is a computer-generated invoice. For queries: ${COMPANY_INFO.email}`,
    pageWidth / 2, footerY + 11, { align: 'center' }
  );
  doc.text(
    `${COMPANY_INFO.name} © ${new Date().getFullYear()} | GSTIN: ${COMPANY_INFO.gstin}`,
    pageWidth / 2, footerY + 16, { align: 'center' }
  );

  // ═══════════════════════════════════
  // DOWNLOAD
  // ═══════════════════════════════════
  const filename = `Invoice_${fmtOrderNum(order).replace('#', '')}.pdf`;
  doc.save(filename);

  return filename;
}