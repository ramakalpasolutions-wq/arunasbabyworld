'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

/* ── All 9 sections ── */
const DEFAULT_SECTIONS = [
  { key: 'hero',          defaultTitle: 'New Arrivals',            defaultEmoji: '🖼️', hint: 'Main hero slider',             color: '#FF6B35' },
  { key: 'brands',        defaultTitle: 'Top Baby Brands',         defaultEmoji: '🏷️', hint: 'Brand names auto scroll',       color: '#7B2FBE' },
  { key: 'season',        defaultTitle: 'Summer Collection',       defaultEmoji: '☀️', hint: 'Season/festival banner',        color: '#F59E0B' },
  { key: 'budget',        defaultTitle: 'Budget Store',            defaultEmoji: '🏪', hint: 'Budget price circles',          color: '#EF4444' },
  { key: 'new-born',      defaultTitle: 'New Born Baby Collection',defaultEmoji: '👶', hint: 'Girl & Boy image cards',        color: '#EC4899' },
  { key: 'care',          defaultTitle: 'Personal Care & Health',  defaultEmoji: '🧴', hint: '2-row auto scroll mix',         color: '#10B981' },
  { key: 'electric',      defaultTitle: 'Electric Rides for Kids', defaultEmoji: '🚗', hint: 'EV product grid',               color: '#0EA5E9' },
  { key: 'trending',      defaultTitle: 'Trending & Featured Mix', defaultEmoji: '🔥', hint: 'Mixed trending + featured',     color: '#F97316' },
  { key: 'cta',           defaultTitle: 'Get 10% Off!',            defaultEmoji: '🎁', hint: 'Sign up CTA section',           color: '#7B2FBE' },
];

const PRESETS = {
  season: [
    { label: '☀️ Summer',    emoji: '☀️', title: 'Summer Collection'    },
    { label: '🌧️ Rainy',    emoji: '🌧️', title: 'Rainy Season Fun'     },
    { label: '❄️ Winter',    emoji: '❄️', title: 'Winter Wonderland'    },
    { label: '🌸 Spring',    emoji: '🌸', title: 'Spring Collection'    },
    { label: '🪔 Diwali',    emoji: '🪔', title: 'Diwali Festival'      },
    { label: '🎄 Christmas', emoji: '🎄', title: 'Christmas Collection' },
    { label: '🎆 New Year',  emoji: '🎆', title: 'New Year Picks'       },
    { label: '💝 Valentine', emoji: '💝', title: 'Valentine Special'    },
    { label: '🎃 Halloween', emoji: '🎃', title: 'Halloween Specials'   },
    { label: '🌿 Monsoon',   emoji: '🌿', title: 'Monsoon Picks'        },
  ],
  budget: [
    { label: '🏪 Regular',   emoji: '🏪', title: 'Budget Store'         },
    { label: '🎁 Festival',  emoji: '🎁', title: 'Festival Deals'       },
    { label: '🪔 Diwali',    emoji: '🪔', title: 'Diwali Offers'        },
    { label: '🎄 Christmas', emoji: '🎄', title: 'Christmas Deals'      },
    { label: '🛍️ Sale',      emoji: '🛍️', title: 'Mega Sale'           },
    { label: '☀️ Summer',    emoji: '☀️', title: 'Summer Deals'         },
    { label: '❄️ Winter',    emoji: '❄️', title: 'Winter Sale'          },
  ],
  trending: [
    { label: '🔥 Default',   emoji: '🔥', title: 'Trending & Featured Mix'},
    { label: '☀️ Summer',    emoji: '☀️', title: 'Summer Hot Picks'     },
    { label: '🪔 Diwali',    emoji: '🪔', title: 'Diwali Top Picks'     },
    { label: '🎄 Christmas', emoji: '🎄', title: 'Christmas Favourites' },
    { label: '🎆 New Year',  emoji: '🎆', title: 'New Year Bestsellers' },
  ],
};

