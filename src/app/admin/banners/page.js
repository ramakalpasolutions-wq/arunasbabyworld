'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from '../categories/page.module.css';
import banStyles from './page.module.css';

export default function AdminBanners() {
  const [activeTab, setActiveTab] = useState('hero');
  const [allBanners, setAllBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    title: '',
    subtitle: '',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    bgColor: '#ff6b9d',
    image: null,
    isActive: true,
    order: 0,
    type: 'hero',
    emoji: '',
    price: '',
    offer: '',
    color: '#ff6b9d',
    slug: '',
    gender: 'girl',
  };

  const [form, setForm] = useState(emptyForm);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/banners');
      const data = await res.json();
      setAllBanners(data.banners || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const heroBanners = allBanners.filter(b => b.type === 'hero' || !b.type);
  const budgetBanners = allBanners.filter(b => b.type === 'budget');
  const sunnyBanners = allBanners.filter(b => b.type === 'sunny');
  const promoBanners = allBanners.filter(b => b.type === 'promo');
  const genderBanners = allBanners.filter(b => b.type === 'gender');

  const openAdd = (type) => {
    setEditing(null);
    setForm({
      ...emptyForm,
      type,
      buttonLink: type === 'budget'
        ? '/products?maxPrice=299'
        : type === 'sunny'
        ? '/products?category=tops'
        : type === 'gender'
        ? '/products?search=girl'
        : '/products',
      offer: type === 'budget' ? 'Under' : type === 'promo' ? '20%' : '',
      gender: type === 'gender' ? 'girl' : null,
    });
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || 'Shop Now',
      buttonLink: banner.buttonLink || '/products',
      bgColor: banner.bgColor || '#ff6b9d',
      image: banner.image || null,
      isActive: banner.isActive,
      order: banner.order || 0,
      type: banner.type || 'hero',
      emoji: banner.emoji || '',
      price: banner.price || '',
      offer: banner.offer || '',
      color: banner.color || '#ff6b9d',
      slug: banner.slug || '',
      gender: banner.gender || 'girl',
    });
    setShowForm(true);
  };

  // ✅ Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/banners');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const imageUrl = data.url || data.images?.[0]?.url;
      const publicId = data.publicId || data.images?.[0]?.publicId;
      setForm(f => ({ ...f, image: { url: imageUrl, publicId: publicId || '' } }));
      toast.success('✅ Image uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ✅ Delete Image from form
  const handleRemoveImage = () => {
    setForm(f => ({ ...f, image: null }));
    toast.success('Image removed');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || null,
        buttonText: form.buttonText || 'Shop Now',
        buttonLink: form.type === 'budget'
          ? `/products?maxPrice=${form.price}`
          : form.type === 'sunny'
          ? `/products?category=${form.slug}`
          : form.buttonLink || '/products',
        bgColor: form.bgColor || '#ff6b9d',
        isActive: form.isActive,
        order: parseInt(form.order) || 0,
        type: form.type,
        emoji: form.emoji || null,
        price: form.price ? parseFloat(form.price) : null,
        offer: form.offer || null,
        color: form.color || null,
        slug: form.slug || null,
        image: form.image || null,
        gender: form.gender || null,
      };

      const url = editing ? `/api/banners/${editing.id}` : '/api/banners';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      toast.success(editing ? '✅ Updated!' : '✅ Created!');
      setShowForm(false);
      setEditing(null);
      fetchBanners();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this?')) return;
    const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted ✅'); fetchBanners(); }
    else toast.error('Failed to delete');
  };

  const toggleActive = async (banner) => {
    const res = await fetch(`/api/banners/${banner.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !banner.isActive }),
    });
    if (res.ok) {
      toast.success(!banner.isActive ? '✅ Active!' : 'Deactivated');
      fetchBanners();
    }
  };

  const tabStyle = (tab) => ({
    padding: '10px 18px',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: activeTab === tab
      ? 'linear-gradient(135deg, #ff6b9d, #7c3aed)'
      : '#f3f4f6',
    color: activeTab === tab ? 'white' : '#666',
  });

  const formTitle = () => {
    const action = editing ? '✏️ Edit' : '➕ Add';
    const typeMap = {
      hero: 'Hero Banner',
      budget: 'Budget Card',
      sunny: 'Sunny Card',
      promo: 'Promo Offer',
      gender: 'Girl/Boy Card',
    };
    return `${action} ${typeMap[form.type] || 'Banner'}`;
  };

  // ✅ Image Upload Section Component
  const ImageUploadSection = () => (
    <div>
      <label style={{
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#444',
        display: 'block',
        marginBottom: '6px',
      }}>
        {form.type === 'sunny' ? '🖼️ Product Image'
          : form.type === 'promo' ? '🖼️ Offer Image'
          : form.type === 'gender' ? '🖼️ Girl/Boy Image'
          : '🖼️ Banner Image'}
      </label>

      {/* Upload Box */}
      <label style={{ cursor: 'pointer', display: 'block' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        <div style={{
          width: '100%',
          height: '150px',
          border: `2px dashed ${form.type === 'sunny' ? '#0ea5e9'
            : form.type === 'promo' ? '#f59e0b'
            : form.type === 'gender' ? (form.color || '#ff6b9d')
            : (form.color || '#ff6b9d')}`,
          borderRadius: '12px',
          background: form.type === 'sunny' ? '#f0f9ff'
            : form.type === 'promo' ? '#fffbeb'
            : '#fff8fb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}>
          {uploading ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px' }}>⏳</div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#ff6b9d' }}>
                Uploading...
              </p>
            </div>
          ) : form.image?.url ? (
            <>
              <img
                src={form.image.url}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <div style={{ fontSize: '20px' }}>📷</div>
                  <p style={{ fontSize: '10px', fontWeight: '600', margin: '4px 0 0' }}>
                    Click to Change
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                {form.type === 'sunny' ? '📷'
                  : form.type === 'promo' ? '🏷️'
                  : form.type === 'gender' ? (form.gender === 'girl' ? '👧' : '👦')
                  : '🖼️'}
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#ff6b9d', margin: 0 }}>
                Click to upload
              </p>
              <p style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                {form.type === 'hero' ? '1920x600px' : '600x400px'}
              </p>
            </div>
          )}
        </div>
      </label>

      {/* ✅ Image Status + Delete Button */}
      {form.image?.url ? (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{
            fontSize: '10px',
            color: '#10b981',
            textAlign: 'center',
            fontWeight: '600',
            margin: 0,
          }}>
            ✅ Image uploaded
          </p>
          {/* ✅ Delete Image Button */}
          <button
            type="button"
            onClick={handleRemoveImage}
            style={{
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '5px 0',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
            onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
          >
            🗑️ Remove Image
          </button>
        </div>
      ) : (
        <p style={{
          fontSize: '10px',
          color: '#999',
          textAlign: 'center',
          marginTop: '6px',
        }}>
          No image uploaded
        </p>
      )}
    </div>
  );

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Banners & Sections 🖼️</h1>
          <p>Manage all home page sections</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button style={tabStyle('hero')} onClick={() => setActiveTab('hero')}>
          🖼️ Hero ({heroBanners.length})
        </button>
        <button style={tabStyle('budget')} onClick={() => setActiveTab('budget')}>
          🏪 Budget ({budgetBanners.length})
        </button>
        <button style={tabStyle('sunny')} onClick={() => setActiveTab('sunny')}>
          ☀️ Sunny ({sunnyBanners.length})
        </button>
        <button style={tabStyle('promo')} onClick={() => setActiveTab('promo')}>
          🏷️ Promo ({promoBanners.length})
        </button>
        <button style={tabStyle('gender')} onClick={() => setActiveTab('gender')}>
          👧👦 Girl & Boy ({genderBanners.length})
        </button>
      </div>

      {/* ===== FORM MODAL ===== */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{ maxWidth: '640px' }}>
            <div className={styles.modalHeader}>
              <h2>{formTitle()}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => { setShowForm(false); setEditing(null); }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px',
                gap: '16px',
                alignItems: 'start',
              }}>

                {/* LEFT FIELDS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Title */}
                  <div className="form-group">
                    <label>
                      {form.type === 'budget' ? 'Card Name *'
                        : form.type === 'sunny' ? 'Card Label *'
                        : form.type === 'promo' ? 'Offer Title *'
                        : form.type === 'gender' ? 'Card Title *'
                        : 'Banner Title *'}
                    </label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder={
                        form.type === 'budget' ? 'e.g. Under 299'
                          : form.type === 'sunny' ? 'e.g. Tops'
                          : form.type === 'promo' ? 'e.g. Summer Sale'
                          : form.type === 'gender' ? 'e.g. For Her'
                          : 'e.g. New Arrivals'
                      }
                      required
                    />
                  </div>

                  {/* HERO FIELDS */}
                  {form.type === 'hero' && (
                    <>
                      <div className="form-group">
                        <label>Subtitle</label>
                        <input
                          className="form-control"
                          value={form.subtitle}
                          onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                          placeholder="Optional subtitle"
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Button Text</label>
                          <input className="form-control" value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Button Link</label>
                          <input className="form-control" value={form.buttonLink} onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Background Color</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} style={{ width: '44px', height: '38px', border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }} />
                            <input className="form-control" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Order</label>
                          <input type="number" className="form-control" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} min="0" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* BUDGET FIELDS */}
                  {form.type === 'budget' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Price (₹) *</label>
                          <input type="number" className="form-control" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="299" min="0" />
                        </div>
                        <div className="form-group">
                          <label>Offer Label</label>
                          <input className="form-control" value={form.offer} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))} placeholder="Under" />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Emoji</label>
                          <input className="form-control" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🎀" />
                        </div>
                        <div className="form-group">
                          <label>Card Color</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: '44px', height: '38px', border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }} />
                            <input className="form-control" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                      {/* Budget Preview */}
                      <div style={{ padding: '14px', borderRadius: '50%', width: '140px', height: '140px', margin: '0 auto', background: `linear-gradient(135deg, ${form.color}20, ${form.color}40)`, border: `3px solid ${form.color}`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '1.6rem' }}>{form.emoji || '🎀'}</div>
                        <div style={{ fontSize: '0.55rem', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>{form.offer || 'Under'}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '900', color: form.color }}>₹{form.price || '299'}</div>
                      </div>
                    </>
                  )}

                  {/* SUNNY FIELDS */}
                  {form.type === 'sunny' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="form-group">
                        <label>Category Slug</label>
                        <input className="form-control" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="tops" />
                        <small style={{ color: '#888', fontSize: '11px' }}>
                          URL: /products?category={form.slug}
                        </small>
                      </div>
                      <div className="form-group">
                        <label>Emoji (if no image)</label>
                        <input className="form-control" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="👕" />
                      </div>
                    </div>
                  )}

                  {/* PROMO FIELDS */}
                  {form.type === 'promo' && (
                    <>
                      <div className="form-group">
                        <label>Subtitle</label>
                        <input className="form-control" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Special offer on baby clothing" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Offer % Badge</label>
                          <input className="form-control" value={form.offer} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))} placeholder="20% or 30%" />
                          <small style={{ color: '#888', fontSize: '11px' }}>Shows as circular badge</small>
                        </div>
                        <div className="form-group">
                          <label>Badge Color</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={form.color || '#ff6b9d'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: '44px', height: '38px', border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }} />
                            <input className="form-control" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Emoji (if no image)</label>
                          <input className="form-control" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="🎁" />
                        </div>
                        <div className="form-group">
                          <label>Button Link</label>
                          <input className="form-control" value={form.buttonLink} onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))} placeholder="/products" />
                        </div>
                      </div>
                      {(form.offer || form.color) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8f8f8', borderRadius: '12px' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: form.color || '#ff6b9d', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '900', lineHeight: 1 }}>{form.offer || '20%'}</span>
                            <span style={{ fontSize: '0.45rem', fontWeight: '800', letterSpacing: '1px' }}>OFF</span>
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>{form.title || 'Offer Title'}</p>
                            <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0' }}>{form.subtitle || 'Subtitle'}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* GENDER FIELDS */}
                  {form.type === 'gender' && (
                    <>
                      <div className="form-group">
                        <label>For *</label>
                        <select
                          className="form-control"
                          value={form.gender || 'girl'}
                          onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                        >
                          <option value="girl">👧 Girl - For Her</option>
                          <option value="boy">👦 Boy - For Him</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Subtitle</label>
                        <input
                          className="form-control"
                          value={form.subtitle}
                          onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                          placeholder="e.g. Cute & stylish picks for girls"
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Button Link</label>
                          <input
                            className="form-control"
                            value={form.buttonLink}
                            onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                            placeholder="/products?search=girl"
                          />
                        </div>
                        <div className="form-group">
                          <label>Card Color</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="color" value={form.color || '#ff6b9d'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: '44px', height: '38px', border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }} />
                            <input className="form-control" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Active */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      style={{ width: '16px', height: '16px' }}
                    />
                    ✅ Active (show on home page immediately)
                  </label>
                </div>

                {/* ✅ RIGHT - Image Upload with Delete */}
                <ImageUploadSection />
              </div>

              {/* Form Actions */}
              <div className={styles.formActions} style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || uploading}
                  style={{ flex: 1 }}
                >
                  {saving ? '⏳ Saving...' : editing ? '💾 Update' : '✨ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: HERO */}
      {activeTab === 'hero' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#166534' }}>
              ℹ️ <strong>Active</strong> hero banners appear in the main slider.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('hero')}>+ Add Banner</button>
          </div>
          <div className={banStyles.bannersGrid}>
            {loading ? (
              <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading...</p>
            ) : heroBanners.length === 0 ? (
              <div className={banStyles.empty}><span>🖼️</span><p>No hero banners yet.</p></div>
            ) : heroBanners.map(banner => (
              <div
                key={banner.id}
                className={banStyles.bannerCard}
                style={{
                  backgroundImage: banner.image?.url ? `url(${banner.image.url})` : 'none',
                  backgroundColor: banner.image?.url ? 'transparent' : (banner.bgColor || '#ff6b9d'),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: banner.isActive ? 1 : 0.6,
                }}
              >
                <div className={banStyles.bannerOverlay}>
                  <div className={banStyles.bannerInfo}>
                    <h3>{banner.title}</h3>
                    {banner.subtitle && <p>{banner.subtitle}</p>}
                    <span className={banStyles.btnPreview}>{banner.buttonText}</span>
                  </div>
                  <div className={banStyles.bannerActions}>
                    <button className={banStyles.actionBtn} onClick={() => openEdit(banner)} style={{ background: 'rgba(255,255,255,0.9)', color: '#7c3aed' }}>✏️ Edit</button>
                    <button className={`${banStyles.actionBtn} ${banner.isActive ? banStyles.activeBtn : banStyles.inactiveBtn}`} onClick={() => toggleActive(banner)}>
                      {banner.isActive ? '✅ Active' : '○ Inactive'}
                    </button>
                    <button className={banStyles.deleteActionBtn} onClick={() => handleDelete(banner.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BUDGET */}
      {activeTab === 'budget' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#856404' }}>
              ℹ️ Budget cards show in <strong>Budget Store</strong> section.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('budget')}>+ Add Budget Card</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {budgetBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '40px' }}>🏪</div>
                <p>No budget cards yet.</p>
              </div>
            ) : budgetBanners.map(b => (
              <div
                key={b.id}
                style={{
                  backgroundImage: b.image?.url ? `url(${b.image.url})` : `linear-gradient(135deg, ${b.color || '#ff6b9d'}15, ${b.color || '#ff6b9d'}30)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  border: `3px solid ${b.color || '#ff6b9d'}`,
                  borderRadius: '50%',
                  width: '160px',
                  height: '160px',
                  textAlign: 'center',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  opacity: b.isActive ? 1 : 0.5,
                  margin: '0 auto',
                }}
              >
                {!b.image?.url && (
                  <>
                    <div style={{ fontSize: '2rem' }}>{b.emoji || '🎀'}</div>
                    <div style={{ fontSize: '0.55rem', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>{b.offer || 'Under'}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: b.color || '#ff6b9d' }}>₹{b.price}</div>
                  </>
                )}
                {b.image?.url && (
                  <div style={{ position: 'absolute', bottom: '14px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                    ₹{b.price}
                  </div>
                )}
                {/* Actions */}
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', display: 'flex', gap: '3px' }}>
                  <button onClick={() => openEdit(b)} style={{ background: 'white', border: `1px solid ${b.color || '#ff6b9d'}`, borderRadius: '50%', width: '26px', height: '26px', fontSize: '10px', fontWeight: '700', color: b.color || '#ff6b9d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                  <button onClick={() => toggleActive(b)} style={{ background: b.isActive ? '#d1fae5' : '#fee2e2', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.isActive ? '✅' : '○'}</button>
                  <button onClick={() => handleDelete(b.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SUNNY */}
      {activeTab === 'sunny' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#0c4a6e' }}>
              ℹ️ Sunny cards show in <strong>Sunny Play Days</strong> section.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('sunny')}>+ Add Sunny Card</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {sunnyBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '40px' }}>☀️</div>
                <p>No sunny cards yet.</p>
              </div>
            ) : sunnyBanners.map(s => (
              <div
                key={s.id}
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  height: '200px',
                  backgroundImage: s.image?.url ? `url(${s.image.url})` : 'linear-gradient(170deg, #c5e9f8, #8fd2f2)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  border: '1.5px solid rgba(26,123,174,.2)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: s.isActive ? 1 : 0.5,
                }}
              >
                {!s.image?.url && <span style={{ fontSize: '5rem' }}>{s.emoji || '👕'}</span>}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '36px', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#0d3f5f', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '1px', textTransform: 'uppercase' }}>{s.title}</span>
                </div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(s)} style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #0ea5e9', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', color: '#0ea5e9', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => toggleActive(s)} style={{ background: s.isActive ? '#d1fae5' : '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>{s.isActive ? '✅' : '○'}</button>
                  <button onClick={() => handleDelete(s.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROMO */}
      {activeTab === 'promo' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#92400e' }}>
              ℹ️ Promo offers auto-slide. Add offer % badge (20%, 30%).
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('promo')}>+ Add Promo Offer</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {promoBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '40px' }}>🏷️</div>
                <p>No promo offers yet.</p>
              </div>
            ) : promoBanners.map(p => (
              <div
                key={p.id}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  background: 'white',
                  opacity: p.isActive ? 1 : 0.5,
                  position: 'relative',
                }}
              >
                <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                  {p.image?.url ? (
                    <img src={p.image.url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff0f5, #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                      {p.emoji || '🎁'}
                    </div>
                  )}
                  {p.offer && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '55px', height: '55px', borderRadius: '50%', background: p.color || '#ff6b9d', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '900', lineHeight: 1 }}>{p.offer}</span>
                      <span style={{ fontSize: '0.5rem', fontWeight: '800', letterSpacing: '1px' }}>OFF</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '14px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 4px' }}>{p.title}</h3>
                  {p.subtitle && <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>{p.subtitle}</p>}
                  <span style={{ fontSize: '0.8rem', color: '#ff6b9d', fontWeight: '700', marginTop: '6px', display: 'inline-block' }}>{p.buttonText || 'Shop Now'} →</span>
                </div>
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(p)} style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #ff6b9d', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', color: '#ff6b9d', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => toggleActive(p)} style={{ background: p.isActive ? '#d1fae5' : '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>{p.isActive ? '✅' : '○'}</button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GENDER */}
      {activeTab === 'gender' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#fdf2f8', border: '1px solid #f0abfc', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#701a75' }}>
              ℹ️ Add <strong>2 cards</strong> - one for <strong>Girl</strong> and one for <strong>Boy</strong>.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('gender')}>+ Add Girl/Boy Card</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
            {genderBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '40px' }}>👧👦</div>
                <p>No gender cards yet.</p>
              </div>
            ) : genderBanners.map(g => (
              <div
                key={g.id}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  height: '240px',
                  backgroundImage: g.image?.url ? `url(${g.image.url})` : 'none',
                  backgroundColor: g.image?.url ? 'transparent' : (g.color || '#ff6b9d'),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  position: 'relative',
                  opacity: g.isActive ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                {!g.image?.url && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                    {g.gender === 'girl' ? '👧' : '👦'}
                  </div>
                )}
                <div style={{ width: '100%', padding: '14px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', position: 'relative', zIndex: 1 }}>
                  <p style={{ color: 'white', fontWeight: '800', fontSize: '1rem', margin: '0 0 2px' }}>{g.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0 }}>
                    {g.gender === 'girl' ? '👧 For Her' : '👦 For Him'}
                  </p>
                </div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(g)} style={{ background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', color: '#333', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => toggleActive(g)} style={{ background: g.isActive ? '#d1fae5' : '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>{g.isActive ? '✅' : '○'}</button>
                  <button onClick={() => handleDelete(g.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}