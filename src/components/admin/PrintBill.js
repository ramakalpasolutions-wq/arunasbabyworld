'use client';
import { useEffect, useState } from 'react';

function fmtOrderNum(order) {
  return order?.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order?.id?.slice(-8)?.toUpperCase()}`;
}

export default function PrintBill({ order, onClose }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/company-settings')
      .then(r => r.json())
      .then(d => { setCompany(d.settings); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return null;

  const subtotal = order.itemsPrice || 0;
  const shipping = order.shippingPrice || 0;
  const discount = order.discountAmount || 0;
  const tax = order.taxPrice || 0;
  const total = order.totalPrice || 0;

  const invoiceNumber = `${company?.invoicePrefix || 'INV'}-${order.orderNumber || order.id?.slice(-6).toUpperCase()}`;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', overflowY: 'auto',
    }} className="print-modal-overlay">

      {/* Modal Controls (hidden on print) */}
      <div style={{
        position: 'fixed', top: '20px', right: '20px',
        display: 'flex', gap: '10px', zIndex: 10000,
      }} className="no-print">
        <button
          onClick={handlePrint}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '800', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          🖨️ Print
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '12px 20px',
            background: 'white', color: '#DC2626',
            border: '2px solid #FCA5A5', borderRadius: '10px',
            fontSize: '14px', fontWeight: '800', cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* A5 Invoice */}
      <div className="a5-invoice" style={{
        width: '148mm',
        minHeight: '210mm',
        background: 'white',
        padding: '10mm',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        color: '#000',
        fontFamily: '"Helvetica", "Arial", sans-serif',
        fontSize: '10px',
        lineHeight: 1.4,
        margin: '0 auto',
      }}>

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
            <img
              src={company.logoUrl}
              alt="Logo"
              style={{
                width: '55px', height: '55px', objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, textAlign: company?.logoUrl ? 'left' : 'center' }}>
            <h1 style={{
              margin: 0, fontSize: '18px', fontWeight: '900',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {company?.companyName || 'Arunas Baby World'}
            </h1>
            {company?.tagline && (
              <p style={{ margin: '2px 0 0', fontSize: '9px', fontStyle: 'italic' }}>
                {company.tagline}
              </p>
            )}
            <div style={{ marginTop: '4px', fontSize: '9px', lineHeight: 1.5 }}>
              {company?.address && <div>{company.address}</div>}
              {(company?.city || company?.state) && (
                <div>
                  {company.city}{company.city && company.state && ', '}{company.state}
                  {company.pincode && ` - ${company.pincode}`}
                </div>
              )}
              {company?.phone && <div>📞 {company.phone}{company.altPhone && ` | ${company.altPhone}`}</div>}
              {company?.email && <div>✉️ {company.email}</div>}
              {company?.website && <div>🌐 {company.website}</div>}
              {(company?.gstNumber || company?.panNumber) && (
                <div style={{ marginTop: '3px', fontWeight: 'bold' }}>
                  {company.gstNumber && <span>GSTIN: {company.gstNumber}</span>}
                  {company.gstNumber && company.panNumber && <span> | </span>}
                  {company.panNumber && <span>PAN: {company.panNumber}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INVOICE TITLE */}
        <div style={{
          textAlign: 'center',
          padding: '4px',
          border: '1px solid #000',
          margin: '8px 0',
          fontSize: '13px',
          fontWeight: '900',
          letterSpacing: '2px',
        }}>
          TAX INVOICE
        </div>

        {/* INVOICE + CUSTOMER INFO */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '10px',
        }}>
          {/* Bill To */}
          <div style={{
            border: '1px solid #000',
            padding: '6px 8px',
          }}>
            <div style={{
              fontSize: '9px', fontWeight: '900',
              borderBottom: '1px solid #000', paddingBottom: '2px',
              marginBottom: '4px',
            }}>
              BILL TO:
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
              {order.shippingAddress?.name || 'Customer'}
            </div>
            <div style={{ fontSize: '9px', marginTop: '2px', lineHeight: 1.5 }}>
              {order.shippingAddress?.address}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
              {order.shippingAddress?.pincode}<br />
              📞 {order.shippingAddress?.phone}<br />
              {order.user?.email && <>✉️ {order.user.email}</>}
            </div>
          </div>

          {/* Invoice Info */}
          <div style={{
            border: '1px solid #000',
            padding: '6px 8px',
          }}>
            <div style={{
              fontSize: '9px', fontWeight: '900',
              borderBottom: '1px solid #000', paddingBottom: '2px',
              marginBottom: '4px',
            }}>
              INVOICE DETAILS:
            </div>
            <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
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
                    {order.isPaid && ' (Paid)'}
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

        {/* PRODUCTS TABLE */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '9px',
          marginBottom: '10px',
        }}>
          <thead>
            <tr style={{ background: '#000', color: 'white' }}>
              <th style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000', width: '22px' }}>#</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', border: '1px solid #000' }}>Item Description</th>
              <th style={{ padding: '5px 4px', textAlign: 'center', border: '1px solid #000', width: '30px' }}>Qty</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', border: '1px solid #000', width: '55px' }}>Rate</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', border: '1px solid #000', width: '55px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems?.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>
                  {item.name}
                </td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>
                  ₹{item.price?.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
            {/* Empty rows to fill space if less items */}
            {order.orderItems?.length < 5 && [...Array(5 - order.orderItems.length)].map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ padding: '4px', border: '1px solid #000', height: '18px' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>&nbsp;</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>&nbsp;</td>
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
          {/* Payment Info / Bank Details */}
          <div style={{
            border: '1px solid #000',
            padding: '6px 8px',
            fontSize: '9px',
          }}>
            <div style={{
              fontWeight: '900',
              borderBottom: '1px solid #000',
              paddingBottom: '2px',
              marginBottom: '4px',
            }}>
              PAYMENT INFORMATION
            </div>
            {order.paymentMethod === 'COD' ? (
              <div>
                <strong>Cash on Delivery</strong><br />
                Please pay ₹{Math.round(total).toLocaleString('en-IN')} on delivery
              </div>
            ) : order.isPaid ? (
              <div>
                <strong>✓ Payment Received</strong><br />
                Method: {order.paymentMethod}<br />
                {order.paidAt && `Paid on: ${new Date(order.paidAt).toLocaleDateString('en-IN')}`}
              </div>
            ) : (
              <div>Payment Pending</div>
            )}

            {company?.bankName && (
              <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #666' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Bank Details:</div>
                <div>Bank: {company.bankName}</div>
                {company.accountNumber && <div>A/C: {company.accountNumber}</div>}
                {company.ifscCode && <div>IFSC: {company.ifscCode}</div>}
                {company.upiId && <div>UPI: {company.upiId}</div>}
              </div>
            )}
          </div>

          {/* Amount Summary */}
          <div style={{
            border: '1px solid #000',
            padding: '6px 8px',
            fontSize: '9px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                      Discount{order.couponCode && ` (${order.couponCode})`}:
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
                  <td style={{ padding: '4px 0', fontWeight: '900', fontSize: '11px', paddingTop: '4px' }}>
                    GRAND TOTAL:
                  </td>
                  <td style={{
                    padding: '4px 0', textAlign: 'right',
                    fontFamily: 'monospace', fontWeight: '900',
                    fontSize: '13px', paddingTop: '4px',
                  }}>
                    ₹{Math.round(total).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Amount in words */}
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
          }}>
            <div style={{
              fontWeight: '900', marginBottom: '3px', fontSize: '9px',
            }}>
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
        }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>
              Customer Signature
            </div>
            <div style={{ borderTop: '1px solid #000', width: '100px' }}></div>
          </div>

          <div style={{ textAlign: 'center', flex: 1, fontSize: '9px', fontStyle: 'italic' }}>
            {company?.invoiceFooter || 'Thank you for your business!'}
            <br />
            <span style={{ fontSize: '7px', color: '#666' }}>
              This is a computer-generated invoice
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>
              Authorized Signatory
            </div>
            <div style={{ borderTop: '1px solid #000', width: '100px' }}></div>
            <div style={{ fontSize: '8px', marginTop: '2px' }}>
              For {company?.companyName || 'Arunas Baby World'}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print-modal-overlay {
            position: static !important;
            background: white !important;
            padding: 0 !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .a5-invoice {
            width: 148mm !important;
            min-height: 210mm !important;
            max-height: 210mm !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 8mm !important;
            page-break-after: avoid;
          }
          * {
            color: #000 !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table thead tr {
            background: #000 !important;
            color: white !important;
          }
          table thead th {
            background: #000 !important;
            color: white !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════
   NUMBER TO WORDS (INDIAN)
═══════════════════════════════════════ */
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
  let hundred = num;

  if (crore) words += convert(crore) + ' Crore ';
  if (lakh) words += convert(lakh) + ' Lakh ';
  if (thousand) words += convert(thousand) + ' Thousand ';
  if (hundred) words += convert(hundred);

  return words.trim();
}