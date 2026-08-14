'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { uploadFileToR2 } from '@/lib/uploadFile';

function fmtOrderNum(order) {
  return order?.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order?.id?.slice(-12).toUpperCase()}`;
}

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

const STATUS_COLOR = {
  Pending:          '#f59e0b',
  Confirmed:        '#3b82f6',
  Processing:       '#8b5cf6',
  Shipped:          '#06b6d4',
  Delivered:        '#10b981',
  Cancelled:        '#ef4444',
  Refunded:         '#10b981',
  Return_Requested: '#f97316',
};

const STATUS_EMOJI = {
  Pending:          '📋',
  Confirmed:        '✅',
  Processing:       '⚙️',
  Shipped:          '🚚',
  Delivered:        '🎉',
  Cancelled:        '❌',
  Refunded:         '💰',
  Return_Requested: '🔄',
};

/* ══════════════════════════════════════════
   LIVE NIMBUS TRACKING
══════════════════════════════════════════ */
function LiveNimbusTracking({ awb }) {
  const [tracking, setTracking] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!awb) return;
    fetchTracking();
    const interval = setInterval(fetchTracking, 60000);
    return () => clearInterval(interval);
  }, [awb]);

  const fetchTracking = async () => {
    try {
      const res  = await fetch(`/api/shipping/track/${awb}`);
      const data = await res.json();
      if (data.success) setTracking(data.tracking);
    } catch (err) {
      console.error('Tracking error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!awb) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)',
      borderRadius: '24px',
      padding: '28px',
      boxShadow: '0 10px 40px rgba(3,105,161,0.08)',
      border: '1px solid #E0F2FE',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px', flexWrap: 'wrap', gap: '10px',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', boxShadow: '0 4px 12px rgba(3,105,161,0.30)',
          }}>
            🚚
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#0369A1' }}>
              Shipment Tracking
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#0891B2', fontWeight: '700' }}>
              Live • Updates every 60s
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <code style={{
            fontSize: '0.82rem', fontWeight: '800', color: '#0369A1',
            background: '#E0F2FE', padding: '6px 12px', borderRadius: '8px',
            border: '1.5px solid #BAE6FD',
          }}>
            {awb}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(awb); toast.success('AWB copied!'); }}
            style={{
              padding: '6px 12px', background: 'linear-gradient(135deg, #0EA5E9, #0369A1)', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '0.72rem',
              fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 3px 8px rgba(3,105,161,0.25)',
            }}
          >
            📋 Copy
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#9CA3AF', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>
          ⏳ Loading tracking info...
        </p>
      ) : tracking ? (
        <div>
          {tracking.current_status && (
            <div style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, #E0F2FE 0%, #EDE9FE 100%)',
              borderRadius: '14px', marginBottom: '18px',
              display: 'flex', alignItems: 'center', gap: '14px',
              border: '1.5px solid rgba(3,105,161,0.15)',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                📦
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '900', color: '#0369A1', fontSize: '1rem' }}>
                  {tracking.current_status}
                </p>
                {tracking.current_timestamp && (
                  <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#6B7280', fontWeight: '700' }}>
                    🕒 {new Date(tracking.current_timestamp).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          {tracking.tracking_data?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tracking.tracking_data.map((event, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: i === 0
                        ? 'linear-gradient(135deg, #0EA5E9, #0369A1)'
                        : '#CBD5E1',
                      marginTop: '4px', flexShrink: 0,
                      boxShadow: i === 0 ? '0 0 0 4px rgba(3,105,161,0.15)' : 'none',
                    }} />
                    {i < tracking.tracking_data.length - 1 && (
                      <div style={{ width: '2px', height: '36px', background: '#E2E8F0', margin: '2px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: '14px', flex: 1 }}>
                    <p style={{
                      margin: 0, fontSize: '0.88rem',
                      fontWeight: i === 0 ? '800' : '600',
                      color: i === 0 ? '#0F172A' : '#6B7280',
                    }}>
                      {event.status || event.activity}
                    </p>
                    {event.location && (
                      <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#94A3B8', fontWeight: '600' }}>
                        📍 {event.location}
                      </p>
                    )}
                    {event.timestamp && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>
                        🕒 {new Date(event.timestamp).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9CA3AF', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>
              Tracking updates will appear here once the shipment is picked up.
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: '#9CA3AF', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>
          Tracking info not yet available. Check back in a few hours.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function OrderDetailClient({ id }) {
  const searchParams = useSearchParams();
  const showPaymentFailedNotice = searchParams.get('paymentFailed') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => { fetchOrder(); }, [id]);

  useEffect(() => {
    if (!order) return;
    const needsRefresh =
      order.refundStatus === 'pending' ||
      order.refundStatus === 'processing' ||
      order.refundStatus === 'scheduled' ||
      (order.exchangeId && !['completed', 'rejected', 'cancelled'].includes(order.exchangeStatus));
    if (!needsRefresh) return;
    const interval = setInterval(() => { fetchOrder(); }, 10000);
    return () => clearInterval(interval);
  }, [order?.refundStatus, order?.exchangeStatus]);

  useEffect(() => {
    if (showPaymentFailedNotice && order?.paymentStatus === 'failed') {
      toast.error('Your payment could not be completed. You can retry below.');
    }
  }, [showPaymentFailedNotice, order]);

  const fetchOrder = () => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => { setOrder(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const { generateInvoice } = await import('@/lib/invoiceGenerator');
      await generateInvoice(order);
      toast.success('📄 Invoice downloaded!');
    } catch (err) {
      console.error('Invoice error:', err);
      toast.error('Failed to generate invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleRetryPayment = async () => {
    setRetrying(true);
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const res = await fetch(`/api/orders/${order.id}/retry-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.razorpayOrder.amount,
        currency: 'INR',
        name: 'Arunas Baby World',
        description: `Retry payment for ${fmtOrderNum(order)}`,
        order_id: data.razorpayOrder.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: order.id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success('🎉 Payment successful!');
              window.location.href = `/orders/${order.id}`;
            } else {
              toast.error('Verification failed');
              setRetrying(false);
            }
          } catch (err) {
            toast.error('Verification error');
            setRetrying(false);
          }
        },
        prefill: {
          name: order.user?.name,
          email: order.user?.email,
          contact: order.shippingAddress?.phone,
        },
        theme: { color: '#ff6b9d' },
        modal: {
          ondismiss: async () => {
            setRetrying(false);
            await fetch(`/api/orders/${order.id}/payment-failed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'Retry cancelled by user' }),
            });
            toast.error('Payment cancelled');
            fetchOrder();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        await fetch(`/api/orders/${order.id}/payment-failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: response.error?.description || 'Payment failed',
            errorCode: response.error?.code,
          }),
        });
        toast.error('Payment failed. Try again.');
        setRetrying(false);
        fetchOrder();
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message);
      setRetrying(false);
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: '20px',
    }}>
      <div style={{
        width: '60px', height: '60px',
        border: '4px solid #F3E8FF', borderTop: '4px solid #7B2FBE',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#9585B0', fontFamily: 'Nunito, sans-serif', fontWeight: '700', fontSize: '1rem' }}>
        Loading your order...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
      <h2 style={{ fontFamily: 'Nunito, sans-serif', color: '#2D1A4A', margin: '0 0 20px' }}>Order not found</h2>
      <Link href="/" style={{
        display: 'inline-block', padding: '14px 32px',
        background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
        color: 'white', borderRadius: '14px', textDecoration: 'none',
        fontWeight: '800', fontFamily: 'Nunito, sans-serif',
        boxShadow: '0 6px 20px rgba(255,107,53,0.30)',
      }}>
        Go Home
      </Link>
    </div>
  );

  const currentStep       = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled       = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';
  const hasExchange       = !!order.exchangeId;
  const statusColor       = STATUS_COLOR[order.orderStatus] || '#6b7280';
  const isPaymentFailed   = order.paymentStatus === 'failed' && !order.isPaid && !isCancelled;
  const canDownloadInvoice = order.isPaid || order.paymentMethod === 'COD';
  const isDelivered        = order.orderStatus === 'Delivered' || order.isDelivered;
  const totalItems         = order.orderItems?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;

  // ✅ NEW BUSINESS RULES:
  // Cancel: Only BEFORE shipping (Pending, Confirmed, Processing)
  const canCancel = !isCancelled && !isPaymentFailed &&
                    ['Pending', 'Confirmed', 'Processing'].includes(order.orderStatus);

  // Exchange: Only for delivered orders (within 3 days, no active exchange)
  const canExchange = isDelivered && !isCancelled;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAFBFF 0%, #FFF5F7 100%)',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: 'clamp(20px,3vw,32px) 20px',
      }}>

        {/* ══ TOP HEADER CARD ══ */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(20px, 3vw, 32px)',
          boxShadow: '0 8px 32px rgba(123,47,190,0.10)',
          marginBottom: '20px',
          border: '1px solid rgba(123,47,190,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '20px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            position: 'relative',
          }}>
            <div>
              <Link href="/orders" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#7B2FBE',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: '800',
                marginBottom: '12px',
                padding: '6px 12px',
                background: '#F3E8FF',
                borderRadius: '999px',
                border: '1.5px solid #E9D5FF',
                transition: 'all 0.2s',
              }}>
                ← Back to Orders
              </Link>

              <h1 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                fontWeight: '900',
                color: '#1F0F3A',
                margin: '0 0 10px',
                lineHeight: 1.2,
              }}>
                Order Details
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '10px',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #FFF5EE, #F5EDFF)',
                  border: '1.5px solid #E9D5FF',
                  borderRadius: '12px',
                }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '900',
                    color: '#9585B0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    Order
                  </span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: '900',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {fmtOrderNum(order)}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(fmtOrderNum(order)); toast.success('Copied!'); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.9rem', padding: '2px', color: '#7B2FBE',
                    }}
                  >
                    📋
                  </button>
                </div>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, ${statusColor}15, ${statusColor}25)`,
                  border: `1.5px solid ${statusColor}40`,
                  borderRadius: '12px', color: statusColor,
                  fontWeight: '800', fontSize: '0.86rem',
                }}>
                  {STATUS_EMOJI[order.orderStatus]} {order.orderStatus?.replace('_', ' ')}
                </span>
              </div>

              <p style={{
                color: '#7B7898',
                margin: 0,
                fontWeight: '600',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                📅 Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })} · 📦 {totalItems} item{totalItems > 1 ? 's' : ''}
              </p>
            </div>

            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #7B2FBE 100%)',
              borderRadius: '20px',
              color: 'white',
              textAlign: 'right',
              boxShadow: '0 8px 24px rgba(123,47,190,0.30)',
              minWidth: '180px',
            }}>
              <p style={{
                margin: 0,
                fontSize: '0.7rem',
                fontWeight: '800',
                opacity: 0.9,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Total Amount
              </p>
              <p style={{
                margin: '6px 0 0',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: '900',
                lineHeight: 1,
              }}>
                ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
              </p>
              <p style={{
                margin: '6px 0 0',
                fontSize: '0.72rem',
                fontWeight: '700',
                opacity: 0.85,
              }}>
                {order.isPaid ? '✅ Paid' : order.paymentMethod === 'COD' ? '💵 COD' : '⏳ Pending'}
              </p>
            </div>
          </div>

          {/* ✅ ACTION BUTTONS — NEW BUSINESS LOGIC */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            flexWrap: 'wrap',
            position: 'relative',
          }}>
            {canDownloadInvoice && (
              <button
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                style={{
                  padding: '10px 18px',
                  background: downloadingInvoice
                    ? '#F3F4F6'
                    : 'linear-gradient(135deg, #10B981, #059669)',
                  color: downloadingInvoice ? '#9CA3AF' : 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: downloadingInvoice ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: downloadingInvoice ? 'none' : '0 4px 12px rgba(16,185,129,0.25)',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => !downloadingInvoice && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {downloadingInvoice ? '⏳ Generating...' : '📄 Invoice'}
              </button>
            )}

            {/* ✅ EXCHANGE — Only for Delivered orders (within 3 days) */}
            {canExchange && (() => {
              const deliveredAt  = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
              const daysSince    = Math.floor((new Date() - deliveredAt) / (1000 * 60 * 60 * 24));
              const within3Days  = daysSince <= 3;
              const noActiveExchange = !order.exchangeId || ['rejected', 'completed', 'cancelled'].includes(order.exchangeStatus);
              if (!within3Days || !noActiveExchange) return null;
              return (
                <Link
                  href={`/orders/${order.id}/exchange`}
                  style={{
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #FF6B35, #EA580C)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '800', fontSize: '0.85rem',
                    fontFamily: 'inherit', textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(255,107,53,0.30)',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  🔄 Exchange Item
                </Link>
              );
            })()}

            {/* ✅ CANCEL — Only BEFORE shipping */}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  padding: '10px 18px', background: 'white',
                  color: '#EF4444', border: '2px solid #FECACA',
                  borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem',
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                ❌ Cancel Order
              </button>
            )}

            {/* ℹ️ Info: Can't cancel after shipping */}
            {order.orderStatus === 'Shipped' && (
              <div style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                border: '1.5px solid #BFDBFE',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: '700',
                color: '#1E40AF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                🚚 Cannot cancel after shipping
              </div>
            )}

            <Link href="/products" style={{
              padding: '10px 18px', border: '2px solid #E5E7EB',
              borderRadius: '12px', color: '#6B7280', textDecoration: 'none',
              fontWeight: '700', fontSize: '0.85rem', background: 'white',
              marginLeft: 'auto',
            }}>
              🛍️ Continue Shopping
            </Link>
          </div>
        </div>

        {/* PAYMENT FAILED BANNER */}
        {isPaymentFailed && (
          <div style={{
            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
            border: '2px solid #EF4444',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 8px 24px rgba(239,68,68,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', flexShrink: 0,
                animation: 'shake 2s ease-in-out infinite',
                boxShadow: '0 6px 16px rgba(239,68,68,0.35)',
              }}>
                ❌
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 6px', color: '#991B1B', fontSize: '1.2rem', fontWeight: '900' }}>
                  Payment Failed
                </h3>
                <p style={{ margin: 0, color: '#7F1D1D', fontSize: '0.9rem', fontWeight: '600', lineHeight: 1.5 }}>
                  Your payment couldn't be completed. Your order is saved and reserved.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleRetryPayment}
                disabled={retrying}
                style={{
                  flex: '1 1 200px',
                  padding: '14px 20px',
                  background: retrying ? '#F3F4F6' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: retrying ? '#9CA3AF' : 'white',
                  border: 'none', borderRadius: '12px',
                  fontWeight: '900', fontSize: '0.95rem',
                  cursor: retrying ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: retrying ? 'none' : '0 4px 14px rgba(16,185,129,0.30)',
                }}
              >
                {retrying ? '⏳ Opening...' : `🔄 Retry Payment ₹${Math.round(order.totalPrice)?.toLocaleString('en-IN')}`}
              </button>
              {/* Can cancel if payment failed */}
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  flex: '1 1 150px', padding: '14px 20px',
                  background: 'white', color: '#EF4444',
                  border: '2px solid #FCA5A5', borderRadius: '12px',
                  fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ❌ Cancel Order
              </button>
            </div>
          </div>
        )}

        {/* EXCHANGE BANNER */}
        {hasExchange && (
          <ExchangeStatusBanner orderId={order.id} exchangeId={order.exchangeId} />
        )}

        {/* ═══ MAIN CONTENT GRID ═══ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '20px',
        }} className="orderGrid">

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* LIVE ORDER TRACKING */}
            {!isCancelled && !isPaymentFailed && (
              <div style={{
                background: 'white', borderRadius: '24px',
                padding: 'clamp(20px, 3vw, 28px)',
                boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
                border: '1px solid rgba(123,47,190,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `linear-gradient(135deg, ${statusColor}, ${statusColor}CC)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem',
                    boxShadow: `0 4px 12px ${statusColor}40`,
                  }}>
                    🎯
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1F0F3A', margin: 0 }}>
                      Order Progress
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#7B7898', fontWeight: '600' }}>
                      Track your order in real-time
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {STATUS_STEPS.map((step, i) => {
                    const isDone    = i < currentStep;
                    const isCurrent = i === currentStep;
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: isCurrent ? '1.4rem' : '1.1rem',
                            background: isDone
                              ? 'linear-gradient(135deg, #10B981, #059669)'
                              : isCurrent
                                ? `linear-gradient(135deg, ${statusColor}, ${statusColor}DD)`
                                : '#F3F4F6',
                            color: isDone || isCurrent ? 'white' : '#9CA3AF',
                            boxShadow: isCurrent
                              ? `0 0 0 6px ${statusColor}20, 0 8px 20px ${statusColor}40`
                              : isDone ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
                            fontWeight: '900', transition: 'all 0.3s ease',
                            border: '3px solid white',
                          }}>
                            {isDone ? '✓' : STATUS_EMOJI[step]}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div style={{
                              width: '3px', height: '36px',
                              background: isDone
                                ? 'linear-gradient(to bottom, #10B981, #059669)'
                                : '#E5E7EB',
                              margin: '4px 0', borderRadius: '999px',
                            }} />
                          )}
                        </div>
                        <div style={{
                          paddingTop: '14px',
                          paddingBottom: i < STATUS_STEPS.length - 1 ? '20px' : '0',
                          flex: 1,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <p style={{
                              fontSize: '1rem',
                              fontWeight: isCurrent ? '900' : isDone ? '800' : '700',
                              color: isCurrent ? statusColor : isDone ? '#10B981' : '#9CA3AF',
                              margin: 0,
                            }}>
                              {step}
                            </p>
                            {isCurrent && (
                              <span style={{
                                fontSize: '0.68rem', fontWeight: '900',
                                background: `${statusColor}15`, color: statusColor,
                                border: `1.5px solid ${statusColor}40`,
                                padding: '3px 10px', borderRadius: '999px',
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                              }}>
                                <span style={{
                                  width: '6px', height: '6px', borderRadius: '50%',
                                  background: statusColor,
                                  animation: 'blip 1.2s ease-in-out infinite',
                                }} />
                                LIVE
                              </span>
                            )}
                            {isDone && (
                              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#10B981' }}>
                                ✓ Completed
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: '4px 0 0', fontWeight: '500' }}>
                            {isDone ? 'This step is complete' : isCurrent ? 'Currently in progress...' : 'Waiting to start'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NIMBUS TRACKING */}
            {order.awbNumber && !isCancelled && (
              <LiveNimbusTracking awb={order.awbNumber} />
            )}

            {/* ORDERED ITEMS */}
            <div style={{
              background: 'white', borderRadius: '24px',
              padding: 'clamp(20px, 3vw, 28px)',
              boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
              border: '1px solid rgba(123,47,190,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                  boxShadow: '0 4px 12px rgba(123,47,190,0.30)',
                }}>
                  🛍️
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1F0F3A', margin: 0 }}>
                    Ordered Items
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#7B7898', fontWeight: '600' }}>
                    {order.orderItems?.length} product{order.orderItems?.length !== 1 ? 's' : ''} · {totalItems} unit{totalItems !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.orderItems?.map((item, i) => (
                  <OrderItemCard
                    key={i}
                    item={item}
                    isDelivered={isDelivered}
                  />
                ))}
              </div>
            </div>

            {/* CANCELLED / REFUNDED */}
            {isCancelled && (
              <div style={{
                background: order.orderStatus === 'Refunded'
                  ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
                  : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                border: `2px solid ${order.orderStatus === 'Refunded' ? '#10B981' : '#FCA5A5'}`,
                borderRadius: '20px', padding: '24px',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: order.orderStatus === 'Refunded' ? '#10B981' : '#EF4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', flexShrink: 0,
                }}>
                  {order.orderStatus === 'Refunded' ? '💰' : '❌'}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{
                    color: order.orderStatus === 'Refunded' ? '#065F46' : '#DC2626',
                    fontSize: '1.05rem',
                  }}>
                    {order.orderStatus === 'Refunded' ? '✅ Order Refunded' : `Order ${order.orderStatus}`}
                  </strong>
                  <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.6 }}>
                    {order.cancelReason && (<><span>Reason: <strong>{order.cancelReason}</strong></span><br /></>)}
                    {order.refundStatus === 'completed' && (
                      <span style={{ color: '#10B981', fontWeight: '800' }}>
                        ✅ Refund completed — ₹{Math.round(order.refundAmount)?.toLocaleString('en-IN')} credited
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* PRICE SUMMARY */}
            <div style={{
              background: 'white', borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
              border: '1px solid rgba(123,47,190,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  💰
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1F0F3A', margin: 0 }}>
                  Price Details
                </h3>
              </div>

              {[
                { label: 'Items Total', value: `₹${Math.round(order.itemsPrice)?.toLocaleString('en-IN')}`, icon: '🛒' },
                {
                  label: 'Shipping',
                  value: order.shippingPrice === 0 ? '🎉 FREE' : `₹${order.shippingPrice}`,
                  icon: '🚚',
                  color: order.shippingPrice === 0 ? '#10B981' : undefined,
                },
                ...(order.discountAmount > 0
                  ? [{ label: `Coupon (${order.couponCode})`, value: `− ₹${Math.round(order.discountAmount)?.toLocaleString('en-IN')}`, icon: '🎟️', color: '#10B981' }]
                  : []),
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px dashed #F3E8FF',
                }}>
                  <span style={{ fontSize: '0.85rem', color: '#6B4E8A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{row.icon}</span>
                    {row.label}
                  </span>
                  <span style={{ fontSize: '0.90rem', fontWeight: '800', color: row.color || '#2D1A4A' }}>
                    {row.value}
                  </span>
                </div>
              ))}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 14px', marginTop: '10px',
                background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
                borderRadius: '14px',
                border: '1.5px solid #FFE4EC',
              }}>
                <span style={{ fontWeight: '900', color: '#2D1A4A', fontSize: '1rem' }}>Total</span>
                <strong style={{
                  fontSize: '1.6rem',
                  background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: '900',
                }}>
                  ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
                </strong>
              </div>

              {order.discountAmount > 0 && (
                <div style={{
                  marginTop: '10px', padding: '10px 12px',
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: '10px', textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '800', color: '#059669' }}>
                    🎉 You saved ₹{Math.round(order.discountAmount).toLocaleString('en-IN')} on this order!
                  </p>
                </div>
              )}
            </div>

            {/* DELIVERY ADDRESS */}
            <div style={{
              background: 'white', borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
              border: '1px solid rgba(123,47,190,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  📍
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1F0F3A', margin: 0 }}>
                  Delivery Address
                </h3>
              </div>

              {order.shippingAddress ? (
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #F0F9FF, #EDE9FE)',
                  borderRadius: '14px',
                  border: '1.5px solid #BAE6FD',
                }}>
                  <p style={{ fontWeight: '900', color: '#1F0F3A', margin: '0 0 6px', fontSize: '1rem' }}>
                    {order.shippingAddress.name}
                  </p>
                  <p style={{ color: '#5B21B6', margin: '0 0 4px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📞 {order.shippingAddress.phone}
                  </p>
                  <p style={{ color: '#6B4E8A', margin: '0 0 4px', fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.6 }}>
                    🏠 {order.shippingAddress.address}
                  </p>
                  <p style={{ color: '#6B4E8A', margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>
                    {order.shippingAddress.city}, {order.shippingAddress.state} — <strong style={{ color: '#0369A1' }}>{order.shippingAddress.pincode}</strong>
                  </p>
                </div>
              ) : (
                <p style={{ color: '#9CA3AF' }}>No address on record</p>
              )}
            </div>

            {/* PAYMENT INFO */}
            <div style={{
              background: 'white', borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
              border: '1px solid rgba(123,47,190,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  💳
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1F0F3A', margin: 0 }}>
                  Payment Info
                </h3>
              </div>

              {[
                { label: 'Method', value: order.paymentMethod, icon: '💳' },
                {
                  label: 'Status',
                  value: order.isPaid ? '✅ Paid' : order.paymentStatus === 'failed' ? '❌ Failed' : order.paymentStatus === 'not_applicable' ? '💵 COD' : '⏳ Pending',
                  color: order.isPaid ? '#10B981' : order.paymentStatus === 'failed' ? '#EF4444' : '#F59E0B',
                  icon: '📊',
                },
                ...(order.isPaid && order.paidAt
                  ? [{ label: 'Paid On', value: new Date(order.paidAt).toLocaleDateString('en-IN'), icon: '📅' }]
                  : []),
                ...(order.paymentResult?.razorpayPaymentId
                  ? [{ label: 'Txn ID', value: order.paymentResult.razorpayPaymentId.slice(-12), mono: true, icon: '🔑' }]
                  : []),
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px dashed #F3E8FF',
                }}>
                  <span style={{ fontSize: '0.82rem', color: '#6B4E8A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{row.icon}</span> {row.label}
                  </span>
                  <strong style={{
                    fontSize: '0.85rem', color: row.color || '#2D1A4A',
                    fontFamily: row.mono ? 'monospace' : 'inherit',
                  }}>
                    {row.value}
                  </strong>
                </div>
              ))}
            </div>

            {/* ✅ Delivered Card — Exchange Only */}
            {isDelivered && !isCancelled && (
              <div style={{
                background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)',
                borderRadius: '20px', padding: '20px 22px',
                border: '2px solid #86EFAC',
                boxShadow: '0 6px 20px rgba(16,185,129,0.15)',
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.30)',
                  }}>
                    🎉
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: '#065F46' }}>Order Delivered!</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#047857', fontWeight: '700' }}>
                      {order.deliveredAt
                        ? new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                </div>

                {/* ✅ Exchange button — only if within 3 days */}
                {(() => {
                  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
                  const daysSince   = Math.floor((new Date() - deliveredAt) / (1000 * 60 * 60 * 24));
                  const within3Days = daysSince <= 3;
                  const noActiveExchange = !order.exchangeId || ['rejected', 'completed', 'cancelled'].includes(order.exchangeStatus);
                  const daysLeft = 3 - daysSince;

                  if (!within3Days) {
                    return (
                      <div style={{
                        padding: '14px 16px',
                        background: 'white',
                        border: '1.5px solid #E5E7EB',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: '#6B7280', fontWeight: '800' }}>
                          ⏱️ Exchange window expired
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#9CA3AF', fontWeight: '600' }}>
                          Exchange was available for 3 days after delivery
                        </p>
                      </div>
                    );
                  }

                  if (!noActiveExchange) {
                    return (
                      <div style={{
                        padding: '14px 16px',
                        background: '#FFF3E8',
                        border: '1.5px solid #FED7AA',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: '#EA580C', fontWeight: '900' }}>
                          🔄 Exchange in progress
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#9A3412', fontWeight: '600' }}>
                          Check exchange status above
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#065F46', fontWeight: '700', textAlign: 'center' }}>
                        💡 Not happy? You can exchange for another product
                      </p>
                      <Link
                        href={`/orders/${order.id}/exchange`}
                        style={{
                          display: 'block',
                          padding: '14px 20px',
                          background: 'linear-gradient(135deg, #FF6B35, #EA580C)',
                          color: 'white',
                          borderRadius: '12px',
                          textDecoration: 'none',
                          fontWeight: '900',
                          fontSize: '0.95rem',
                          textAlign: 'center',
                          fontFamily: 'inherit',
                          boxShadow: '0 6px 18px rgba(255,107,53,0.35)',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        🔄 Exchange Item
                      </Link>
                      <p style={{
                        margin: '10px 0 0',
                        fontSize: '0.74rem',
                        color: '#047857',
                        fontWeight: '800',
                        textAlign: 'center',
                      }}>
                        ⏱️ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to exchange
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* MODALS */}
        {showCancelModal && (
          <CancelOrderModal
            order={order}
            onClose={() => setShowCancelModal(false)}
            onSuccess={() => { setShowCancelModal(false); fetchOrder(); }}
          />
        )}

        <style>{`
          @keyframes blip {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%       { transform: scale(1.4); opacity: 0.6; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25%      { transform: translateX(-3px); }
            75%      { transform: translateX(3px); }
          }
          @media (max-width: 900px) {
            .orderGrid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ORDER ITEM CARD (with Review Button)
══════════════════════════════════════════ */
function OrderItemCard({ item, isDelivered }) {
  const { data: session } = useSession();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview]   = useState(null);
  const [loadingReview,  setLoadingReview]    = useState(false);
  const [isHovered,      setIsHovered]        = useState(false);

  const productId = item.productId;

  useEffect(() => {
    if (!isDelivered || !productId || !session) return;
    setLoadingReview(true);
    fetch(`/api/reviews/can-review?productId=${productId}`)
      .then(r => r.json())
      .then(d => {
        if (d.reason === 'already-reviewed') {
          setExistingReview(d.existingReview);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReview(false));
  }, [productId, isDelivered, session]);

  const itemTotal = Math.round((item.price || 0) * (item.quantity || 1));

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: `2px solid ${isHovered ? '#7B2FBE' : '#F3E8FF'}`,
      overflow: 'hidden',
      transition: 'all 0.25s ease',
      boxShadow: isHovered ? '0 10px 30px rgba(123,47,190,0.15)' : '0 2px 8px rgba(123,47,190,0.05)',
      transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
    }}>
      <Link
        href={productId ? `/products/${productId}` : '#'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 18px',
          textDecoration: 'none',
          cursor: productId ? 'pointer' : 'default',
          background: isHovered ? 'linear-gradient(135deg, #FFFAFC, #FAF7FF)' : 'white',
          transition: 'background 0.25s ease',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '84px', height: '84px',
            borderRadius: '14px', overflow: 'hidden',
            border: '2px solid #F3E8FF',
            background: '#FAFAFA',
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}>
            <img
              src={item.image || 'https://via.placeholder.com/84'}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{
            position: 'absolute',
            top: '-6px', right: '-6px',
            minWidth: '28px', height: '28px',
            padding: '0 8px', borderRadius: '999px',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            color: 'white', fontSize: '0.75rem', fontWeight: '900',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid white',
            boxShadow: '0 3px 8px rgba(123,47,190,0.35)',
          }}>
            ×{item.quantity}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.95rem',
            fontWeight: '800',
            color: isHovered ? '#7B2FBE' : '#1F0F3A',
            margin: '0 0 6px',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            transition: 'color 0.2s',
          }}>
            {item.name}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px',
              background: '#F3E8FF',
              color: '#7B2FBE',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: '800',
            }}>
              ₹{item.price?.toLocaleString('en-IN')} each
            </span>
            {productId && (
              <span style={{
                fontSize: '0.72rem',
                color: isHovered ? '#7B2FBE' : '#9585B0',
                fontWeight: '800',
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.2s',
              }}>
                {isHovered ? 'View Product →' : 'View ›'}
              </span>
            )}
          </div>
        </div>

        <div style={{
          textAlign: 'right', flexShrink: 0,
          paddingLeft: '14px',
          borderLeft: '2px dashed #F3E8FF',
        }}>
          <p style={{
            margin: 0, fontSize: '0.65rem', color: '#9585B0',
            fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Subtotal
          </p>
          <strong style={{
            fontSize: '1.2rem',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '900', display: 'block', marginTop: '2px',
          }}>
            ₹{itemTotal.toLocaleString('en-IN')}
          </strong>
        </div>
      </Link>

      {isDelivered && productId && (
        <div style={{
          padding: '12px 18px',
          background: existingReview
            ? 'linear-gradient(135deg, #F0FDF4, #ECFDF5)'
            : 'linear-gradient(135deg, #FFF9FB, #FFF5F7)',
          borderTop: `1.5px dashed ${existingReview ? '#86EFAC' : '#F9A8D4'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            {existingReview ? (
              <>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.95rem', color: 'white', fontWeight: '900',
                  flexShrink: 0, boxShadow: '0 3px 8px rgba(16,185,129,0.30)',
                }}>
                  ✓
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: '#065F46' }}>
                    Your Review Posted
                  </p>
                  <div style={{ display: 'flex', gap: '1px', marginTop: '2px' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{
                        fontSize: '0.85rem',
                        color: s <= existingReview.rating ? '#FBBF24' : '#E5E7EB',
                      }}>★</span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.95rem', color: 'white', fontWeight: '900',
                  flexShrink: 0, boxShadow: '0 3px 8px rgba(245,158,11,0.30)',
                }}>
                  ⭐
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: '#BE185D' }}>
                    Share Your Experience
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#9585B0', fontWeight: '600' }}>
                    Help others make the right choice
                  </p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowReviewModal(true);
            }}
            disabled={loadingReview}
            style={{
              padding: '9px 18px',
              background: existingReview ? 'white' : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
              color: existingReview ? '#065F46' : 'white',
              border: existingReview ? '2px solid #10B981' : 'none',
              borderRadius: '10px',
              fontSize: '0.78rem', fontWeight: '900',
              cursor: loadingReview ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: existingReview ? 'none' : '0 4px 12px rgba(255,107,53,0.30)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {loadingReview ? '⏳' : existingReview ? '✏️ Edit' : '⭐ Review'}
          </button>
        </div>
      )}

      {showReviewModal && (
        <ReviewModal
          productId={productId}
          productName={item.name}
          productImage={item.image}
          existingReview={existingReview}
          onClose={() => setShowReviewModal(false)}
          onSuccess={(newReview) => {
            setExistingReview(newReview);
            setShowReviewModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   REVIEW MODAL
══════════════════════════════════════════ */
function ReviewModal({ productId, productName, productImage, existingReview, onClose, onSuccess }) {
  const [rating,     setRating]     = useState(existingReview?.rating || 0);
  const [hover,      setHover]      = useState(0);
  const [title,      setTitle]      = useState(existingReview?.title || '');
  const [comment,    setComment]    = useState(existingReview?.comment || '');
  const [images,     setImages]     = useState(existingReview?.images || []);
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(f => uploadFileToR2(f, 'arunas/reviews')));
      setImages([...images, ...uploaded.map(u => ({ url: u.url, publicId: u.publicId }))]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setImages(images.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select rating'); return; }
    if (comment.trim().length < 10) { toast.error('Comment must be at least 10 characters'); return; }

    setSubmitting(true);
    try {
      const url = existingReview ? `/api/reviews/${existingReview.id}` : '/api/reviews';
      const method = existingReview ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, comment, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(existingReview ? '✅ Review updated!' : '🎉 Review posted!');
      onSuccess(data.review);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{
        padding: '24px 26px',
        borderBottom: '1px solid #FFE4EC',
        background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
        borderRadius: '20px 20px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#BE185D' }}>
            {existingReview ? '✏️ Edit Review' : '⭐ Write Review'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9D174D', fontWeight: '700' }}>
            Share your honest experience
          </p>
        </div>
        <CloseBtn onClose={onClose} color="#BE185D" />
      </div>

      <div style={{ padding: '22px 26px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 16px', background: '#F9FAFB',
          border: '1.5px solid #E5E7EB', borderRadius: '14px',
          marginBottom: '20px',
        }}>
          {productImage && (
            <img src={productImage} alt={productName} style={{
              width: '56px', height: '56px', objectFit: 'cover',
              borderRadius: '10px', flexShrink: 0,
              border: '2px solid #F3E8FF',
            }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: '0.88rem', fontWeight: '800', color: '#1F2937',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {productName}
            </p>
            <span style={{
              display: 'inline-block', marginTop: '4px',
              padding: '2px 10px', background: '#D1FAE5',
              color: '#065F46', borderRadius: '999px',
              fontSize: '0.65rem', fontWeight: '900',
            }}>
              ✓ Verified Purchase
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#6B4E8A', marginBottom: '8px', display: 'block' }}>
              Your Rating <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[1,2,3,4,5].map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '2.4rem',
                    color: s <= (hover || rating) ? '#FBBF24' : '#E5E7EB',
                    transition: 'all 0.15s', padding: '2px', lineHeight: 1,
                    transform: s <= hover ? 'scale(1.15)' : 'scale(1)',
                  }}
                >★</button>
              ))}
              <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#6B7280', fontWeight: '800' }}>
                {rating === 0 ? 'Click to rate' : `${rating}/5`}
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#6B4E8A', marginBottom: '8px', display: 'block' }}>
              Title (optional)
            </label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Excellent quality!" maxLength={100}
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #EDD9FF', borderRadius: '10px',
                fontSize: '0.9rem', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#6B4E8A', marginBottom: '8px', display: 'block' }}>
              Your Review <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4} maxLength={1000} required
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #EDD9FF', borderRadius: '10px',
                fontSize: '0.9rem', outline: 'none',
                fontFamily: 'inherit', resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'right' }}>
              {comment.length}/1000 (min 10)
            </p>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#6B4E8A', marginBottom: '8px', display: 'block' }}>
              Add Photos (up to 5)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img.url} alt="" style={{
                    width: '72px', height: '72px', objectFit: 'cover',
                    borderRadius: '10px', border: '2px solid #E5E7EB',
                  }} />
                  <button
                    type="button" onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: '#EF4444', color: 'white',
                      border: '2px solid white', cursor: 'pointer',
                      fontSize: '0.72rem', fontWeight: '900',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(239,68,68,0.30)',
                    }}
                  >×</button>
                </div>
              ))}
              {images.length < 5 && (
                <label style={{
                  width: '72px', height: '72px',
                  border: '2px dashed #FF6B9D', borderRadius: '10px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  background: '#FFF5F7',
                }}>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                  {uploading ? '⏳' : (
                    <>
                      <span style={{ fontSize: '1.3rem' }}>📷</span>
                      <span style={{ fontSize: '0.62rem', color: '#FF6B9D', fontWeight: '800' }}>Add</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{
              padding: '13px 22px', background: 'white',
              border: '2px solid #E5E7EB', borderRadius: '12px',
              color: '#6B7280', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancel</button>
            <button type="submit" disabled={submitting || uploading} style={{
              flex: 1, padding: '13px 22px',
              background: submitting ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: '900', cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: '0.95rem',
              boxShadow: '0 6px 18px rgba(255,107,53,0.30)',
            }}>
              {submitting ? '⏳ Posting...' : existingReview ? '💾 Update' : '✨ Post Review'}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}

/* ══════════════════════════════════════════
   EXCHANGE STATUS BANNER
══════════════════════════════════════════ */
function ExchangeStatusBanner({ orderId, exchangeId }) {
  const [exchange, setExchange] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchExchange();
    const interval = setInterval(fetchExchange, 10000);
    return () => clearInterval(interval);
  }, [exchangeId]);

  const fetchExchange = async () => {
    try {
      const res  = await fetch(`/api/exchanges?limit=100`);
      const data = await res.json();
      const found = (data.exchanges || []).find(e => e.id === exchangeId);
      if (found) setExchange(found);
    } catch (err) {
      console.error('Failed to fetch exchange:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !exchange) return null;

  const STATUS_CONFIG = {
    pending:          { label: 'Pending Approval',   color: '#F59E0B', icon: '🟡', desc: 'Waiting for admin approval' },
    approved:         { label: 'Approved',           color: '#3B82F6', icon: '✅', desc: 'Pickup will be arranged soon' },
    picked_up:        { label: 'Picked Up',          color: '#8B5CF6', icon: '📦', desc: 'On the way to our warehouse' },
    received:         { label: 'Received',           color: '#6366F1', icon: '📬', desc: 'Item received, verifying...' },
    verified:         { label: 'Verified',           color: '#10B981', icon: '🔍', desc: 'Quality check passed!' },
    awaiting_payment: { label: 'Awaiting Payment',   color: '#F97316', icon: '💳', desc: 'Complete payment to continue' },
    ready_to_ship:    { label: 'Ready to Ship',      color: '#10B981', icon: '🎁', desc: 'New product being packed' },
    shipped:          { label: 'Shipped',            color: '#06B6D4', icon: '🚚', desc: 'New product on the way!' },
    completed:        { label: 'Completed',          color: '#10B981', icon: '🎉', desc: 'Exchange completed successfully!' },
    rejected:         { label: 'Rejected',           color: '#EF4444', icon: '❌', desc: 'Exchange request rejected' },
  };

  const cfg         = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.pending;
  const isCompleted = exchange.status === 'completed';
  const isRejected  = exchange.status === 'rejected';

  return (
    <div style={{
      background: isCompleted
        ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
        : isRejected
          ? 'linear-gradient(135deg, #FEF2F2, #FEE2E2)'
          : 'linear-gradient(135deg, #FFF3E8, #FFE4CC)',
      border: `2px solid ${cfg.color}`,
      borderRadius: '20px', padding: '20px 24px',
      marginBottom: '20px', fontFamily: 'Nunito, sans-serif',
      boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', flexShrink: 0,
          boxShadow: `0 6px 16px ${cfg.color}40`,
        }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: cfg.color }}>
            🔄 Exchange — {cfg.label}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6B4E8A', fontWeight: '600' }}>
            {cfg.desc}
          </p>
        </div>
        <span style={{
          padding: '6px 14px', background: 'white', color: cfg.color,
          border: `2px solid ${cfg.color}40`,
          borderRadius: '999px', fontSize: '0.78rem', fontWeight: '900',
        }}>
          #{exchange.id?.slice(-8).toUpperCase()}
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: '12px', alignItems: 'center', marginBottom: '14px',
      }}>
        <div style={{ padding: '12px', background: 'white', border: '1.5px solid #FCA5A5', borderRadius: '12px', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', fontSize: '0.66rem', fontWeight: '900',
            background: '#EF4444', color: 'white',
            padding: '3px 10px', borderRadius: '999px', marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            ↩️ Returned
          </span>
          <img
            src={exchange.oldProductImage || 'https://via.placeholder.com/60'}
            alt={exchange.oldProductName}
            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto 6px', display: 'block' }}
          />
          <p style={{
            margin: '0 0 4px', fontSize: '0.78rem', fontWeight: '800', color: '#7F1D1D',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {exchange.oldProductName}
          </p>
          <strong style={{ color: '#DC2626', fontSize: '0.92rem' }}>
            ₹{exchange.oldPrice?.toLocaleString('en-IN')}
          </strong>
        </div>

        <div style={{ fontSize: '2rem', color: cfg.color, fontWeight: '900' }}>→</div>

        <div style={{ padding: '12px', background: 'white', border: '1.5px solid #A7F3D0', borderRadius: '12px', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', fontSize: '0.66rem', fontWeight: '900',
            background: '#10B981', color: 'white',
            padding: '3px 10px', borderRadius: '999px', marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            📦 Replacing
          </span>
          <img
            src={exchange.newProductImage || 'https://via.placeholder.com/60'}
            alt={exchange.newProductName}
            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', margin: '0 auto 6px', display: 'block' }}
          />
          <p style={{
            margin: '0 0 4px', fontSize: '0.78rem', fontWeight: '800', color: '#065F46',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {exchange.newProductName}
          </p>
          <strong style={{ color: '#10B981', fontSize: '0.92rem' }}>
            ₹{exchange.newPrice?.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

      {exchange.priceDifference !== 0 && (
        <div style={{
          padding: '10px 14px', background: 'white',
          border: `1.5px solid ${exchange.priceDifference > 0 ? '#FDE68A' : '#BFDBFE'}`,
          borderRadius: '10px', marginBottom: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '900', color: exchange.priceDifference > 0 ? '#92400E' : '#1E40AF' }}>
              💰 Price Difference
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6B7280', fontWeight: '600' }}>
              {exchange.priceDifference > 0
                ? 'You paid extra for this exchange'
                : 'Refunded to your original payment method'}
            </p>
          </div>
          <strong style={{ fontSize: '1.1rem', color: exchange.priceDifference > 0 ? '#F59E0B' : '#3B82F6' }}>
            {exchange.priceDifference > 0
              ? `+ ₹${exchange.priceDifference.toLocaleString('en-IN')}`
              : `− ₹${Math.abs(exchange.priceDifference).toLocaleString('en-IN')}`}
          </strong>
        </div>
      )}

      {exchange.status === 'awaiting_payment' && exchange.paymentLinkUrl && (
        <a
          href={exchange.paymentLinkUrl}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block', padding: '12px 20px',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white', borderRadius: '10px', textDecoration: 'none',
            textAlign: 'center', fontWeight: '900', fontSize: '0.92rem',
            marginBottom: '12px',
          }}
        >
          💳 Pay ₹{exchange.priceDifference} Now to Continue →
        </a>
      )}

      {isRejected && exchange.rejectionReason && (
        <div style={{
          padding: '12px 14px', background: '#FEE2E2',
          border: '1.5px solid #FCA5A5', borderRadius: '10px', marginBottom: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: '900', color: '#991B1B' }}>
            ❌ Reason: {exchange.rejectionReason}
          </p>
        </div>
      )}

      {isCompleted && (
        <div style={{
          padding: '14px', background: 'white',
          border: '2px solid #10B981', borderRadius: '10px',
          textAlign: 'center', marginBottom: '12px',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🎉</div>
          <p style={{ margin: 0, fontSize: '1rem', color: '#065F46', fontWeight: '900' }}>
            Exchange Completed Successfully!
          </p>
        </div>
      )}

      <Link href="/orders/exchanges" style={{
        display: 'block', padding: '10px', background: 'white',
        color: cfg.color, border: `1.5px solid ${cfg.color}40`,
        borderRadius: '10px', textDecoration: 'none',
        textAlign: 'center', fontWeight: '900', fontSize: '0.86rem',
      }}>
        👁️ View Full Exchange Details →
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════
   MODAL WRAPPERS
══════════════════════════════════════════ */
function ModalWrapper({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', fontFamily: 'Nunito, sans-serif',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'white', borderRadius: '20px',
        width: '100%', maxWidth: '520px', maxHeight: '92vh',
        overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.20)',
      }}>
        {children}
      </div>
    </div>
  );
}

function CloseBtn({ onClose, color = '#6B7280' }) {
  return (
    <button
      onClick={onClose}
      style={{
        background: 'white', border: '1.5px solid #E5E7EB',
        width: '36px', height: '36px', borderRadius: '50%',
        cursor: 'pointer', color, fontSize: '1rem', fontWeight: '800',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      ✕
    </button>
  );
}

/* ══════════════════════════════════════════
   CANCEL MODAL
══════════════════════════════════════════ */
function CancelOrderModal({ order, onClose, onSuccess }) {
  const [reason,       setReason]       = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading,      setLoading]      = useState(false);

  const CANCEL_REASONS = [
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Delivery taking too long',
    'Wrong product selected',
    'Quality concern',
    'No longer need it',
    'Payment failed / cannot pay',
    'Other',
  ];

  const getRefundMessage = () => {
    if (order.paymentStatus === 'failed' && !order.isPaid)
      return { type: 'info', icon: 'ℹ️', title: 'No refund needed', message: "You haven't paid yet — no refund required." };
    if (order.paymentMethod === 'COD')
      return { type: 'info', icon: 'ℹ️', title: 'No refund needed', message: "You haven't paid yet (Cash on Delivery)." };
    if (order.paymentMethod === 'Razorpay' && order.isPaid)
      return { type: 'success', icon: '💰', title: 'Auto-refund will be initiated', message: `₹${Math.round(order.totalPrice)?.toLocaleString('en-IN')} will be refunded within 5–7 business days.` };
    return null;
  };

  const refundMsg = getRefundMessage();

  const handleSubmit = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) { toast.error('Please select a reason'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('✅ Order cancelled!');
      if (data.refundType === 'razorpay') {
        setTimeout(() => toast.success('💰 Refund initiated!', { duration: 5000 }), 500);
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{
        padding: '22px 26px',
        background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
        borderRadius: '20px 20px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#DC2626' }}>
            ❌ Cancel Order
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#7F1D1D', fontWeight: '800', fontFamily: 'monospace' }}>
            {fmtOrderNum(order)}
          </p>
        </div>
        <CloseBtn onClose={onClose} color="#DC2626" />
      </div>

      <div style={{ padding: '22px 26px' }}>
        {refundMsg && (
          <div style={{
            padding: '14px 16px',
            background: refundMsg.type === 'success' ? '#F0FDF4' : '#EFF6FF',
            border: `1.5px solid ${refundMsg.type === 'success' ? '#BBF7D0' : '#BFDBFE'}`,
            borderRadius: '12px', marginBottom: '16px',
          }}>
            <p style={{
              margin: 0, fontSize: '0.86rem', fontWeight: '900',
              color: refundMsg.type === 'success' ? '#166534' : '#1E40AF',
            }}>
              {refundMsg.icon} {refundMsg.title}
            </p>
            <p style={{
              margin: '4px 0 0', fontSize: '0.80rem', fontWeight: '600', lineHeight: 1.5,
              color: refundMsg.type === 'success' ? '#047857' : '#1E40AF',
            }}>
              {refundMsg.message}
            </p>
          </div>
        )}

        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '900', color: '#1F2937', marginBottom: '10px' }}>
          Why cancelling? <span style={{ color: '#EF4444' }}>*</span>
        </label>

        <div style={{ display: 'grid', gap: '7px', marginBottom: '14px' }}>
          {CANCEL_REASONS.map(r => (
            <label key={r} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '11px 14px',
              background: reason === r ? '#FEF2F2' : 'white',
              border: `2px solid ${reason === r ? '#FCA5A5' : '#E5E7EB'}`,
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '0.88rem', fontWeight: '600', color: '#1F2937',
            }}>
              <input type="radio" name="cancelReason" value={r}
                checked={reason === r} onChange={e => setReason(e.target.value)}
                style={{ accentColor: '#EF4444' }} />
              {r}
            </label>
          ))}
        </div>

        {reason === 'Other' && (
          <textarea
            value={customReason} onChange={e => setCustomReason(e.target.value)}
            placeholder="Please tell us..."
            rows={2}
            style={{
              width: '100%', padding: '11px 13px',
              border: '2px solid #E5E7EB', borderRadius: '10px',
              fontFamily: 'inherit', fontSize: '0.86rem',
              resize: 'vertical', outline: 'none', marginBottom: '14px',
              boxSizing: 'border-box',
            }}
          />
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} disabled={loading} style={{
            flex: 1, padding: '13px', background: 'white',
            border: '2px solid #D1D5DB', borderRadius: '12px',
            fontWeight: '800', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Keep Order
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1.5, padding: '13px',
            background: loading ? '#FCA5A5' : 'linear-gradient(135deg, #EF4444, #DC2626)',
            color: 'white', border: 'none', borderRadius: '12px',
            fontWeight: '900', cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'inherit', boxShadow: '0 6px 18px rgba(239,68,68,0.30)',
          }}>
            {loading ? '⏳ Cancelling...' : '❌ Confirm Cancel'}
          </button>
               </div>
      </div>
    </ModalWrapper>
  );
}