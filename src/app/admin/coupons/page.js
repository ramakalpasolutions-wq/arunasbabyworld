'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from '../categories/page.module.css';
import couponStyles from './page.module.css';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage', discountValue: '',
    minOrderValue: '', maxDiscount: '', usageLimit: '', expiryDate: '', isActive: true,
    applicableCategories: [], // ✅ NEW
  });

  const fetchCoupons = () => {
    setLoading(true);
    fetch('/api/coupons')
      .then(r => r.json())
      .then(d => {
        setCoupons(d.coupons || []);
        setLoading(false);
        if (d.deletedExpired > 0) {
          toast.success(`🗑️ Auto-removed ${d.deletedExpired} expired coupon(s)`);
        }
      })
      .catch(() => {
        toast.error('Failed to load coupons');
        setLoading(false);
      });
  };

  // ✅ NEW: Fetch categories for the multi-select
  const fetchCategories = () => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => toast.error('Failed to load categories'));
  };

  useEffect(() => {
    fetchCoupons();
    fetchCategories(); // ✅ NEW
    const interval = setInterval(fetchCoupons, 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ NEW: Toggle category selection
  const toggleCategory = (categoryId) => {
    setForm(f => ({
      ...f,
      applicableCategories: f.applicableCategories.includes(categoryId)
        ? f.applicableCategories.filter(id => id !== categoryId)
        : [...f.applicableCategories, categoryId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiryDate) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: parseFloat(form.discountValue),
        minOrderValue: parseFloat(form.minOrderValue || '0'),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        applicableCategories: form.applicableCategories, // ✅ NEW
      };
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('✅ Coupon created!');
      setShowForm(false);
      setForm({
        code: '', description: '', discountType: 'percentage', discountValue: '',
        minOrderValue: '', maxDiscount: '', usageLimit: '', expiryDate: '', isActive: true,
        applicableCategories: [],
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    setDeletingId(coupon.id);
    try {
      const res = await fetch(`/api/coupons?id=${coupon.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success(`🗑️ Coupon "${coupon.code}" deleted`);
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();
  const daysUntilExpiry = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // ✅ NEW: Get category names from IDs
  const getCategoryNames = (ids) => {
    if (!ids || ids.length === 0) return 'All Categories';
    return ids
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Coupons 🎟️</h1>
          <p>
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total
            {' • '}
            <span style={{ color: '#10b981', fontWeight: 700 }}>
              Auto-cleanup enabled
            </span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Coupon
        </button>
      </div>

      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{ maxWidth: 560 }}>
            <div className={styles.modalHeader}>
              <h2>Create Coupon</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.row2}>
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    className="form-control"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAVE10"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    className="form-control"
                    value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div className={styles.row2}>
                <div className="form-group">
                  <label>Discount Value * ({form.discountType === 'percentage' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                    min="0"
                    max={form.discountType === 'percentage' ? '100' : undefined}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.expiryDate}
                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className={styles.row2}>
                <div className="form-group">
                  <label>Min Order Value (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.minOrderValue}
                    onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Max Discount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.maxDiscount}
                    onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                    placeholder="No limit"
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Usage Limit</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.usageLimit}
                  onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Internal note about this coupon"
                />
              </div>

              {/* ✅ NEW: Applicable Categories Multi-Select */}
              <div className="form-group">
                <label>
                  Applicable Categories
                  <span style={{ fontWeight: 400, color: '#666', marginLeft: 8, fontSize: 13 }}>
                    (Leave empty for all categories)
                  </span>
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 8,
                    maxHeight: 200,
                    overflowY: 'auto',
                    padding: 12,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#f9fafb',
                  }}
                >
                  {categories.length === 0 ? (
                    <p style={{ color: '#999', gridColumn: '1/-1', margin: 0 }}>
                      No categories found
                    </p>
                  ) : (
                    categories.map(cat => (
                      <label
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          background: form.applicableCategories.includes(cat.id)
                            ? '#dbeafe'
                            : '#fff',
                          border: form.applicableCategories.includes(cat.id)
                            ? '1px solid #3b82f6'
                            : '1px solid #e5e7eb',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.applicableCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          style={{ margin: 0 }}
                        />
                        <span style={{ userSelect: 'none' }}>{cat.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {form.applicableCategories.length > 0 && (
                  <p style={{ fontSize: 12, color: '#3b82f6', marginTop: 6 }}>
                    ✓ Selected: {form.applicableCategories.length} categor
                    {form.applicableCategories.length === 1 ? 'y' : 'ies'}
                  </p>
                )}
              </div>

              <div className={styles.formActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Creating...' : '✨ Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={couponStyles.couponsGrid}>
          {coupons.length === 0 ? (
            <div className={couponStyles.empty}>
              <span>🎟️</span>
              <p>No coupons yet</p>
            </div>
          ) : coupons.map(coupon => {
            const expired = isExpired(coupon.expiryDate);
            const days = daysUntilExpiry(coupon.expiryDate);
            const expiringSoon = !expired && days <= 3;

            return (
              <div
                key={coupon.id}
                className={`${couponStyles.couponCard} ${expired ? couponStyles.expired : ''}`}
              >
                <button
                  className={couponStyles.deleteBtn}
                  onClick={() => handleDelete(coupon)}
                  disabled={deletingId === coupon.id}
                  title="Delete coupon"
                >
                  {deletingId === coupon.id ? '⏳' : '🗑️'}
                </button>

                <div className={couponStyles.couponHeader}>
                  <div className={couponStyles.code}>{coupon.code}</div>
                  <span
                    className={
                      coupon.isActive && !expired ? couponStyles.active : couponStyles.inactive
                    }
                  >
                    {expired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className={couponStyles.discount}>
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% OFF`
                    : `₹${coupon.discountValue} OFF`}
                </div>

                {coupon.description && (
                  <p className={couponStyles.desc}>{coupon.description}</p>
                )}

                {/* ✅ NEW: Show applicable categories */}
                <div
                  style={{
                    fontSize: 12,
                    color: '#666',
                    padding: '6px 10px',
                    background: coupon.applicableCategories?.length > 0 ? '#fef3c7' : '#dcfce7',
                    borderRadius: 6,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  📂 {getCategoryNames(coupon.applicableCategories)}
                </div>

                <div className={couponStyles.meta}>
                  {coupon.minOrderValue > 0 && <span>Min: ₹{coupon.minOrderValue}</span>}
                  <span>
                    Used: {coupon.usedCount}
                    {coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                  </span>
                  <span>
                    Expires: {new Date(coupon.expiryDate).toLocaleDateString('en-IN')}
                  </span>
                </div>

                {expiringSoon && (
                  <div className={couponStyles.warning}>
                    ⚠️ Expires in {days} day{days !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}