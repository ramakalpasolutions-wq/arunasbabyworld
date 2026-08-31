'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { uploadFileToR2 } from '@/lib/uploadFile';
import { createPortal } from 'react-dom';

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
   PORTAL WRAPPER (Fixes Modal Trap)
══════════════════════════════════════════ */
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
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
              Live Updates
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

  const canCancel = !isCancelled && !isPaymentFailed &&
                    ['Pending', 'Confirmed', 'Processing'].includes(order.orderStatus);
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
                  background: downloadingInvoice ? '#F3F4F6' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: downloadingInvoice ? '#9CA3AF' : 'white',
                  border: 'none', borderRadius: '12px',
                  fontWeight: '800', fontSize: '0.85rem',
                  cursor: downloadingInvoice ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: downloadingInvoice ? 'none' : '0 4px 12px rgba(16,185,129,0.25)',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                {downloadingInvoice ? '⏳ Generating...' : '📄 Invoice'}
              </button>
            )}

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
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontWeight: '800', fontSize: '0.85rem', textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(255,107,53,0.30)',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  🔄 Exchange Item
                </Link>
              );
            })()}

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
            borderRadius: '24px', padding: '24px', marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', flexShrink: 0,
              }}>
                ❌
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 6px', color: '#991B1B', fontSize: '1.2rem', fontWeight: '900' }}>Payment Failed</h3>
                <p style={{ margin: 0, color: '#7F1D1D', fontSize: '0.9rem', fontWeight: '600' }}>
                  Your payment couldn't be completed.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleRetryPayment}
                disabled={retrying}
                style={{
                  flex: '1 1 200px', padding: '14px 20px',
                  background: retrying ? '#F3F4F6' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: retrying ? '#9CA3AF' : 'white', border: 'none', borderRadius: '12px',
                  fontWeight: '900', fontSize: '0.95rem', cursor: retrying ? 'not-allowed' : 'pointer',
                }}
              >
                {retrying ? '⏳ Opening...' : `🔄 Retry Payment`}
              </button>
            </div>
          </div>
        )}

        {/* ═══ MAIN CONTENT GRID ═══ */}
        <div className="orderGrid">
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
                    fontSize: '1.4rem', boxShadow: `0 4px 12px ${statusColor}40`,
                  }}>🎯</div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1F0F3A', margin: 0 }}>Order Progress</h3>
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
                            background: isDone ? '#10B981' : isCurrent ? statusColor : '#F3F4F6',
                            color: isDone || isCurrent ? 'white' : '#9CA3AF',
                            fontWeight: '900', border: '3px solid white',
                          }}>
                            {isDone ? '✓' : STATUS_EMOJI[step]}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div style={{
                              width: '3px', height: '36px',
                              background: isDone ? '#10B981' : '#E5E7EB',
                              margin: '4px 0', borderRadius: '999px',
                            }} />
                          )}
                        </div>
                        <div style={{ paddingTop: '14px', paddingBottom: i < STATUS_STEPS.length - 1 ? '20px' : '0', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <p style={{
                              fontSize: '1rem', fontWeight: isCurrent ? '900' : isDone ? '800' : '700',
                              color: isCurrent ? statusColor : isDone ? '#10B981' : '#9CA3AF', margin: 0,
                            }}>{step}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                  fontSize: '1.4rem', boxShadow: '0 4px 12px rgba(123,47,190,0.30)',
                }}>🛍️</div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1F0F3A', margin: 0 }}>Ordered Items</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#7B7898', fontWeight: '600' }}>
                    {order.orderItems?.length} product(s)
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
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* PRICE SUMMARY */}
            <div style={{
              background: 'white', borderRadius: '24px',
              padding: '24px', boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
              border: '1px solid rgba(123,47,190,0.08)',
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1F0F3A', marginBottom: '18px' }}>Price Details</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #F3E8FF' }}>
                <span style={{ fontSize: '0.85rem', color: '#6B4E8A', fontWeight: '600' }}>Items Total</span>
                <span style={{ fontSize: '0.90rem', fontWeight: '800', color: '#2D1A4A' }}>₹{Math.round(order.itemsPrice)?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #F3E8FF' }}>
                <span style={{ fontSize: '0.85rem', color: '#6B4E8A', fontWeight: '600' }}>Shipping</span>
                <span style={{ fontSize: '0.90rem', fontWeight: '800', color: order.shippingPrice === 0 ? '#10B981' : '#2D1A4A' }}>
                  {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 14px', marginTop: '10px', background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
                borderRadius: '14px', border: '1.5px solid #FFE4EC',
              }}>
                <span style={{ fontWeight: '900', color: '#2D1A4A', fontSize: '1rem' }}>Total</span>
                <strong style={{ fontSize: '1.6rem', color: '#FF6B35', fontWeight: '900' }}>
                  ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* DELIVERY ADDRESS */}
            <div style={{
              background: 'white', borderRadius: '24px', padding: '24px',
              boxShadow: '0 8px 32px rgba(123,47,190,0.08)', border: '1px solid rgba(123,47,190,0.08)',
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1F0F3A', marginBottom: '18px' }}>Delivery Address</h3>
              {order.shippingAddress ? (
                <div style={{
                  padding: '16px', background: 'linear-gradient(135deg, #F0F9FF, #EDE9FE)',
                  borderRadius: '14px', border: '1.5px solid #BAE6FD',
                }}>
                  <p style={{ fontWeight: '900', color: '#1F0F3A', margin: '0 0 6px', fontSize: '1rem' }}>{order.shippingAddress.name}</p>
                  <p style={{ color: '#5B21B6', margin: '0 0 4px', fontSize: '0.85rem', fontWeight: '700' }}>📞 {order.shippingAddress.phone}</p>
                  <p style={{ color: '#6B4E8A', margin: '0 0 4px', fontSize: '0.85rem', fontWeight: '600' }}>🏠 {order.shippingAddress.address}</p>
                  <p style={{ color: '#6B4E8A', margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>
                    {order.shippingAddress.city}, {order.shippingAddress.state} — <strong>{order.shippingAddress.pincode}</strong>
                  </p>
                </div>
              ) : <p style={{ color: '#9CA3AF' }}>No address</p>}
            </div>
            
          </div>
        </div>

        {/* MODALS */}
        {showCancelModal && (
          <Portal>
            <CancelOrderModal
              order={order}
              onClose={() => setShowCancelModal(false)}
              onSuccess={() => { setShowCancelModal(false); fetchOrder(); }}
            />
          </Portal>
        )}

        <style>{`
          .orderGrid {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 20px;
          }
          @media (max-width: 900px) {
            .orderGrid {
              grid-template-columns: 1fr;
            }
          }
          
          /* OrderItemCard Responsive Styles */
          .order-item-link {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px 18px;
            text-decoration: none;
            flex-wrap: wrap; /* Allows wrapping on small screens */
          }
          .order-item-subtotal {
            text-align: right;
            flex-shrink: 0;
            padding-left: 14px;
            border-left: 2px dashed #F3E8FF;
            margin-left: auto;
          }

          @media (max-width: 500px) {
            .order-item-subtotal {
              width: 100%;
              text-align: left;
              padding-left: 0;
              border-left: none;
              padding-top: 10px;
              margin-top: 10px;
              border-top: 2px dashed #F3E8FF;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ORDER ITEM CARD (Fix: Removed CSS Trap & Added Portal)
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
      // ❌ VERY IMPORTANT: NO "overflow: hidden" HERE!
      // ❌ VERY IMPORTANT: NO "transform" HERE!
      transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      boxShadow: isHovered ? '0 10px 30px rgba(123,47,190,0.15)' : '0 2px 8px rgba(123,47,190,0.05)',
      display: 'flex',
      flexDirection: 'column',
    }}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={productId ? `/products/${productId}` : '#'} className="order-item-link">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '84px', height: '84px',
            borderRadius: '14px', overflow: 'hidden',
            border: '2px solid #F3E8FF', background: '#FAFAFA',
          }}>
            <img src={item.image || 'https://via.placeholder.com/84'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{
            position: 'absolute', top: '-6px', right: '-6px', minWidth: '28px', height: '28px',
            padding: '0 8px', borderRadius: '999px', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            color: 'white', fontSize: '0.75rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid white', boxShadow: '0 3px 8px rgba(123,47,190,0.35)',
          }}>×{item.quantity}</div>
        </div>

        <div style={{ flex: '1 1 150px', minWidth: 0 }}>
          <p style={{
            fontSize: '0.95rem', fontWeight: '800', color: isHovered ? '#7B2FBE' : '#1F0F3A',
            margin: '0 0 6px', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', transition: 'color 0.2s',
          }}>
            {item.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', background: '#F3E8FF', color: '#7B2FBE', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800' }}>
              ₹{item.price?.toLocaleString('en-IN')} each
            </span>
          </div>
        </div>

        <div className="order-item-subtotal">
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#9585B0', fontWeight: '800', textTransform: 'uppercase' }}>Subtotal</p>
          <strong style={{
            fontSize: '1.2rem', color: '#FF6B35', fontWeight: '900', display: 'block', marginTop: '2px',
          }}>
            ₹{itemTotal.toLocaleString('en-IN')}
          </strong>
        </div>
      </Link>

      {isDelivered && productId && (
        <div style={{
          padding: '12px 18px',
          background: existingReview ? 'linear-gradient(135deg, #F0FDF4, #ECFDF5)' : 'linear-gradient(135deg, #FFF9FB, #FFF5F7)',
          borderTop: `1.5px dashed ${existingReview ? '#86EFAC' : '#F9A8D4'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', flexWrap: 'wrap', borderRadius: '0 0 14px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: existingReview ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #FBBF24, #F59E0B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.95rem', color: 'white', fontWeight: '900', flexShrink: 0,
            }}>
              {existingReview ? '✓' : '⭐'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: existingReview ? '#065F46' : '#BE185D' }}>
                {existingReview ? 'Your Review Posted' : 'Share Your Experience'}
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#9585B0', fontWeight: '600' }}>
                {existingReview ? 'Thanks for your feedback!' : 'Help others make the right choice'}
              </p>
            </div>
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
              borderRadius: '10px', fontSize: '0.78rem', fontWeight: '900',
              cursor: loadingReview ? 'wait' : 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {loadingReview ? '⏳' : existingReview ? '✏️ Edit' : '⭐ Review'}
          </button>
        </div>
      )}

      {/* ✅ RENDERS OUTSIDE THE CARD TO AVOID CSS CLIPPING TRAPS */}
      {showReviewModal && (
        <Portal>
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
        </Portal>
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
    <div style={{
      background: 'rgba(0,0,0,0.55)', position: 'fixed', inset: 0,
      zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px',
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.20)',
        position: 'relative', // Ensures modal contents are placed properly
      }}>
        <div style={{
          padding: '24px 26px', borderBottom: '1px solid #FFE4EC',
          background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)', borderRadius: '20px 20px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#BE185D' }}>
              {existingReview ? '✏️ Edit Review' : '⭐ Write Review'}
            </h2>
          </div>
          <CloseBtn onClose={onClose} color="#BE185D" />
        </div>

        <div style={{ padding: '22px 26px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 16px', background: '#F9FAFB',
            border: '1.5px solid #E5E7EB', borderRadius: '14px', marginBottom: '20px',
          }}>
            {productImage && (
              <img src={productImage} alt={productName} style={{
                width: '56px', height: '56px', objectFit: 'cover',
                borderRadius: '10px', flexShrink: 0, border: '2px solid #F3E8FF',
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: '0.88rem', fontWeight: '800', color: '#1F2937',
                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>{productName}</p>
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
                    key={s} type="button" onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '2.4rem',
                      color: s <= (hover || rating) ? '#FBBF24' : '#E5E7EB', padding: '2px', lineHeight: 1,
                    }}
                  >★</button>
                ))}
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
                  width: '100%', padding: '12px 14px', border: '2px solid #EDD9FF', borderRadius: '10px',
                  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#6B4E8A', marginBottom: '8px', display: 'block' }}>
                Your Review <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Share your experience..." rows={4} maxLength={1000} required
                style={{
                  width: '100%', padding: '12px 14px', border: '2px solid #EDD9FF', borderRadius: '10px',
                  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={onClose} disabled={submitting} style={{
                padding: '13px 22px', background: 'white', border: '2px solid #E5E7EB', borderRadius: '12px',
                color: '#6B7280', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
              <button type="submit" disabled={submitting || uploading} style={{
                flex: 1, padding: '13px 22px', background: submitting ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
                {submitting ? '⏳ Posting...' : existingReview ? '💾 Update' : '✨ Post Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CloseBtn({ onClose, color = '#6B7280' }) {
  return (
    <button
      onClick={onClose}
      type="button"
      style={{
        background: 'white', border: '1.5px solid #E5E7EB',
        width: '36px', height: '36px', borderRadius: '50%',
        cursor: 'pointer', color, fontSize: '1rem', fontWeight: '800',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >✕</button>
  );
}

/* Cancel Order & Exchange Status Components remain the same ... */
/* ══════════════════════════════════════════
   CANCEL ORDER MODAL COMPONENT
══════════════════════════════════════════ */
function CancelOrderModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState('Changed my mind');
  const [customReason, setCustomReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);

  const isCOD = order?.paymentMethod === 'COD';
  const isDelivered = order?.orderStatus === 'Delivered' || order?.isDelivered;
  const requiresBankDetails = isCOD && isDelivered;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalReason = reason === 'Other' ? customReason : reason;

    const body = {
      reason: finalReason,
    };

    if (requiresBankDetails) {
      body.bankDetails = {
        refundMethod,
        upiId: refundMethod === 'upi' ? upiId : undefined,
        accountHolderName: refundMethod === 'bank' ? accountHolderName : undefined,
        accountNumber: refundMethod === 'bank' ? accountNumber : undefined,
        ifscCode: refundMethod === 'bank' ? ifscCode : undefined,
        bankName: refundMethod === 'bank' ? bankName : undefined,
      };
    }

    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');

      toast.success('🎉 Order cancelled successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)', position: 'fixed', inset: 0,
      zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', backdropFilter: 'blur(5px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        fontFamily: 'Nunito, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1.5px solid #F3E8FF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
          borderRadius: '24px 24px 0 0',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: '#1F0F3A' }}>
            Cancel Order
          </h3>
          <button onClick={onClose} style={{
            background: 'white', border: '1px solid #E5E7EB',
            width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
            fontWeight: 'bold', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#6B4E8A', marginBottom: '8px', display: 'block' }}>
              Reason for Cancellation
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                width: '100%', padding: '12px', border: '2px solid #EDD9FF', borderRadius: '12px',
                fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', background: 'white',
              }}
            >
              <option value="Changed my mind">Changed my mind</option>
              <option value="Ordered wrong item/size">Ordered wrong item/size</option>
              <option value="Found a better price elsewhere">Found a better price elsewhere</option>
              <option value="Delivery taking too long">Delivery taking too long</option>
              <option value="Other">Other (Please specify)</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#6B4E8A', marginBottom: '8px', display: 'block' }}>
                Specify Reason
              </label>
              <input
                type="text"
                required
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Please specify why you are cancelling..."
                style={{
                  width: '100%', padding: '12px', border: '2px solid #EDD9FF', borderRadius: '12px',
                  fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {requiresBankDetails && (
            <div style={{
              background: '#F9F6FF', border: '1.5px dashed #D6BCFA', borderRadius: '16px',
              padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: '#5B21B6' }}>
                💵 COD Refund Details Required
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#6B7280', fontWeight: '600' }}>
                Since this is a cash-on-delivery order, please select your preferred refund method:
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRefundMethod('upi')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800',
                    cursor: 'pointer', border: refundMethod === 'upi' ? '2px solid #7B2FBE' : '1px solid #E5E7EB',
                    background: refundMethod === 'upi' ? '#F3E8FF' : 'white',
                    color: refundMethod === 'upi' ? '#7B2FBE' : '#6B7280',
                  }}
                >
                  UPI Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('bank')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800',
                    cursor: 'pointer', border: refundMethod === 'bank' ? '2px solid #7B2FBE' : '1px solid #E5E7EB',
                    background: refundMethod === 'bank' ? '#F3E8FF' : 'white',
                    color: refundMethod === 'bank' ? '#7B2FBE' : '#6B7280',
                  }}
                >
                  Bank Transfer
                </button>
              </div>

              {refundMethod === 'upi' ? (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', display: 'block' }}>
                    UPI ID (e.g. name@upi)
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="Enter your UPI ID"
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #EDD9FF', borderRadius: '10px',
                      fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px', display: 'block' }}>
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={e => setAccountHolderName(e.target.value)}
                      placeholder="Full Name"
                      style={{
                        width: '100%', padding: '10px', border: '2px solid #EDD9FF', borderRadius: '10px',
                        fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px', display: 'block' }}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      style={{
                        width: '100%', padding: '10px', border: '2px solid #EDD9FF', borderRadius: '10px',
                        fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px', display: 'block' }}>
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        required
                        value={ifscCode}
                        onChange={e => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="IFSC Code"
                        style={{
                          width: '100%', padding: '10px', border: '2px solid #EDD9FF', borderRadius: '10px',
                          fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px', display: 'block' }}>
                        Bank Name
                      </label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="Bank Name"
                        style={{
                          width: '100%', padding: '10px', border: '2px solid #EDD9FF', borderRadius: '10px',
                          fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, padding: '12px', background: 'white', border: '2px solid #E5E7EB',
                borderRadius: '12px', color: '#6B7280', fontSize: '0.9rem', fontWeight: '800',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.9rem',
                fontWeight: '900', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              }}
            >
              {loading ? '⏳ Processing...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



function ExchangeStatusBanner({ orderId, exchangeId }) {
   return null;
}