/* ─────────────────────────────────────────────────
   BRANDS MANAGER — fully editable from admin
───────────────────────────────────────────────── */
function BrandsManager() {
  const [brands,    setBrands]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  const emptyForm = { name: '', color: '#FF6B35', link: '/products', isActive: true, order: 0, logo: null };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/brands');
      const data = await res.json();
      setBrands(data.brands || []);
    } catch { toast.error('Failed to load brands'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBrands(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: brands.length });
    setShowForm(true);
  };

  const openEdit = (brand) => {
    setEditing(brand);
    setForm({
      name:     brand.name     || '',
      color:    brand.color    || '#FF6B35',
      link:     brand.link     || '/products',
      isActive: brand.isActive,
      order:    brand.order    || 0,
      logo:     brand.logo     || null,
    });
    setShowForm(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/brands');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, logo: { url: data.url || data.images?.[0]?.url, publicId: data.publicId || '' } }));
      toast.success('Logo uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Brand name required'); return; }
    setSaving(true);
    try {
      const url    = editing ? `/api/brands/${editing.id}` : '/api/brands';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? '✅ Updated!' : '✅ Brand added!');
      setShowForm(false);
      fetchBrands();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this brand?')) return;
    const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted!'); fetchBrands(); }
    else toast.error('Failed');
  };

  const toggleActive = async (brand) => {
    const res = await fetch(`/api/brands/${brand.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: !brand.isActive }),
    });
    if (res.ok) { fetchBrands(); }
  };

  const inp = {
    width: '100%', padding: '9px 12px',
    border: '2px solid #EDD9FF', borderRadius: '10px',
    fontSize: '13px', fontFamily: 'Nunito, sans-serif',
    outline: 'none', background: 'white', color: '#2D1A4A', boxSizing: 'border-box',
  };

  const lbl = {
    display: 'block', fontSize: '11px', fontWeight: '800',
    color: '#7B2FBE', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.6px',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '0 0 3px', color: '#2D1A4A' }}>
            🏷️ Brand Names Management
          </h3>
          <p style={{ fontSize: '12px', color: '#9585B0', margin: 0, fontWeight: '600' }}>
            Add, edit or remove brands shown in the auto-scroll strip
          </p>
        </div>
        <button onClick={openAdd} style={{
          padding: '8px 18px',
          background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 14px rgba(255,107,53,0.25)',
        }}>
          + Add Brand
        </button>
      </div>

      {/* Brand cards grid */}
      {loading ? (
        <p style={{ color: '#9585B0', fontWeight: '600', textAlign: 'center', padding: '20px' }}>⏳ Loading...</p>
      ) : brands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', background: '#FBF7FF', borderRadius: '12px', border: '2px dashed #EDD9FF' }}>
          <p style={{ color: '#9585B0', fontWeight: '700', margin: '0 0 12px' }}>No brands yet</p>
          <button onClick={openAdd} style={{
            padding: '8px 20px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
          }}>+ Add First Brand</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {brands.map(brand => (
            <div key={brand.id} style={{
              background:   'white',
              borderRadius: '12px',
              border:       `2px solid ${brand.isActive ? brand.color + '40' : '#f0f0f0'}`,
              padding:      '12px',
              opacity:      brand.isActive ? 1 : 0.6,
              transition:   'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {brand.logo?.url ? (
                  <img src={brand.logo.url} alt={brand.name}
                    style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '6px',
                    background: `${brand.color}20`, border: `2px solid ${brand.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: brand.color }} />
                  </div>
                )}
                <span style={{ fontSize: '0.90rem', fontWeight: '800', color: brand.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {brand.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => openEdit(brand)} style={{
                  flex: 1, padding: '6px', background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)',
                  color: 'white', border: 'none', borderRadius: '7px',
                  fontSize: '11px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
                }}>✏️ Edit</button>
                <button onClick={() => toggleActive(brand)} style={{
                  padding: '6px 9px',
                  background: brand.isActive ? '#d1fae5' : '#f3f4f6',
                  color: brand.isActive ? '#059669' : '#666',
                  border: `1.5px solid ${brand.isActive ? '#6ee7b7' : '#ddd'}`,
                  borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {brand.isActive ? '✅' : '⭕'}
                </button>
                <button onClick={() => handleDelete(brand.id)} style={{
                  padding: '6px 9px', background: '#fee2e2', color: '#dc2626',
                  border: '1.5px solid #fca5a5', borderRadius: '7px',
                  fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Brand form modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null); } }}
        >
          <div style={{
            background: 'white', borderRadius: '18px', width: '100%', maxWidth: '480px',
            maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px 12px', borderBottom: '1.5px solid #EDD9FF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, background: 'white', zIndex: 10, borderRadius: '18px 18px 0 0',
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: '#2D1A4A' }}>
                {editing ? '✏️ Edit Brand' : '➕ Add Brand'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'inherit', color: '#2D1A4A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Brand name */}
              <div>
                <label style={lbl}>Brand Name *</label>
                <input type="text" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Mothercare" required style={inp} />
              </div>

              {/* Color */}
              <div>
                <label style={lbl}>Brand Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={form.color}
                    onChange={e => set('color', e.target.value)}
                    style={{ width: '44px', height: '38px', border: '2px solid #EDD9FF', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                  <input type="text" value={form.color}
                    onChange={e => set('color', e.target.value)}
                    style={{ ...inp, flex: 1 }} />
                  {/* Preview */}
                  <div style={{
                    padding: '6px 14px', background: `${form.color}15`,
                    border: `2px solid ${form.color}`, borderRadius: '999px',
                    fontSize: '12px', fontWeight: '800', color: form.color,
                    whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif',
                  }}>
                    {form.name || 'Brand'}
                  </div>
                </div>
              </div>

              {/* Link */}
              <div>
                <label style={lbl}>Brand Page Link</label>
                <input type="text" value={form.link}
                  onChange={e => set('link', e.target.value)}
                  placeholder="/products?brand=mothercare" style={inp} />
              </div>

              {/* Logo upload */}
              <div>
                <label style={lbl}>Logo Image (optional)</label>
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <input type="file" accept="image/*" onChange={handleLogoUpload}
                    style={{ display: 'none' }} disabled={uploading} />
                  <div style={{
                    height: '80px', border: `2px dashed ${form.color}`,
                    borderRadius: '10px', background: `${form.color}08`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative', cursor: 'pointer',
                  }}>
                    {uploading ? (
                      <p style={{ color: form.color, fontWeight: '700', fontSize: '12px' }}>⏳ Uploading...</p>
                    ) : form.logo?.url ? (
                      <>
                        <img src={form.logo.url} alt="" style={{ height: '60px', objectFit: 'contain' }} />
                        <div style={{
                          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transition: 'opacity 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                          <p style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>📷 Click to Change</p>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px' }}>🏷️</div>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: form.color, margin: '4px 0 0', fontFamily: 'Nunito, sans-serif' }}>
                          Click to upload logo
                        </p>
                      </div>
                    )}
                  </div>
                </label>
                {form.logo?.url && (
                  <button type="button" onClick={() => set('logo', null)} style={{
                    marginTop: '5px', width: '100%', background: '#fee2e2', color: '#dc2626',
                    border: '1px solid #fca5a5', borderRadius: '7px', padding: '5px',
                    fontSize: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  }}>🗑️ Remove Logo</button>
                )}
              </div>

              {/* Order */}
              <div>
                <label style={lbl}>Order (0 = first)</label>
                <input type="number" value={form.order}
                  onChange={e => set('order', parseInt(e.target.value) || 0)}
                  min="0" style={inp} />
              </div>

              {/* Active */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#2D1A4A' }}>
                <input type="checkbox" checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#FF6B35', cursor: 'pointer' }} />
                ✅ Active — show in brand scroll
              </label>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={{
                  padding: '10px 18px', border: '2px solid #EDD9FF', borderRadius: '10px',
                  background: 'white', color: '#6B4E8A', fontWeight: '700',
                  fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                }}>Cancel</button>
                <button type="submit" disabled={saving || uploading} style={{
                  flex: 1, padding: '10px 18px',
                  background: saving ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: '800', fontSize: '13px',
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: saving ? 'none' : '0 4px 14px rgba(255,107,53,0.30)',
                }}>
                  {saving ? '⏳ Saving...' : editing ? '💾 Update Brand' : '✨ Add Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   SECTION SETTINGS — name + emoji editable
───────────────────────────────────────────────── */
export default function SectionSettingsPage() {
  const [settings, setSettings] = useState({});
  const [saving,   setSaving]   = useState(null);
  const [saved,    setSaved]    = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sectionSettings');
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
  }, []);

  const updateSetting = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  const applyPreset = (key, preset) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), title: preset.title, emoji: preset.emoji },
    }));
    toast.success(`Applied: ${preset.label} ✅`);
  };

  const saveSection = (key) => {
    setSaving(key);
    try {
      const current = JSON.parse(localStorage.getItem('sectionSettings') || '{}');
      localStorage.setItem('sectionSettings', JSON.stringify({ ...current, [key]: settings[key] || {} }));
      setSaved(key);
      toast.success('✅ Saved! Refresh home page.');
      setTimeout(() => setSaved(null), 2500);
    } catch { toast.error('Failed'); }
    finally { setSaving(null); }
  };

  const resetSection = (key) => {
    setSettings(prev => { const u = { ...prev }; delete u[key]; return u; });
    const current = JSON.parse(localStorage.getItem('sectionSettings') || '{}');
    delete current[key];
    localStorage.setItem('sectionSettings', JSON.stringify(current));
    toast.success('Reset ↺');
  };

  const saveAll = () => {
    localStorage.setItem('sectionSettings', JSON.stringify(settings));
    toast.success('✅ All saved! Refresh home page.');
  };

  const resetAll = () => {
    if (!confirm('Reset ALL sections?')) return;
    setSettings({});
    localStorage.removeItem('sectionSettings');
    toast.success('All reset');
  };

  const inp = {
    width: '100%', padding: '10px 12px',
    border: '2px solid #EDD9FF', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'Nunito, sans-serif',
    outline: 'none', background: 'white', color: '#2D1A4A', boxSizing: 'border-box',
  };

  const lbl = {
    display: 'block', fontSize: '11px', fontWeight: '800',
    color: '#7B2FBE', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>
            🎨 Section Settings & Brand Manager
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>
            Edit section names for seasons + manage brand names shown on home page
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={resetAll} style={{
            padding: '9px 18px', background: '#fee2e2', color: '#dc2626',
            border: '1.5px solid #fca5a5', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
          }}>↺ Reset All</button>
          <button onClick={saveAll} style={{
            padding: '9px 22px',
            background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(255,107,53,0.28)',
          }}>💾 Save All</button>
        </div>
      </div>

      {/* Info */}
      <div style={{
        background: '#F0FDF4', border: '1.5px solid #BBF7D0',
        borderRadius: '12px', padding: '12px 16px', marginBottom: '24px',
        fontSize: '13px', color: '#166534', lineHeight: 1.7, fontWeight: '600',
      }}>
        💡 Change section names for seasons/occasions. Changes appear on home page after refresh.
        All 9 sections are listed below — each one is fully customizable.
      </div>

      {/* Section name cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {DEFAULT_SECTIONS.map((section, idx) => {
          const current  = settings[section.key] || {};
          const title    = current.title !== undefined ? current.title : section.defaultTitle;
          const emoji    = current.emoji !== undefined ? current.emoji : section.defaultEmoji;
          const isEdited = !!(current.title || current.emoji);
          const presets  = PRESETS[section.key] || [];

          return (
            <div key={section.key} style={{
              background:   'white',
              borderRadius: '14px',
              border:       `2px solid ${isEdited ? section.color : '#EDD9FF'}`,
              overflow:     'hidden',
              boxShadow:    isEdited ? `0 4px 16px ${section.color}20` : '0 2px 10px rgba(123,47,190,0.06)',
            }}>
              {/* Top bar */}
              <div style={{
                padding:    '12px 18px',
                background: isEdited ? `linear-gradient(135deg, ${section.color}10, #F3E8FF)` : '#FBF7FF',
                borderBottom: '1.5px solid #EDD9FF',
                display:    'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Section number */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: section.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '800', flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{
                    fontSize: '1.5rem', width: '42px', height: '42px',
                    borderRadius: '10px',
                    background: isEdited ? `${section.color}15` : 'white',
                    border: `2px solid ${isEdited ? section.color : '#EDD9FF'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {emoji}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', margin: '0 0 2px', color: '#2D1A4A' }}>
                      {emoji} {title}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#9585B0', margin: 0, fontWeight: '600' }}>
                      {section.hint}
                      {isEdited && (
                        <span style={{
                          marginLeft: '8px', padding: '1px 7px',
                          background: `${section.color}15`, color: section.color,
                          borderRadius: '999px', fontSize: '10px', fontWeight: '800',
                          border: `1px solid ${section.color}40`,
                        }}>● Customized</span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
                  {isEdited && (
                    <button onClick={() => resetSection(section.key)} style={{
                      padding: '6px 12px', background: '#fee2e2', color: '#dc2626',
                      border: '1px solid #fca5a5', borderRadius: '7px',
                      fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                    }}>↺</button>
                  )}
                  <button onClick={() => saveSection(section.key)} disabled={saving === section.key} style={{
                    padding: '6px 16px',
                    background: saved === section.key
                      ? '#d1fae5'
                      : `linear-gradient(135deg, ${section.color}, #7B2FBE)`,
                    color: saved === section.key ? '#059669' : 'white',
                    border: 'none', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '800',
                    cursor: saving === section.key ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}>
                    {saved === section.key ? '✅ Saved!' : saving === section.key ? '⏳' : '💾 Save'}
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={lbl}>Emoji</label>
                    <input type="text" value={emoji}
                      onChange={e => updateSetting(section.key, 'emoji', e.target.value)}
                      placeholder={section.defaultEmoji}
                      style={{ ...inp, textAlign: 'center', fontSize: '20px', padding: '8px' }} />
                  </div>
                  <div>
                    <label style={lbl}>Section Title</label>
                    <input type="text" value={title}
                      onChange={e => updateSetting(section.key, 'title', e.target.value)}
                      placeholder={section.defaultTitle}
                      style={inp} />
                  </div>
                </div>

                {/* Preview */}
                <div style={{
                  padding: '7px 12px', background: `${section.color}08`,
                  border: `1.5px solid ${section.color}30`, borderRadius: '8px',
                  marginBottom: presets.length ? '10px' : 0,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '11px', color: '#9585B0', fontWeight: '700' }}>Preview:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#2D1A4A' }}>{emoji} {title}</span>
                </div>

                {/* Presets */}
                {presets.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#9585B0', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚡ Season Presets
                    </p>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {presets.map((preset, i) => {
                        const isActive = title === preset.title && emoji === preset.emoji;
                        return (
                          <button key={i} onClick={() => applyPreset(section.key, preset)} style={{
                            padding: '4px 12px',
                            background: isActive ? `linear-gradient(135deg, ${section.color}, #7B2FBE)` : '#F3E8FF',
                            color: isActive ? 'white' : '#7B2FBE',
                            border: isActive ? 'none' : '1.5px solid #DFC5F8',
                            borderRadius: '999px', fontSize: '12px', fontWeight: '700',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                          }}>
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BRANDS MANAGER */}
      <div style={{
        background:   'white',
        borderRadius: '16px',
        border:       '2px solid #EDD9FF',
        padding:      '20px',
        boxShadow:    '0 4px 16px rgba(123,47,190,0.08)',
      }}>
        <BrandsManager />
      </div>

      {/* Bottom save */}
      <div style={{
        marginTop: '24px', textAlign: 'center', padding: '20px',
        background: 'linear-gradient(135deg,#FFF3EC,#F3E8FF)',
        borderRadius: '14px', border: '1.5px solid #EDD9FF',
      }}>
        <p style={{ color: '#6B4E8A', fontWeight: '600', fontSize: '13px', margin: '0 0 12px' }}>
          💡 After saving section names, refresh the home page ✨
        </p>
        <button onClick={saveAll} style={{
          padding: '12px 36px',
          background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
          color: 'white', border: 'none', borderRadius: '12px',
          fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 20px rgba(255,107,53,0.30)',
        }}>
          💾 Save All Section Names
        </button>
      </div>
    </div>
  );
}