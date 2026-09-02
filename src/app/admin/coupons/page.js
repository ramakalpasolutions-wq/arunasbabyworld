'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

const MIN_ORDER_PRESETS = [
  { label: 'No Min (₹0)', value: '0' },
  { label: '₹499', value: '499' },
  { label: '₹799', value: '799' },
  { label: '₹999', value: '999' },
  { label: '₹1,499', value: '1499' },
  { label: '₹1,999', value: '1999' },
];

const MAX_DISCOUNT_PRESETS = [
  { label: 'No Cap (∞)', value: '' },
  { label: '₹200 Cap', value: '200' },
  { label: '₹500 Cap', value: '500' },
  { label: '₹1,000 Cap', value: '1000' },
  { label: '₹2,000 Cap', value: '2000' },
  { label: '₹5,000 Cap', value: '5000' },
];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  // Search filter states inside popup
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedExclusionCategory, setSelectedExclusionCategory] = useState('');
  const [brandSearchFilter, setBrandSearchFilter] = useState('');

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: '',
    expiryDate: '',
    isActive: true,
    applicableCategories: [],
    categoryBrandExclusions: {},
  });

  useEffect(() => {
    fetchCoupons();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?all=true');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/products/brands');
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxDiscount: '',
      usageLimit: '',
      expiryDate: '',
      isActive: true,
      applicableCategories: [],
      categoryBrandExclusions: {},
    });
    setEditingCoupon(null);
    setCategorySearch('');
    setSelectedExclusionCategory('');
    setBrandSearchFilter('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : '',
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : '',
      isActive: coupon.isActive,
      applicableCategories: coupon.applicableCategories || [],
      categoryBrandExclusions: coupon.categoryBrandExclusions || {},
    });
    setEditingCoupon(coupon);
    setCategorySearch('');
    setSelectedExclusionCategory('');
    setBrandSearchFilter('');
    setShowModal(true);
  };

  // Category Toggle
  const toggleCategory = (catId) => {
    setForm((prev) => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(catId)
        ? prev.applicableCategories.filter((id) => id !== catId)
        : [...prev.applicableCategories, catId],
    }));
  };

  const selectAllCategories = () => {
    setForm((prev) => ({
      ...prev,
      applicableCategories: categories.map((c) => c.id),
    }));
  };

  const clearAllCategories = () => {
    setForm((prev) => ({
      ...prev,
      applicableCategories: [],
    }));
  };

  // Per-category brand exclusion helpers
  const toggleBrandExclusion = (catId, brandName) => {
    if (!catId) return;
    setForm((prev) => {
      const current = prev.categoryBrandExclusions[catId] || [];
      const updated = current.includes(brandName)
        ? current.filter((b) => b !== brandName)
        : [...current, brandName];
      return {
        ...prev,
        categoryBrandExclusions: {
          ...prev.categoryBrandExclusions,
          [catId]: updated,
        },
      };
    });
  };

  const addCustomBrandExclusion = (catId) => {
    if (!brandSearchFilter.trim() || !catId) return;
    const bName = brandSearchFilter.trim();
    setForm((prev) => {
      const current = prev.categoryBrandExclusions[catId] || [];
      if (current.includes(bName)) return prev;
      return {
        ...prev,
        categoryBrandExclusions: {
          ...prev.categoryBrandExclusions,
          [catId]: [...current, bName],
        },
      };
    });
    setBrandSearchFilter('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiryDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = editingCoupon ? `/api/coupons?id=${editingCoupon.id}` : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase(),
          discountValue: Number(form.discountValue),
          minOrderValue: Number(form.minOrderValue) || 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingCoupon ? '✅ Coupon updated!' : '🎉 Coupon created!');
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
      toast.success('🗑️ Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await fetch(`/api/coupons?id=${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      toast.success(coupon.isActive ? '⛔ Disabled' : '✅ Enabled');
      fetchCoupons();
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const getCatName = (catId) => categories.find((c) => c.id === catId)?.name || catId.slice(-6);

  // Filtered lists based on search inputs
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase().trim())
    );
  }, [categories, categorySearch]);

  const filteredBrands = useMemo(() => {
    if (!brandSearchFilter.trim()) return brands;
    return brands.filter((b) =>
      b.toLowerCase().includes(brandSearchFilter.toLowerCase().trim())
    );
  }, [brands, brandSearchFilter]);

  // Simulation preview
  const simulation = useMemo(() => {
    const val = Number(form.discountValue) || 0;
    const isPct = form.discountType === 'percentage';
    const minVal = Number(form.minOrderValue) || 0;
    const maxCap = Number(form.maxDiscount) || 0;

    const sampleCart = Math.max(minVal || 1000, 2000);
    let discount = isPct ? (sampleCart * val) / 100 : val;
    let isCapped = false;

    if (maxCap > 0 && discount > maxCap) {
      discount = maxCap;
      isCapped = true;
    }

    return {
      sampleCart,
      discount: Math.round(discount),
      finalPay: Math.max(0, Math.round(sampleCart - discount)),
      isCapped,
    };
  }, [form.discountValue, form.discountType, form.minOrderValue, form.maxDiscount]);

  return (
    <div style={{ padding: '24px', fontFamily: 'Nunito, sans-serif' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: '#1F0F3A' }}>🎟️ Coupon Management</h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.9rem', fontWeight: '600' }}>
            {categories.length} Categories · {brands.length} Brands available for offers
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
          }}
        >
          + Create New Coupon
        </button>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>⏳ Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#F9FAFB', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem' }}>🎟️</div>
          <h3>No coupons created yet</h3>
          <button onClick={openCreateModal} style={{ padding: '10px 24px', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
            + Create Coupon
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {coupons.map((coupon) => {
            const isExpired = new Date(coupon.expiryDate) < new Date();
            const exclusions = coupon.categoryBrandExclusions || {};
            const hasExclusions = Object.keys(exclusions).length > 0;
            const linkedCategories = categories.filter((c) => coupon.applicableCategories?.includes(c.id));

            return (
              <div
                key={coupon.id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '16px',
                  border: `2px solid ${coupon.isActive && !isExpired ? '#10B981' : '#E5E7EB'}`,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  opacity: isExpired ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '900', color: '#7B2FBE', background: '#F3E8FF', padding: '4px 12px', borderRadius: '6px', fontSize: '1.1rem' }}>
                        {coupon.code}
                      </span>
                      <span style={{ padding: '4px 12px', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', color: 'white', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      </span>
                      {isExpired && <span style={{ padding: '3px 10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800' }}>EXPIRED</span>}
                    </div>

                    {coupon.description && <p style={{ margin: '0 0 8px', color: '#374151', fontWeight: '600', fontSize: '0.88rem' }}>{coupon.description}</p>}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      <span style={{ padding: '4px 10px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                        🛒 Min Order: {coupon.minOrderValue > 0 ? `₹${coupon.minOrderValue}` : 'No Minimum'}
                      </span>
                      <span style={{ padding: '4px 10px', background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                        🛡️ Max Cap: {coupon.maxDiscount ? `₹${coupon.maxDiscount}` : 'No Cap'}
                      </span>
                      <span style={{ padding: '4px 10px', background: '#F3F4F6', color: '#4B5563', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                        📅 Expires: {new Date(coupon.expiryDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    {/* Linked Categories List */}
                    {linkedCategories.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#1D4ED8' }}>Categories ({linkedCategories.length}):</span>
                        {linkedCategories.map((c) => (
                          <span key={c.id} style={{ padding: '2px 8px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid #BFDBFE' }}>
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Exclusions */}
                    {hasExclusions && (
                      <div style={{ marginTop: '10px', padding: '10px 12px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                        {Object.entries(exclusions).map(
                          ([catId, excludedBrands]) =>
                            excludedBrands.length > 0 && (
                              <div key={catId} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '3px' }}>
                                <span style={{ fontSize: '0.74rem', fontWeight: '900', color: '#991B1B' }}>🚫 Excluded in {getCatName(catId)}:</span>
                                {excludedBrands.map((b) => (
                                  <span key={b} style={{ padding: '1px 8px', background: '#DC2626', color: 'white', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '700' }}>
                                    {b}
                                  </span>
                                ))}
                              </div>
                            )
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <button onClick={() => toggleActive(coupon)} style={{ padding: '8px 12px', background: coupon.isActive ? '#FEF2F2' : '#F0FDF4', color: coupon.isActive ? '#DC2626' : '#059669', border: '1.5px solid', borderRadius: '8px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                      {coupon.isActive ? '⛔ Disable' : '✅ Enable'}
                    </button>
                    <button onClick={() => openEditModal(coupon)} style={{ padding: '8px 12px', background: '#F3E8FF', color: '#7B2FBE', border: '1.5px solid #E9D5FF', borderRadius: '8px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FCA5A5', borderRadius: '8px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: ALL CATEGORIES & ALL BRANDS WITH INSTANT SEARCH
      ════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 26px', borderBottom: '2px solid #F3E8FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)', borderRadius: '24px 24px 0 0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#7B2FBE' }}>
                  {editingCoupon ? '✏️ Edit Coupon Offer' : '🎉 Create Coupon Offer'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6B7280', fontWeight: '600' }}>
                  {categories.length} total categories · {brands.length} total brands detected
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'white', border: '1.5px solid #E5E7EB', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Code & Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px' }}>COUPON CODE *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVE20"
                    required
                    style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontFamily: 'monospace', fontWeight: '900', fontSize: '1rem', letterSpacing: '1px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px' }}>DESCRIPTION</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. 20% off on toys and walkers"
                    style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Discount Type, Value & Expiry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px' }}>DISCOUNT TYPE</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    style={{ width: '100%', padding: '11px 12px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', background: 'white' }}
                  >
                    <option value="percentage">Percentage (%) Discount</option>
                    <option value="fixed">Flat Cash (₹) Off</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px' }}>
                    {form.discountType === 'percentage' ? 'DISCOUNT % *' : 'FLAT AMOUNT (₹) *'}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === 'percentage' ? '20' : '200'}
                    required
                    min="1"
                    max={form.discountType === 'percentage' ? '100' : undefined}
                    style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '4px' }}>EXPIRY DATE *</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    required
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                    style={{ width: '100%', padding: '11px 12px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* MIN & MAX ATTRACTIVE CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '2px solid #6EE7B7', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🛒</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '900', color: '#065F46' }}>Minimum Order (₹)</h4>
                      <p style={{ margin: '1px 0 0', fontSize: '0.68rem', color: '#047857', fontWeight: '600' }}>Cart threshold to unlock code</p>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#059669' }}>₹</span>
                    <input
                      type="number"
                      value={form.minOrderValue}
                      onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                      placeholder="0 (No Minimum)"
                      min="0"
                      style={{ width: '100%', padding: '10px 12px 10px 28px', border: '2px solid #A7F3D0', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '800', background: 'white', boxSizing: 'border-box', color: '#065F46' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {MIN_ORDER_PRESETS.map((p) => {
                      const isSelected = form.minOrderValue === p.value || (p.value === '0' && (!form.minOrderValue || form.minOrderValue === '0'));
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setForm({ ...form, minOrderValue: p.value === '0' ? '' : p.value })}
                          style={{ padding: '3px 8px', background: isSelected ? '#059669' : 'white', color: isSelected ? 'white' : '#047857', border: `1px solid ${isSelected ? '#059669' : '#A7F3D0'}`, borderRadius: '999px', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '2px solid #C4B5FD', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🛡️</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '900', color: '#5B21B6' }}>Max Discount Cap (₹)</h4>
                      <p style={{ margin: '1px 0 0', fontSize: '0.68rem', color: '#6D28D9', fontWeight: '600' }}>Ceiling to protect your margin</p>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#7C3AED' }}>₹</span>
                    <input
                      type="number"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      placeholder="Unlimited (No Cap)"
                      min="0"
                      style={{ width: '100%', padding: '10px 12px 10px 28px', border: '2px solid #DDD6FE', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '800', background: 'white', boxSizing: 'border-box', color: '#5B21B6' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {MAX_DISCOUNT_PRESETS.map((p) => {
                      const isSelected = form.maxDiscount === p.value;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setForm({ ...form, maxDiscount: p.value })}
                          style={{ padding: '3px 8px', background: isSelected ? '#7C3AED' : 'white', color: isSelected ? 'white' : '#6D28D9', border: `1px solid ${isSelected ? '#7C3AED' : '#DDD6FE'}`, borderRadius: '999px', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SIMULATION BOX */}
              {form.discountValue && (
                <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #1E1B4B, #312E81)', borderRadius: '14px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>💡</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '800', color: '#A5B4FC' }}>
                        LIVE SIMULATION (ON ₹{simulation.sampleCart.toLocaleString('en-IN')} CART)
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: '700' }}>
                        Customer Saves: <span style={{ color: '#4ADE80', fontWeight: '900' }}>₹{simulation.discount.toLocaleString('en-IN')}</span>
                        {simulation.isCapped && <span style={{ marginLeft: '6px', fontSize: '0.70rem', color: '#FCD34D' }}>⚠️ (Capped at Limit)</span>}
                        {' '}· Final Pay: <span style={{ fontWeight: '900' }}>₹{simulation.finalPay.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '999px', fontWeight: '800' }}>
                    {form.discountType === 'percentage' ? `${form.discountValue}% OFF` : `₹${form.discountValue} FLAT`}
                  </span>
                </div>
              )}

              {/* 🎯 APPLICABLE CATEGORIES: FULL LIST WITH SEARCH & SELECT ALL */}
              <div style={{ padding: '16px', background: '#FEF3C7', border: '2px dashed #F59E0B', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.88rem', fontWeight: '900', color: '#78350F' }}>🎯 Applicable Categories</label>
                    <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#78350F', fontWeight: '800', background: '#FDE68A', padding: '2px 8px', borderRadius: '999px' }}>
                      {form.applicableCategories.length === 0 ? 'All Storewide' : `${form.applicableCategories.length} / ${categories.length} Selected`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={selectAllCategories} style={{ padding: '3px 8px', background: 'white', border: '1px solid #D97706', color: '#78350F', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer' }}>
                      Select All
                    </button>
                    <button type="button" onClick={clearAllCategories} style={{ padding: '3px 8px', background: 'white', border: '1px solid #D97706', color: '#78350F', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer' }}>
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Instant Category Search Filter */}
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="🔍 Search category name..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #F59E0B', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '10px', boxSizing: 'border-box', background: 'white' }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '130px', overflowY: 'auto' }}>
                  {filteredCategories.map((cat) => {
                    const sel = form.applicableCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        style={{
                          padding: '5px 12px',
                          background: sel ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'white',
                          color: sel ? 'white' : '#78350F',
                          border: `1.5px solid ${sel ? '#D97706' : '#FDE68A'}`,
                          borderRadius: '999px',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                        }}
                      >
                        {sel ? '✓ ' : ''}{cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 🚫 PER-CATEGORY BRAND EXCLUSIONS: FULL LIST WITH SEARCH */}
              <div style={{ padding: '16px', background: '#FEF2F2', border: '2px dashed #EF4444', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: '900', color: '#991B1B' }}>🚫 Per-Category Brand Exclusions</label>
                  <span style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: '800' }}>
                    {brands.length} Total Brands Available
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: '#B91C1C' }}>
                  Exclude specific brands per category (e.g. exclude Chicco in Toys, while allowing it in Walkers).
                </p>

                {/* Step 1: Category Selector */}
                <select
                  value={selectedExclusionCategory}
                  onChange={(e) => setSelectedExclusionCategory(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #FCA5A5', borderRadius: '10px', marginBottom: '10px', fontSize: '0.84rem', fontWeight: '700', background: 'white' }}
                >
                  <option value="">-- Choose Category To Add Excluded Brands --</option>
                  {(form.applicableCategories.length > 0
                    ? categories.filter((c) => form.applicableCategories.includes(c.id))
                    : categories
                  ).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                {selectedExclusionCategory && (
                  <>
                    {/* Excluded Pills */}
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#991B1B' }}>
                        Excluded in {getCatName(selectedExclusionCategory)}:
                      </span>
                      {(form.categoryBrandExclusions[selectedExclusionCategory] || []).length === 0 ? (
                        <span style={{ fontSize: '0.72rem', color: '#6B7280', marginLeft: '6px' }}>None yet</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {(form.categoryBrandExclusions[selectedExclusionCategory] || []).map((b) => (
                            <span key={b} style={{ padding: '2px 8px', background: '#DC2626', color: 'white', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🚫 {b}
                              <button type="button" onClick={() => toggleBrandExclusion(selectedExclusionCategory, b)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Brand Search Input */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={brandSearchFilter}
                        onChange={(e) => setBrandSearchFilter(e.target.value)}
                        placeholder="🔍 Search or type brand name..."
                        style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #FCA5A5', borderRadius: '8px', fontSize: '0.80rem', background: 'white' }}
                      />
                      <button
                        type="button"
                        onClick={() => addCustomBrandExclusion(selectedExclusionCategory)}
                        style={{ padding: '8px 14px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        + Add Custom
                      </button>
                    </div>

                    {/* Complete Unrestricted Brand Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                      {filteredBrands.map((b) => {
                        const isExcluded = (form.categoryBrandExclusions[selectedExclusionCategory] || []).includes(b);
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => toggleBrandExclusion(selectedExclusionCategory, b)}
                            style={{
                              padding: '3px 8px',
                              background: isExcluded ? '#DC2626' : 'white',
                              color: isExcluded ? 'white' : '#DC2626',
                              border: `1px solid ${isExcluded ? '#DC2626' : '#FECACA'}`,
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            {isExcluded ? '🚫 ' : '+ '}{b}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Status & Submit */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontWeight: '800', color: '#374151', fontSize: '0.9rem' }}>Activate this coupon immediately</span>
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 20px', background: 'white', border: '2px solid #E5E7EB', borderRadius: '12px', fontWeight: '800', color: '#6B7280', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '13px 20px',
                    background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '900',
                    fontSize: '0.95rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(123,47,190,0.25)',
                  }}
                >
                  {saving ? '⏳ Saving...' : editingCoupon ? '💾 Update Coupon' : '🎉 Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 