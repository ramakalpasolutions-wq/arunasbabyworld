'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function GunturDiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  const [form, setForm] = useState({
    brand: '',
    discountPercent: '10',
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
    fetchBrands();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guntur-discounts');
      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch {
      toast.error('Failed to load discount rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/products/brands');
      const data = await res.json();
      setBrands(data.brands || []);
    } catch {}
  };

  const resetForm = () => {
    setForm({ brand: '', discountPercent: '10', isActive: true });
    setEditingRule(null);
    setBrandSearch('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (rule) => {
    setForm({
      brand: rule.brand,
      discountPercent: String(rule.discountPercent),
      isActive: rule.isActive,
    });
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand.trim()) { toast.error('Select a brand'); return; }
    if (!form.discountPercent || Number(form.discountPercent) <= 0) { toast.error('Enter valid discount %'); return; }

    setSaving(true);
    try {
      const url = editingRule ? `/api/guntur-discounts?id=${editingRule.id}` : '/api/guntur-discounts';
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: form.brand.trim(),
          discountPercent: Number(form.discountPercent),
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingRule ? '✅ Rule updated!' : '🎉 Discount rule created!');
      setShowModal(false);
      resetForm();
      fetchDiscounts();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this discount rule?')) return;
    try {
      await fetch(`/api/guntur-discounts?id=${id}`, { method: 'DELETE' });
      toast.success('🗑️ Rule deleted');
      fetchDiscounts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (rule) => {
    try {
      await fetch(`/api/guntur-discounts?id=${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      toast.success(rule.isActive ? '⛔ Disabled' : '✅ Enabled');
      fetchDiscounts();
    } catch {
      toast.error('Failed');
    }
  };

  const filteredBrands = brandSearch.trim()
    ? brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands;

  const existingBrandNames = discounts.map(d => d.brand.toLowerCase());

  return (
    <div style={{ padding: '24px', fontFamily: 'Nunito, sans-serif', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: '#1F0F3A' }}>
            🎯 Guntur Food Discounts
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.9rem', fontWeight: '600' }}>
            Set brand-specific discount % for Guntur city customers on food & baby food items
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '900',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.30)',
          }}
        >
          + Add Brand Discount
        </button>
      </div>

      {/* Rules List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>⏳ Loading...</div>
      ) : discounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F0FDF4', borderRadius: '16px', border: '2px dashed #10B981' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
          <h3 style={{ margin: 0, color: '#065F46' }}>No discount rules configured yet</h3>
          <p style={{ color: '#047857', margin: '8px 0 20px' }}>
            Add brand-specific food discount percentages for Guntur city customers
          </p>
          <button onClick={openCreate} style={{ padding: '10px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
            + Create First Rule
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {discounts.map(rule => (
            <div
              key={rule.id}
              style={{
                background: 'white',
                padding: '18px 20px',
                borderRadius: '14px',
                border: `2px solid ${rule.isActive ? '#10B981' : '#E5E7EB'}`,
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                opacity: rule.isActive ? 1 : 0.6,
              }}
            >
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontWeight: '900',
                    fontSize: '1.05rem',
                    color: '#1F0F3A',
                  }}>
                    🏷️ {rule.brand}
                  </span>
                  <span style={{
                    padding: '4px 14px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: '900',
                  }}>
                    {rule.discountPercent}% OFF
                  </span>
                  {!rule.isActive && (
                    <span style={{ padding: '3px 10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800' }}>
                      DISABLED
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280', fontWeight: '600' }}>
                  📍 Applies to Guntur city customers (522001, 522002, 522003, 522004, 522006, 522007, 522034) on food items from this brand
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => toggleActive(rule)} style={{
                  padding: '8px 14px',
                  background: rule.isActive ? '#FEF2F2' : '#F0FDF4',
                  color: rule.isActive ? '#DC2626' : '#059669',
                  border: '1.5px solid',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}>
                  {rule.isActive ? '⛔ Disable' : '✅ Enable'}
                </button>
                <button onClick={() => openEdit(rule)} style={{
                  padding: '8px 14px',
                  background: '#F3E8FF',
                  color: '#7B2FBE',
                  border: '1.5px solid #E9D5FF',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(rule.id)} style={{
                  padding: '8px 14px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '2px solid #D1FAE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', borderRadius: '20px 20px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: '#065F46' }}>
                {editingRule ? '✏️ Edit Discount Rule' : '🎯 New Brand Discount'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'white', border: '1.5px solid #E5E7EB', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Brand Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#065F46', marginBottom: '6px' }}>
                  Select Brand *
                </label>
                <input
                  type="text"
                  value={editingRule ? form.brand : brandSearch}
                  onChange={(e) => {
                    if (!editingRule) {
                      setBrandSearch(e.target.value);
                      setForm({ ...form, brand: e.target.value });
                    }
                  }}
                  placeholder="Search or type brand name..."
                  disabled={!!editingRule}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #A7F3D0',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    boxSizing: 'border-box',
                    background: editingRule ? '#F3F4F6' : 'white',
                  }}
                />

                {!editingRule && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                    {filteredBrands.map(b => {
                      const alreadyExists = existingBrandNames.includes(b.toLowerCase());
                      const isSelected = form.brand === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          disabled={alreadyExists}
                          onClick={() => {
                            setForm({ ...form, brand: b });
                            setBrandSearch(b);
                          }}
                          style={{
                            padding: '4px 10px',
                            background: isSelected ? '#059669' : alreadyExists ? '#F3F4F6' : 'white',
                            color: isSelected ? 'white' : alreadyExists ? '#9CA3AF' : '#065F46',
                            border: `1.5px solid ${isSelected ? '#059669' : alreadyExists ? '#E5E7EB' : '#A7F3D0'}`,
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            cursor: alreadyExists ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isSelected ? '✓ ' : ''}{b}
                          {alreadyExists && ' (exists)'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Discount Percentage */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#065F46', marginBottom: '6px' }}>
                  Discount Percentage (%) *
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    min="1"
                    max="100"
                    required
                    style={{
                      width: '120px',
                      padding: '10px 14px',
                      border: '2px solid #A7F3D0',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      fontWeight: '900',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontWeight: '900', fontSize: '1.2rem', color: '#059669' }}>%</span>
                </div>

                {/* Quick preset buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {[5, 10, 15, 20, 25, 30].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, discountPercent: String(p) })}
                      style={{
                        padding: '4px 10px',
                        background: Number(form.discountPercent) === p ? '#059669' : 'white',
                        color: Number(form.discountPercent) === p ? 'white' : '#059669',
                        border: `1.5px solid ${Number(form.discountPercent) === p ? '#059669' : '#A7F3D0'}`,
                        borderRadius: '999px',
                        fontSize: '0.76rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                      }}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: '800', color: '#374151', fontSize: '0.88rem' }}>
                  Activate this discount rule immediately
                </span>
              </label>

              {/* Preview */}
              {form.brand && form.discountPercent && (
                <div style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                  border: '1.5px solid #10B981',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: '#065F46' }}>
                    📍 Guntur customers ordering <strong>{form.brand}</strong> food items will get
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '1.8rem', fontWeight: '900', color: '#059669' }}>
                    {form.discountPercent}% OFF
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '12px 20px',
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontWeight: '800',
                  color: '#6B7280',
                  cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '900',
                  fontSize: '0.9rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? '⏳ Saving...' : editingRule ? '💾 Update Rule' : '🎯 Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}