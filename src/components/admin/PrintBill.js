'use client';
import { useEffect, useState, useRef } from 'react';

function fmtOrderNum(order) {
  return order?.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order?.id?.slice(-8)?.toUpperCase()}`;
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    return '';
  }

  let words = '';
  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) words += convert(crore) + ' Crore ';
  if (lakh) words += convert(lakh) + ' Lakh ';
  if (thousand) words += convert(thousand) + ' Thousand ';
  if (num) words += convert(num);
  return words.trim();
}

export default function PrintBill({ order, onClose }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef(null);

  useEffect(() => {
    fetch('/api/company-settings')
      .then(r => r.json())
      .then(d => { setCompany(d.settings); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handlePrint = () => {
    // Give browser a tick so styles are applied
    setTimeout(() => window.print(), 100);
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: 'white', fontWeight: 800, fontFamily: 'Nunito, sans-serif' }}>Loading invoice...</p>
      </div>
    );
  }

  const subtotal = order.itemsPrice || 0;
  const shipping = order.shippingPrice || 0;
  const discount = order.discountAmount || 0;
  const tax = order.taxPrice || 0;
  const total = order.totalPrice || 0;
  const invoiceNumber = `${company?.invoicePrefix || 'INV'}-${order.orderNumber || order.id?.slice(-6).toUpperCase()}`;

  return (
    <>
      {/* SCREEN-ONLY OVERLAY CONTROLS */}
      <div className="printbill-overlay no-print">
        <div className="printbill-toolbar no-print">
          <button type="button" onClick={handlePrint} className="printbill-btn print">
            🖨️ Print Invoice
          </button>
          <button type="button" onClick={onClose} className="printbill-btn close">
            ✕ Close
          </button>
        </div>

        <div className="printbill-preview-wrap no-print">
          <div ref={invoiceRef} id="printable-invoice" className="a5-invoice">
            <InvoiceBody
              order={order}
              company={company}
              invoiceNumber={invoiceNumber}
              subtotal={subtotal}
              shipping={shipping}
              discount={discount}
              tax={tax}
              total={total}
            />
          </div>
        </div>
      </div>

      {/* PRINT-ONLY COPY (always in DOM, only visible when printing) */}
      <div id="print-root" className="print-only">
        <div className="a5-invoice">
          <InvoiceBody
            order={order}
            company={company}
            invoiceNumber={invoiceNumber}
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            tax={tax}
            total={total}
          />
        </div>
      </div>

      <style jsx global>{`
        /* ========== SCREEN ========== */
        .printbill-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          z-index: 99999;
          overflow-y: auto;
          padding: 80px 20px 40px;
        }
        .printbill-toolbar {
          position: fixed;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 10px;
          z-index: 100000;
        }
        .printbill-btn {
          padding: 12px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          font-family: Nunito, sans-serif;
          border: none;
        }
        .printbill-btn.print {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          box-shadow: 0 4px 14px rgba(16,185,129,0.35);
        }
        .printbill-btn.close {
          background: white;
          color: #DC2626;
          border: 2px solid #FCA5A5;
        }
        .printbill-preview-wrap {
          display: flex;
          justify-content: center;
        }
        .print-only {
          display: none;
        }
        .a5-invoice {
          width: 148mm;
          min-height: 210mm;
          background: #ffffff;
          padding: 10mm;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          color: #000000;
          font-family: Helvetica, Arial, sans-serif;
          font-size: 10px;
          line-height: 1.4;
        }

        /* ========== PRINT ========== */
        @media print {
          @page {
            size: A5 portrait;
            margin: 8mm;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide EVERYTHING by default */
          body * {
            visibility: hidden !important;
          }

          /* Hide screen overlay completely */
          .printbill-overlay,
          .printbill-overlay *,
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }

          /* Show ONLY print root + children */
          #print-root,
          #print-root * {
            visibility: visible !important;
          }

          #print-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          #print-root .a5-invoice {
            display: block !important;
            width: 100% !important;
            min-height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }

          /* Keep table header black */
          #print-root table thead tr,
          #print-root table thead th {
            background: #000000 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #print-root table td,
          #print-root table th {
            border-color: #000000 !important;
          }

          /* Avoid clipping images */
          #print-root img {
            max-width: 55px !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Hide common admin chrome if present */
          nav, aside, header, footer,
          [class*="sidebar"], [class*="Sidebar"],
          [class*="AdminSidebar"], [class*="admin-sidebar"] {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════
   INVOICE BODY (shared screen + print)
═══════════════════════════════════════ */
function InvoiceBody({ order, company, invoiceNumber, subtotal, shipping, discount, tax, total }) {
  return (
    <>
      {/* HEADER */}
      <div style={{
        borderBottom: '2px solid #000',
        paddingBottom: '8px',
        marginBottom: '10px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        {company?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoUrl}
            alt="Logo"
            style={{ width: '55px', height: '55px', objectFit: 'contain', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, textAlign: company?.logoUrl ? 'left' : 'center' }}>
          <h1 style={{
            margin: 0, fontSize: '18px', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.5px', color: '#000',
          }}>
            {company?.companyName || 'Arunas Baby World'}
          </h1>
          {company?.tagline && (
            <p style={{ margin: '2px 0 0', fontSize: '9px', fontStyle: 'italic', color: '#000' }}>
              {company.tagline}
            </p>
          )}
          <div style={{ marginTop: '4px', fontSize: '9px', lineHeight: 1.5, color: '#000' }}>
            {company?.address && <div>{company.address}</div>}
            {(company?.city || company?.state) && (
              <div>
                {company.city}{company.city && company.state && ', '}{company.state}
                {company.pincode && ` - ${company.pincode}`}
              </div>
            )}
            {company?.phone && <div>Ph: {company.phone}{company.altPhone && ` | ${company.altPhone}`}</div>}
            {company?.email && <div>Email: {company.email}</div>}
            {company?.website && <div>Web: {company.website}</div>}
            {(company?.gstNumber || company?.gstin || company?.panNumber) && (
              <div style={{ marginTop: '3px', fontWeight: 'bold' }}>
                {(company.gstNumber || company.gstin) && (
                  <span>GSTIN: {company.gstNumber || company.gstin}</span>
                )}
                {(company.gstNumber || company.gstin) && company.panNumber && <span> | </span>}
                {company.panNumber && <span>PAN: {company.panNumber}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TITLE */}
      <div style={{
        textAlign: 'center',
        padding: '4px',
        border: '1px solid #000',
        margin: '8px 0',
        fontSize: '13px',
        fontWeight: 900,
        letterSpacing: '2px',
        color: '#000',
        background: '#fff',
      }}>
        TAX INVOICE
      </div>

      {/* BILL TO + DETAILS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '10px',
      }}>
        <div style={{ border: '1px solid #000', padding: '6px 8px', background: '#fff', color: '#000' }}>
          <div style={{
            fontSize: '9px', fontWeight: 900,
            borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px',
          }}>
            BILL TO:
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
            {order.shippingAddress?.name || order.user?.name || 'Customer'}
          </div>
          <div style={{ fontSize: '9px', marginTop: '2px', lineHeight: 1.5 }}>
            {order.shippingAddress?.address && <>{order.shippingAddress.address}<br /></>}
            {(order.shippingAddress?.city || order.shippingAddress?.state) && (
              <>
                {order.shippingAddress?.city}
                {order.shippingAddress?.city && order.shippingAddress?.state && ', '}
                {order.shippingAddress?.state}
                <br />
              </>
            )}
            {order.shippingAddress?.pincode && <>{order.shippingAddress.pincode}<br /></>}
            {order.shippingAddress?.phone && <>Ph: {order.shippingAddress.phone}<br /></>}
            {order.user?.email && <>Email: {order.user.email}</>}
          </div>
        </div>

        <div style={{ border: '1px solid #000', padding: '6px 8px', background: '#fff', color: '#000' }}>
          <div style={{
            fontSize: '9px', fontWeight: 900,
            borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px',
          }}>
            INVOICE DETAILS:
          </div>
          <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', color: '#000' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>Invoice No:</td>
                <td style={{ padding: '2px 0', textAlign: 'right', fontFamily: 'monospace' }}>{invoiceNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>Order No:</td>
                <td style={{ padding: '2px 0', textAlign: 'right', fontFamily: 'monospace' }}>{fmtOrderNum(order)}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>Date:</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>Payment:</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>
                  {order.paymentMethod || 'Cash'}
                  {order.isPaid ? ' (Paid)' : ''}
                </td>
              </tr>
              {order.paymentResult?.razorpayPaymentId && (
                <tr>
                  <td style={{ padding: '2px 0', fontWeight: 'bold' }}>Txn ID:</td>
                  <td style={{ padding: '2px 0', textAlign: 'right', fontFamily: 'monospace', fontSize: '8px' }}>
                    {order.paymentResult.razorpayPaymentId.slice(-14)}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>Status:</td>
                <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>
                  {order.orderStatus}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ITEMS */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '9px',
        marginBottom: '10px',
        color: '#000',
      }}>
        <thead>
          <tr>
            <th style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000', width: '22px', background: '#000', color: '#fff' }}>#</th>
            <th style={{ padding: '5px 4px', textAlign: 'left', border: '1px solid #000', background: '#000', color: '#fff' }}>Item Description</th>
            <th style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000', width: '30px', background: '#000', color: '#fff' }}>Qty</th>
            <th style={{ padding: '5px 4px', textAlign: 'right', border: '1px solid #000', width: '55px', background: '#000', color: '#fff' }}>Rate</th>
            <th style={{ padding: '5px 4px', textAlign: 'right', border: '1px solid #000', width: '55px', background: '#000', color: '#fff' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(order.orderItems || []).map((item, i) => (
            <tr key={i}>
              <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center', background: '#fff', color: '#000' }}>{i + 1}</td>
              <td style={{ padding: '4px', border: '1px solid #000', background: '#fff', color: '#000' }}>{item.name}</td>
              <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center', background: '#fff', color: '#000' }}>{item.quantity}</td>
              <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right', background: '#fff', color: '#000' }}>
                ₹{Number(item.price || 0).toLocaleString('en-IN')}
              </td>
              <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', background: '#fff', color: '#000' }}>
                ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
          {(order.orderItems?.length || 0) < 5 &&
            [...Array(5 - (order.orderItems?.length || 0))].map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ padding: '4px', border: '1px solid #000', height: '18px', background: '#fff' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000', background: '#fff' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000', background: '#fff' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000', background: '#fff' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000', background: '#fff' }}>&nbsp;</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '10px',
      }}>
        <div style={{ border: '1px solid #000', padding: '6px 8px', fontSize: '9px', background: '#fff', color: '#000' }}>
          <div style={{ fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>
            PAYMENT INFORMATION
          </div>
          {order.paymentMethod === 'COD' ? (
            <div>
              <strong>Cash on Delivery</strong><br />
              Please pay ₹{Math.round(total).toLocaleString('en-IN')} on delivery
            </div>
          ) : order.isPaid ? (
            <div>
              <strong>Payment Received</strong><br />
              Method: {order.paymentMethod}<br />
              {order.paidAt && `Paid on: ${new Date(order.paidAt).toLocaleDateString('en-IN')}`}
            </div>
          ) : (
            <div>Payment Pending</div>
          )}

          {(company?.bankName || company?.accountNumber || company?.accountNo || company?.upiId) && (
            <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #666' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Bank Details:</div>
              {company.bankName && <div>Bank: {company.bankName}</div>}
              {(company.accountNumber || company.accountNo) && (
                <div>A/C: {company.accountNumber || company.accountNo}</div>
              )}
              {company.ifscCode && <div>IFSC: {company.ifscCode}</div>}
              {company.upiId && <div>UPI: {company.upiId}</div>}
            </div>
          )}
        </div>

        <div style={{ border: '1px solid #000', padding: '6px 8px', fontSize: '9px', background: '#fff', color: '#000' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0' }}>Subtotal:</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                  ₹{Math.round(subtotal).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0' }}>Shipping:</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                  {shipping === 0 ? 'FREE' : `₹${Math.round(shipping).toLocaleString('en-IN')}`}
                </td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td style={{ padding: '3px 0' }}>
                    Discount{order.couponCode ? ` (${order.couponCode})` : ''}:
                  </td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                    - ₹{Math.round(discount).toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
              {tax > 0 && (
                <tr>
                  <td style={{ padding: '3px 0' }}>Tax:</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                    ₹{Math.round(tax).toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
              <tr style={{ borderTop: '1px solid #000' }}>
                <td style={{ padding: '4px 0', fontWeight: 900, fontSize: '11px' }}>GRAND TOTAL:</td>
                <td style={{
                  padding: '4px 0', textAlign: 'right',
                  fontFamily: 'monospace', fontWeight: 900, fontSize: '13px',
                }}>
                  ₹{Math.round(total).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{
            marginTop: '6px',
            paddingTop: '4px',
            borderTop: '1px dashed #666',
            fontSize: '8px',
            fontStyle: 'italic',
          }}>
            <strong>In Words:</strong> {numberToWords(Math.round(total))} Rupees Only
          </div>
        </div>
      </div>

      {/* TERMS */}
      {company?.termsAndConditions && (
        <div style={{
          border: '1px solid #000',
          padding: '6px 8px',
          fontSize: '8px',
          marginBottom: '8px',
          background: '#fff',
          color: '#000',
        }}>
          <div style={{ fontWeight: 900, marginBottom: '3px', fontSize: '9px' }}>
            TERMS & CONDITIONS:
          </div>
          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.4 }}>
            {company.termsAndConditions}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{
        marginTop: '10px',
        borderTop: '2px solid #000',
        paddingTop: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        fontSize: '9px',
        color: '#000',
        background: '#fff',
      }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>Customer Signature</div>
          <div style={{ borderTop: '1px solid #000', width: '100px' }} />
        </div>

        <div style={{ textAlign: 'center', flex: 1, fontSize: '9px', fontStyle: 'italic' }}>
          {company?.invoiceFooter || 'Thank you for your business!'}
          <br />
          <span style={{ fontSize: '7px' }}>This is a computer-generated invoice</span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>Authorized Signatory</div>
          <div style={{ borderTop: '1px solid #000', width: '100px', marginLeft: 'auto' }} />
          <div style={{ fontSize: '8px', marginTop: '2px' }}>
            For {company?.companyName || 'Arunas Baby World'}
          </div>
        </div>
      </div>
    </>
  );
}