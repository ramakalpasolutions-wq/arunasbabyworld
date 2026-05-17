'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const router = useRouter();

  const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

  const STATUS_COLOR = {
    Pending:    '#f59e0b',
    Confirmed:  '#3b82f6',
    Processing: '#8b5cf6',
    Shipped:    '#06b6d4',
    Delivered:  '#10b981',
    Cancelled:  '#ef4444',
    Refunded:   '#6b7280',
  };

  const STATUS_EMOJI = {
    Pending:    '📋',
    Confirmed:  '✅',
    Processing: '⚙️',
    Shipped:    '🚚',
    Delivered:  '🎉',
    Cancelled:  '❌',
    Refunded:   '↩️',
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) { setError('Please enter your Order ID'); return; }
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res  = await fetch(`/api/orders/${orderId.trim()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Order not found');
      setOrder(data.order);
    } catch (err) {
      setError(err.message || 'Order not found. Please check your Order ID.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.orderStatus) : -1;
  const isCancelled = order?.orderStatus === 'Cancelled' || order?.orderStatus === 'Refunded';

  return (
    <MainLayout>
      <div style={{
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #FFF5EE 0%, #F3E8FF 100%)',
        padding: 'clamp(32px,6vw,80px) 20px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>📦</div>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 10px', fontFamily: 'Nunito, sans-serif' }}>
              Track Your Order
            </h1>
            <p style={{ fontSize: '1rem', color: '#6B4E8A', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
              Enter your Order ID to see live tracking status
            </p>
          </div>

          {/* Search Box */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: 'clamp(24px,4vw,40px)',
            boxShadow: '0 20px 60px rgba(123,47,190,0.10)',
            marginBottom: '28px',
          }}>
            <form onSubmit={handleTrack}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', fontFamily: 'Nunito, sans-serif' }}>
                Order ID
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="Enter your Order ID (e.g. 6a05556f...)"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '14px 18px',
                    border: '2px solid #EDD9FF',
                    borderRadius: '14px',
                    fontSize: '0.95rem',
                    fontFamily: 'Nunito, sans-serif',
                    outline: 'none',
                    color: '#2D1A4A',
                    background: '#FDFAFF',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '14px 28px',
                    background: loading ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 20px rgba(255,107,53,0.25)',
                  }}
                >
                  {loading ? '⏳ Searching...' : '🔍 Track Order'}
                </button>
              </div>

              {error && (
                <div style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  background: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: '10px',
                  color: '#DC2626',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  fontFamily: 'Nunito, sans-serif',
                }}>
                  ❌ {error}
                </div>
              )}
            </form>

            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '10px', fontSize: '0.82rem', color: '#166534', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
              💡 You can find your Order ID in your email confirmation or in your{' '}
              <Link href="/profile" style={{ color: '#059669', fontWeight: '800' }}>Profile → Orders</Link>
            </div>
          </div>

          {/* Order Result */}
          {order && (
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: 'clamp(24px,4vw,40px)',
              boxShadow: '0 20px 60px rgba(123,47,190,0.10)',
            }}>
              {/* Order Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #F3E8FF' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>
                    Order #{order.id?.slice(-12).toUpperCase()}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#9585B0', fontWeight: '600', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  background: `${STATUS_COLOR[order.orderStatus]}15`,
                  border: `2px solid ${STATUS_COLOR[order.orderStatus]}40`,
                  borderRadius: '999px',
                  color: STATUS_COLOR[order.orderStatus],
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  fontFamily: 'Nunito, sans-serif',
                }}>
                  <span>{STATUS_EMOJI[order.orderStatus]}</span>
                  <span>{order.orderStatus}</span>
                </div>
              </div>

              {/* Live Tracking Timeline */}
              {!isCancelled ? (
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 24px', fontFamily: 'Nunito, sans-serif' }}>
                    🔴 Live Tracking
                  </h3>

                  {/* Timeline */}
                  <div style={{ position: 'relative' }}>
                    {STATUS_STEPS.map((step, i) => {
                      const isDone    = i < currentStep;
                      const isCurrent = i === currentStep;
                      const isPending = i > currentStep;

                      return (
                        <div
                          key={step}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            marginBottom: i < STATUS_STEPS.length - 1 ? '0' : '0',
                            position: 'relative',
                          }}
                        >
                          {/* Left — Circle + Line */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                            {/* Circle */}
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isCurrent ? '1.3rem' : '1rem',
                              fontWeight: '800',
                              background: isDone
                                ? '#10B981'
                                : isCurrent
                                  ? STATUS_COLOR[order.orderStatus]
                                  : '#F3F4F6',
                              color: isDone || isCurrent ? 'white' : '#9CA3AF',
                              boxShadow: isCurrent
                                ? `0 0 0 4px ${STATUS_COLOR[order.orderStatus]}25`
                                : isDone
                                  ? '0 4px 12px rgba(16,185,129,0.25)'
                                  : 'none',
                              transition: 'all 0.3s ease',
                              animation: isCurrent ? 'pulse 2s ease-in-out infinite' : 'none',
                            }}>
                              {isDone ? '✓' : STATUS_EMOJI[step]}
                            </div>

                            {/* Vertical Line */}
                            {i < STATUS_STEPS.length - 1 && (
                              <div style={{
                                width: '2px',
                                height: '36px',
                                background: isDone
                                  ? '#10B981'
                                  : '#E5E7EB',
                                marginTop: '4px',
                                marginBottom: '4px',
                                transition: 'all 0.3s ease',
                              }} />
                            )}
                          </div>

                          {/* Right — Content */}
                          <div style={{ paddingTop: '10px', paddingBottom: i < STATUS_STEPS.length - 1 ? '20px' : '0' }}>
                            <p style={{
                              fontSize: '0.95rem',
                              fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                              color: isCurrent
                                ? STATUS_COLOR[order.orderStatus]
                                : isDone
                                  ? '#10B981'
                                  : '#9CA3AF',
                              margin: '0 0 2px',
                              fontFamily: 'Nunito, sans-serif',
                            }}>
                              {step}
                              {isCurrent && (
                                <span style={{
                                  marginLeft: '8px',
                                  fontSize: '0.70rem',
                                  background: `${STATUS_COLOR[order.orderStatus]}20`,
                                  color: STATUS_COLOR[order.orderStatus],
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontWeight: '800',
                                }}>
                                  ● Current
                                </span>
                              )}
                            </p>
                            <p style={{
                              fontSize: '0.78rem',
                              color: '#9CA3AF',
                              margin: 0,
                              fontWeight: '500',
                              fontFamily: 'Nunito, sans-serif',
                            }}>
                              {isDone ? '✅ Completed'
                                : isCurrent ? 'In progress...'
                                : 'Upcoming'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '28px', padding: '20px', background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '2rem' }}>❌</span>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#DC2626', fontFamily: 'Nunito, sans-serif' }}>Order {order.orderStatus}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#6B7280', fontFamily: 'Nunito, sans-serif' }}>
                      This order has been {order.orderStatus.toLowerCase()}. If you paid, refund will be processed within 5–7 business days.
                    </p>
                  </div>
                </div>
              )}

              {/* Tracking Number */}
              {order.trackingNumber && (
                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #E0F2FE, #EDE9FE)', border: '1.5px solid #7DD3FC', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>
                      📦 Tracking Number
                    </p>
                    <p style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0369A1', fontSize: '1.1rem', margin: 0 }}>
                      {order.trackingNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(order.trackingNumber); }}
                    style={{ padding: '8px 16px', background: '#0369A1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.80rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                  >
                    📋 Copy
                  </button>
                </div>
              )}

              {/* Order Items */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 14px', fontFamily: 'Nunito, sans-serif' }}>
                  🛍️ Items Ordered ({order.orderItems?.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.orderItems?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F3E8FF' }}>
                      <img
                        src={item.image || 'https://via.placeholder.com/56'}
                        alt={item.name}
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.90rem', fontWeight: '700', color: '#2D1A4A', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>
                          {item.name}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: '#9585B0', margin: 0, fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
                          Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <strong style={{ color: '#FF6B35', fontFamily: 'Nunito, sans-serif', whiteSpace: 'nowrap' }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: '16px 20px', background: '#F8F4FF', borderRadius: '16px', border: '1.5px solid #EDD9FF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.88rem', color: '#6B4E8A', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>Items</span>
                  <span style={{ fontSize: '0.88rem', color: '#2D1A4A', fontFamily: 'Nunito, sans-serif', fontWeight: '700' }}>₹{order.itemsPrice?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.88rem', color: '#6B4E8A', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>Shipping</span>
                  <span style={{ fontSize: '0.88rem', color: order.shippingPrice === 0 ? '#10B981' : '#2D1A4A', fontFamily: 'Nunito, sans-serif', fontWeight: '700' }}>
                    {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.88rem', color: '#059669', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>Discount ({order.couponCode})</span>
                    <span style={{ fontSize: '0.88rem', color: '#059669', fontFamily: 'Nunito, sans-serif', fontWeight: '700' }}>− ₹{order.discountAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #EDD9FF', marginTop: '4px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', fontFamily: 'Nunito, sans-serif' }}>Total</span>
                  <strong style={{ fontSize: '1.1rem', color: '#FF6B35', fontFamily: 'Nunito, sans-serif' }}>
                    ₹{order.totalPrice?.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Delivery Address */}
              {order.shippingAddress && (
                <div style={{ marginTop: '20px', padding: '16px 20px', background: '#F0FDF4', borderRadius: '16px', border: '1.5px solid #BBF7D0' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 10px', fontFamily: 'Nunito, sans-serif' }}>
                    📍 Delivery Address
                  </h3>
                  <p style={{ margin: '0 0 3px', fontWeight: '700', color: '#2D1A4A', fontFamily: 'Nunito, sans-serif' }}>
                    {order.shippingAddress.name}
                  </p>
                  <p style={{ margin: '0 0 3px', fontSize: '0.88rem', color: '#4B5563', fontFamily: 'Nunito, sans-serif' }}>
                    {order.shippingAddress.phone}
                  </p>
                  <p style={{ margin: '0 0 3px', fontSize: '0.88rem', color: '#4B5563', fontFamily: 'Nunito, sans-serif' }}>
                    {order.shippingAddress.address}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#4B5563', fontFamily: 'Nunito, sans-serif' }}>
                    {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                  </p>
                </div>
              )}

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                <Link
                  href="/products"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 20px', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '0.88rem', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}
                >
                  🛍️ Continue Shopping
                </Link>
                <Link
                  href="/contact"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 20px', background: 'white', color: '#7B2FBE', border: '2px solid #EDD9FF', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '0.88rem', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}
                >
                  💬 Contact Support
                </Link>
              </div>
            </div>
          )}

          {/* Login prompt if not tracked yet */}
          {!order && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '24px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 40px rgba(123,47,190,0.08)' }}>
              <p style={{ color: '#9585B0', fontWeight: '600', marginBottom: '16px', fontFamily: 'Nunito, sans-serif' }}>
                Already have an account?
              </p>
              <Link
                href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: 'linear-gradient(135deg, #7B2FBE, #9B4FDE)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '0.92rem', fontFamily: 'Nunito, sans-serif' }}
              >
                🔐 Login to View All Orders
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(255,107,53,0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(255,107,53,0.08); }
        }
      `}</style>
    </MainLayout>
  );
}