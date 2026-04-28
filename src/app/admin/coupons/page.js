'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from '../categories/page.module.css';
import couponStyles from './page.module.css';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage', discountValue: '',
    minOrderValue: '', maxDiscount: '', usageLimit: '', expiryDate: '', isActive: true,
  });

  const fetchCoupons = () => {
    fetch('/api/coupons').then(r => r.json()).then(d => { setCoupons(d.coupons || []); setLoading(false); });
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiryDate) { toast.error('Please fill required fields'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: parseFloat(form.discountValue),
        minOrderValue: parseFloat(form.minOrderValue || '0'),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
      };
      const res = await fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', expiryDate: '', isActive: true });
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Coupons 🎟️</h1>
          <p>{coupons.length} coupons total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Coupon</button>
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
                  <input className="form-control" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE10" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select className="form-control" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div className={styles.row2}>
                <div className="form-group">
                  <label>Discount Value * ({form.discountType === 'percentage' ? '%' : '₹'})</label>
                  <input type="number" className="form-control" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 100'} min="0" max={form.discountType === 'percentage' ? '100' : undefined} />
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input type="date" className="form-control" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className={styles.row2}>
                <div className="form-group">
                  <label>Min Order Value (₹)</label>
                  <input type="number" className="form-control" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} placeholder="0" min="0" />
                </div>
                <div className="form-group">
                  <label>Max Discount (₹)</label>
                  <input type="number" className="form-control" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="No limit" min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Usage Limit</label>
                <input type="number" className="form-control" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" min="1" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Internal note about this coupon" />
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Creating...' : '✨ Create Coupon'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className={couponStyles.couponsGrid}>
          {coupons.length === 0 ? (
            <div className={couponStyles.empty}><span>🎟️</span><p>No coupons yet</p></div>
          ) : coupons.map(coupon => (
            <div key={coupon.id} className={`${couponStyles.couponCard} ${isExpired(coupon.expiryDate) ? couponStyles.expired : ''}`}>
              <div className={couponStyles.couponHeader}>
                <div className={couponStyles.code}>{coupon.code}</div>
                <span className={coupon.isActive && !isExpired(coupon.expiryDate) ? couponStyles.active : couponStyles.inactive}>
                  {isExpired(coupon.expiryDate) ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={couponStyles.discount}>
                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
              </div>
              {coupon.description && <p className={couponStyles.desc}>{coupon.description}</p>}
              <div className={couponStyles.meta}>
                {coupon.minOrderValue > 0 && <span>Min: ₹{coupon.minOrderValue}</span>}
                <span>Used: {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</span>
                <span>Expires: {new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
