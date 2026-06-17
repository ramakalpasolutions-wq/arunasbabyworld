'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const REASONS = [
  { label: 'Size issue — too big / too small', emoji: '📏' },
  { label: 'Color mismatch — different from photo', emoji: '🎨' },
  { label: 'Wrong product received', emoji: '📦' },
  { label: 'Product damaged / defective', emoji: '💔' },
  { label: 'Quality issue — not as expected', emoji: '⚠️' },
  { label: 'Want different variant', emoji: '🔄' },
  { label: 'Changed my mind', emoji: '💭' },
  { label: 'Other', emoji: '✏️' },
];

export default function ExchangeRequestClient({ id }) {
  const router = useRouter();

  /* ── State ── */
  const [order, setOrder]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);

  // Form state
  const [step, setStep]                   = useState(1); // 1: pick old item, 2: pick new product, 3: reason
  const [oldItem, setOldItem]             = useState(null);
  const [newProduct, setNewProduct]       = useState(null);
  const [reason, setReason]               = useState('');
  const [customReason, setCustomReason]   = useState('');
  const [description, setDescription]     = useState('');

  // Product browser
  const [products, setProducts]           = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categories, setCategories]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');

  useEffect(() => { fetchOrder(); fetchCategories(); }, [id]);

  /* ── Fetch order ── */
  const fetchOrder = async () => {
    try {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch categories ── */
  const fetchCategories = async () => {
    try {
      const res  = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch { /* ignore */ }
  };

  /* ── Fetch products when category changes ── */
  useEffect(() => {
    if (step !== 2) return;

    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '24',
          ...(selectedCategory !== 'all' && { category: selectedCategory }),
          ...(searchQuery && { search: searchQuery }),
        });
        const res  = await fetch(`/api/products?${params}`);
        const data = await res.json();
        setProducts((data.products || []).filter(p => p.stock > 0));
      } catch {
        toast.error('Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [step, selectedCategory, searchQuery]);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!oldItem || !newProduct) {
      toast.error('Please select both products');
      return;
    }
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason?.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:      id,
          oldProductId: oldItem.productId,
          newProductId: newProduct.id,
          reason:       finalReason,
          description:  description || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      toast.success('✅ Exchange request submitted!', { duration: 4000 });

      // Handle price difference outcomes
      if (data.requiresPayment && data.paymentLink) {
        setTimeout(() => {
          toast('💰 Redirecting to payment...', { duration: 3000, icon: '🔗' });
        }, 600);

        setTimeout(() => {
          window.location.href = data.paymentLink;
        }, 2500);
      } else if (data.autoRefunded) {
        setTimeout(() => {
          toast.success(`💸 ₹${Math.abs(data.priceDifference)} refund initiated for price difference!`, {
            duration: 5000,
          });
        }, 600);

        setTimeout(() => router.push(`/orders/${id}`), 2500);
      } else {
        setTimeout(() => router.push(`/orders/${id}`), 1500);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Price difference ── */
  const priceDifference = oldItem && newProduct
    ? (newProduct.discountPrice || newProduct.price) - (oldItem.price || 0)
    : 0;

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid #FFF3E8', borderTop: '4px solid #FF6B35',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#9585B0', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>
          Loading order...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Not found ── */
  if (!order) {
    return <NotEligible icon="📦" title="Order not found" message="" orderId={id} />;
  }

  /* ── Eligibility ── */
  const isDelivered = order.isDelivered || order.orderStatus === 'Delivered';
  if (!isDelivered) {
    return <NotEligible
      icon="⏳"
      title="Order Not Delivered Yet"
      message="Exchange can only be requested after delivery."
      orderId={id}
    />;
  }

  // 3-day window check
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
  const now         = new Date();
  const daysSince   = Math.floor((now - deliveredAt) / (1000 * 60 * 60 * 24));
  const hoursLeft   = Math.max(0, Math.floor((deliveredAt.getTime() + (3 * 24 * 60 * 60 * 1000) - now.getTime()) / (1000 * 60 * 60)));

  if (daysSince > 3) {
    return <NotEligible
      icon="⏰"
      title="Exchange Window Expired"
      message={`Exchanges are allowed within 3 days of delivery only. (${daysSince} days have passed)`}
      orderId={id}
    />;
  }

  if (order.exchangeId && !['rejected', 'completed', 'cancelled'].includes(order.exchangeStatus)) {
    return <NotEligible
      icon="🔄"
      title="Exchange Already in Progress"
      message="You already have an active exchange request for this order."
      orderId={id}
    />;
  }

  /* ── Render ── */
  return (
    <div style={{
      maxWidth: '1100px', margin: '0 auto',
      padding: 'clamp(24px,4vw,40px) 20px',
      fontFamily: 'Nunito, sans-serif',
    }}>

      {/* ── Back link ── */}
      <Link href={`/orders/${id}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: '#FF6B35', textDecoration: 'none', fontWeight: '700',
        fontSize: '0.88rem', marginBottom: '20px',
      }}>
        ← Back to Order
      </Link>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF3E8 0%, #FFE4CC 100%)',
        borderRadius: '24px', padding: 'clamp(24px,3vw,36px)',
        marginBottom: '20px',
        border: '1.5px solid #FFD4B8',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔄</div>
        <h1 style={{
          fontSize: 'clamp(1.5rem,2.5vw,2rem)',
          fontWeight: '800', color: '#2D1A4A', margin: '0 0 6px',
        }}>
          Exchange Product
        </h1>
        <p style={{ color: '#7C2D12', margin: 0, fontSize: '0.92rem', fontWeight: '600' }}>
          Order #{order.id?.slice(-12).toUpperCase()}
        </p>
      </div>

      {/* ── 3-day window warning ── */}
      <div style={{
        background: hoursLeft <= 12 ? '#FEF2F2' : '#FFFBEB',
        border: `1.5px solid ${hoursLeft <= 12 ? '#FCA5A5' : '#FDE68A'}`,
        borderRadius: '14px', padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '1.5rem' }}>⏰</span>
        <div style={{ flex: 1 }}>
          <strong style={{ color: hoursLeft <= 12 ? '#DC2626' : '#92400E', fontSize: '0.92rem' }}>
            Exchange Window: {hoursLeft <= 24 ? `${hoursLeft} hours left` : `${3 - daysSince} day(s) left`}
          </strong>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: hoursLeft <= 12 ? '#991B1B' : '#78350F', fontWeight: '600' }}>
            Exchanges allowed within 3 days of delivery only
          </p>
        </div>
      </div>

      {/* ── Step Progress ── */}
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '16px 20px', marginBottom: '20px',
        border: '1.5px solid #F3E8FF',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '12px',
        flexWrap: 'wrap',
      }}>
        {[
          { num: 1, label: 'Select Item to Return',  done: !!oldItem },
          { num: 2, label: 'Pick New Product',       done: !!newProduct },
          { num: 3, label: 'Provide Reason',         done: !!reason },
        ].map((s, i, arr) => (
          <div key={s.num} style={{
            display: 'flex', alignItems: 'center', gap: '10px', flex: 1,
            minWidth: '170px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: s.done
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : step === s.num
                  ? 'linear-gradient(135deg, #FF6B35, #7B2FBE)'
                  : '#E5E7EB',
              color: s.done || step === s.num ? 'white' : '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '0.86rem',
              flexShrink: 0,
            }}>
              {s.done ? '✓' : s.num}
            </div>
            <span style={{
              fontSize: '0.84rem',
              fontWeight: '700',
              color: s.done ? '#10B981' : step === s.num ? '#FF6B35' : '#9CA3AF',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ═════ STEP 1: Select OLD item ═════ */}
      <div style={{
        background: 'white', borderRadius: '20px',
        padding: '24px', marginBottom: '20px',
        border: `2px solid ${oldItem ? '#10B981' : '#F3E8FF'}`,
        boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px', flexWrap: 'wrap', gap: '8px',
        }}>
          <h3 style={{
            margin: 0, fontSize: '1.05rem', fontWeight: '800',
            color: '#2D1A4A',
          }}>
            1️⃣ Select item to return
          </h3>
          {oldItem && (
            <button onClick={() => { setOldItem(null); setStep(1); }} style={{
              background: '#FEF2F2', color: '#EF4444',
              border: '1px solid #FCA5A5', borderRadius: '8px',
              padding: '4px 12px', fontSize: '0.78rem', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Change
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {order.orderItems?.map((item, i) => {
            const selected = oldItem === item;
            return (
              <button
                key={i}
                onClick={() => {
                  setOldItem(item);
                  setStep(2);
                  setTimeout(() => window.scrollTo({ top: 600, behavior: 'smooth' }), 100);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px',
                  background: selected ? '#ECFDF5' : 'white',
                  border: `2px solid ${selected ? '#10B981' : '#F3E8FF'}`,
                  borderRadius: '14px', cursor: 'pointer',
                  textAlign: 'left', width: '100%',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}
              >
                <img
                  src={item.image || 'https://via.placeholder.com/64'}
                  alt={item.name}
                  style={{
                    width: '64px', height: '64px',
                    objectFit: 'cover', borderRadius: '10px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: '0 0 4px', fontSize: '0.95rem',
                    fontWeight: '800', color: '#2D1A4A',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.name}
                  </p>
                  <p style={{
                    margin: 0, fontSize: '0.8rem',
                    color: '#9585B0', fontWeight: '600',
                  }}>
                    Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                  </p>
                </div>
                <strong style={{
                  fontSize: '1rem', color: selected ? '#10B981' : '#FF6B35',
                  flexShrink: 0,
                }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </strong>
                {selected && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#10B981', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: '0.92rem',
                    flexShrink: 0,
                  }}>
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════ STEP 2: Pick NEW product ═════ */}
      {oldItem && (
        <div style={{
          background: 'white', borderRadius: '20px',
          padding: '24px', marginBottom: '20px',
          border: `2px solid ${newProduct ? '#10B981' : '#F3E8FF'}`,
          boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
          }}>
            <h3 style={{
              margin: 0, fontSize: '1.05rem', fontWeight: '800',
              color: '#2D1A4A',
            }}>
              2️⃣ Pick replacement product
            </h3>
            {newProduct && (
              <button onClick={() => setNewProduct(null)} style={{
                background: '#FEF2F2', color: '#EF4444',
                border: '1px solid #FCA5A5', borderRadius: '8px',
                padding: '4px 12px', fontSize: '0.78rem', fontWeight: '700',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Change
              </button>
            )}
          </div>

          {/* Selected new product preview */}
          {newProduct && (
            <div style={{
              padding: '16px', background: '#ECFDF5',
              border: '2px solid #10B981', borderRadius: '14px',
              marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <img
                src={newProduct.images?.[0]?.url || 'https://via.placeholder.com/64'}
                alt={newProduct.name}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 4px', fontSize: '0.95rem',
                  fontWeight: '800', color: '#065F46',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  ✅ {newProduct.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857', fontWeight: '600' }}>
                  {newProduct.stock} in stock
                </p>
              </div>
              <strong style={{ fontSize: '1.1rem', color: '#10B981' }}>
                ₹{(newProduct.discountPrice || newProduct.price).toLocaleString('en-IN')}
              </strong>
            </div>
          )}

          {/* Filter bar */}
          {!newProduct && (
            <>
              <div style={{
                display: 'flex', gap: '10px',
                marginBottom: '16px', flexWrap: 'wrap',
              }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search products..."
                  style={{
                    flex: '1 1 200px',
                    padding: '10px 14px',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    outline: 'none', cursor: 'pointer',
                    background: 'white', color: '#2D1A4A',
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Product grid */}
              {productsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9585B0' }}>
                  ⏳ Loading products...
                </div>
              ) : products.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  background: '#FAFAFA', borderRadius: '14px',
                  border: '1.5px dashed #E5E7EB',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
                  <p style={{ color: '#6B7280', fontWeight: '600' }}>No products found</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '12px',
                  maxHeight: '500px', overflowY: 'auto',
                  padding: '4px',
                }}>
                  {products
                    .filter(p => p.id !== oldItem.productId) // exclude same product
                    .map(product => {
                      const price    = product.discountPrice || product.price;
                      const priceDiff = price - (oldItem?.price || 0);

                      return (
                        <button
                          key={product.id}
                          onClick={() => {
                            setNewProduct(product);
                            setStep(3);
                            setTimeout(() => window.scrollTo({ top: 1100, behavior: 'smooth' }), 100);
                          }}
                          style={{
                            display: 'flex', flexDirection: 'column',
                            background: 'white',
                            border: '1.5px solid #F3E8FF',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(123,47,190,0.12)';
                            e.currentTarget.style.borderColor = '#7B2FBE';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = '#F3E8FF';
                          }}
                        >
                          <div style={{
                            width: '100%', aspectRatio: '1',
                            background: '#FAFAFA', position: 'relative',
                            overflow: 'hidden',
                          }}>
                            <img
                              src={product.images?.[0]?.url || 'https://via.placeholder.com/160'}
                              alt={product.name}
                              style={{
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            {priceDiff !== 0 && (
                              <span style={{
                                position: 'absolute', top: '6px', right: '6px',
                                background: priceDiff > 0 ? '#FEF3C7' : '#D1FAE5',
                                color: priceDiff > 0 ? '#92400E' : '#065F46',
                                padding: '3px 8px',
                                borderRadius: '999px',
                                fontSize: '0.66rem', fontWeight: '800',
                                border: `1px solid ${priceDiff > 0 ? '#FDE68A' : '#A7F3D0'}`,
                              }}>
                                {priceDiff > 0 ? `+₹${priceDiff}` : `−₹${Math.abs(priceDiff)}`}
                              </span>
                            )}
                          </div>
                          <div style={{ padding: '8px 10px' }}>
                            <p style={{
                              margin: '0 0 4px', fontSize: '0.82rem',
                              fontWeight: '700', color: '#2D1A4A',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              minHeight: '36px',
                            }}>
                              {product.name}
                            </p>
                            <strong style={{ color: '#FF6B35', fontSize: '0.92rem' }}>
                              ₹{price?.toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═════ Price Difference Banner ═════ */}
      {oldItem && newProduct && (
        <div style={{
          background: priceDifference === 0
            ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
            : priceDifference > 0
              ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)'
              : 'linear-gradient(135deg, #F0F9FF, #DBEAFE)',
          border: `2px solid ${
            priceDifference === 0 ? '#10B981'
            : priceDifference > 0 ? '#F59E0B'
            : '#3B82F6'
          }`,
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '14px',
            flexWrap: 'wrap',
          }}>
            <div>
              <p style={{
                margin: '0 0 4px', fontSize: '0.74rem', fontWeight: '800',
                color: priceDifference === 0 ? '#065F46'
                     : priceDifference > 0 ? '#92400E' : '#1E40AF',
                textTransform: 'uppercase', letterSpacing: '0.6px',
              }}>
                Price Difference
              </p>
              <p style={{
                margin: 0, fontSize: '1.4rem', fontWeight: '900',
                color: priceDifference === 0 ? '#10B981'
                     : priceDifference > 0 ? '#F59E0B' : '#3B82F6',
              }}>
                {priceDifference === 0 && '✅ Same Price — Free Exchange'}
                {priceDifference > 0 && `+ ₹${priceDifference.toLocaleString('en-IN')}`}
                {priceDifference < 0 && `− ₹${Math.abs(priceDifference).toLocaleString('en-IN')}`}
              </p>
            </div>
            <div style={{ fontSize: '2.5rem' }}>
              {priceDifference === 0 && '🎉'}
              {priceDifference > 0 && '💰'}
              {priceDifference < 0 && '💸'}
            </div>
          </div>
          <p style={{
            margin: '10px 0 0', fontSize: '0.84rem',
            color: priceDifference === 0 ? '#047857'
                 : priceDifference > 0 ? '#78350F' : '#1E40AF',
            fontWeight: '600',
          }}>
            {priceDifference === 0 && 'No payment needed. We will swap your product after pickup & verification.'}
            {priceDifference > 0 && `You'll receive a payment link for ₹${priceDifference}. We ship new product after payment.`}
            {priceDifference < 0 && `We will auto-refund ₹${Math.abs(priceDifference)} to your original payment method.`}
          </p>
        </div>
      )}

      {/* ═════ STEP 3: Reason ═════ */}
      {oldItem && newProduct && (
        <div style={{
          background: 'white', borderRadius: '20px',
          padding: '24px', marginBottom: '20px',
          border: `2px solid ${reason ? '#10B981' : '#F3E8FF'}`,
          boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
        }}>
          <h3 style={{
            margin: '0 0 16px', fontSize: '1.05rem', fontWeight: '800',
            color: '#2D1A4A',
          }}>
            3️⃣ Why are you exchanging? <span style={{ color: '#EF4444' }}>*</span>
          </h3>

          <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
            {REASONS.map(({ label, emoji }) => {
              const selected = reason === label;
              return (
                <label key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px',
                  background: selected ? '#FFF3E8' : 'white',
                  border: `1.5px solid ${selected ? '#FF6B35' : '#E5E7EB'}`,
                  borderRadius: '12px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  <input
                    type="radio" name="reason" value={label}
                    checked={selected} onChange={e => setReason(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    border: `2px solid ${selected ? '#FF6B35' : '#D1D5DB'}`,
                    background: selected ? '#FF6B35' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                  }}>
                    {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <span style={{ fontSize: '1.05rem' }}>{emoji}</span>
                  <span style={{
                    fontSize: '0.88rem',
                    fontWeight: selected ? '800' : '600',
                    color: selected ? '#EA580C' : '#374151',
                  }}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>

          {reason === 'Other' && (
            <input
              type="text"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Specify your reason..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #E5E7EB',
                borderRadius: '10px',
                fontFamily: 'inherit', fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box',
                marginBottom: '12px',
              }}
            />
          )}

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Additional details (optional)..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E5E7EB', borderRadius: '12px',
              fontFamily: 'inherit', fontSize: '0.88rem',
              resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', color: '#1F2937',
            }}
          />
        </div>
      )}

      {/* ═════ Submit ═════ */}
      {oldItem && newProduct && (reason !== '') && (
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          position: 'sticky', bottom: '12px', zIndex: 10,
        }}>
          <Link href={`/orders/${id}`} style={{
            flex: '1 1 140px', padding: '14px',
            background: 'white', color: '#6B7280',
            border: '1.5px solid #E5E7EB', borderRadius: '12px',
            fontWeight: '700', fontSize: '0.95rem',
            textAlign: 'center', textDecoration: 'none',
          }}>
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!reason || (reason === 'Other' && !customReason.trim()))}
            style={{
              flex: '2 1 240px', padding: '14px',
              background: !submitting && reason && (reason !== 'Other' || customReason.trim())
                ? 'linear-gradient(135deg, #FF6B35, #7B2FBE)'
                : '#E5E7EB',
              color: !submitting && reason ? 'white' : '#9CA3AF',
              border: 'none', borderRadius: '12px',
              fontWeight: '800', fontSize: '1rem',
              fontFamily: 'inherit',
              cursor: !submitting && reason ? 'pointer' : 'not-allowed',
              boxShadow: !submitting && reason
                ? '0 8px 22px rgba(255,107,53,0.30)'
                : 'none',
            }}
          >
            {submitting
              ? '⏳ Submitting...'
              : priceDifference > 0
                ? `💳 Pay ₹${priceDifference} & Submit Exchange`
                : '🔄 Submit Exchange Request'}
          </button>
        </div>
      )}

      <p style={{
        textAlign: 'center', marginTop: '16px',
        fontSize: '0.78rem', color: '#9585B0', fontWeight: '600',
      }}>
        🔒 Pickup will be arranged within 2–3 business days after approval.
      </p>
    </div>
  );
}

/* ── Reusable: Not Eligible message ── */
function NotEligible({ icon, title, message, orderId }) {
  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto',
      padding: '60px 20px', textAlign: 'center',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>{icon}</div>
      <h2 style={{ color: '#2D1A4A', fontSize: '1.5rem', margin: '0 0 12px' }}>{title}</h2>
      <p style={{ color: '#6B4E8A', margin: '0 0 24px', fontSize: '0.94rem' }}>{message}</p>
      <Link href={`/orders/${orderId}`} style={{
        display: 'inline-block', padding: '14px 32px',
        background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
        color: 'white', borderRadius: '12px', textDecoration: 'none',
        fontWeight: '800', fontSize: '0.95rem',
      }}>
        ← Back to Order
      </Link>
    </div>
  );
}