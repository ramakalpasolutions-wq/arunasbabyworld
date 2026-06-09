'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// ============================================================
// PANEL DEFAULTS — Hero uses only ONE media panel now
// ============================================================
const PANEL_DEFAULTS = [
  { label: '🔥 Trending Now', sublabel: '2.4k sold this week', link: '/products', bg: '#FFF3E8', isBig: true, url: '', publicId: '' },
];

const DEFAULT_SECTIONS = [
  { key: 'hero',          defaultTitle: 'New Arrivals',     defaultEmoji: '🖼️', hint: 'Main hero slider',        color: '#FF6B35' },
  { key: 'category',      defaultTitle: 'Shop By Category', defaultEmoji: '📁', hint: 'Home page category cards', color: '#FF6B35' },
  { key: 'budget',        defaultTitle: 'Budget Store',      defaultEmoji: '🏪', hint: 'Budget price circles',     color: '#F59E0B' },
  { key: 'sunny',         defaultTitle: 'Sunny Play Days',   defaultEmoji: '☀️', hint: 'Category cards section',   color: '#0EA5E9' },
  { key: 'promo',         defaultTitle: 'Special Offers',    defaultEmoji: '🏷️', hint: 'Sliding offer cards',      color: '#EF4444' },
  { key: 'gender',        defaultTitle: 'Shop by Style',     defaultEmoji: '👗', hint: 'Girl & Boy cards',         color: '#EC4899' },
  { key: 'baby-food',     defaultTitle: 'Baby Food',         defaultEmoji: '🍼', hint: 'Baby food section',        color: '#10B981' },
  { key: 'toys',          defaultTitle: 'Toys & Games',      defaultEmoji: '🧸', hint: 'Toys & games section',     color: '#EF4444' },
  { key: 'electric',      defaultTitle: 'Electric Rides',    defaultEmoji: '🚗', hint: 'Electric vehicle section', color: '#0EA5E9' },
  { key: 'personal-care', defaultTitle: 'Personal Care',     defaultEmoji: '🧴', hint: 'Bento grid (4 images)',    color: '#7B2FBE' },
  { key: 'health-care',   defaultTitle: 'Health & Safety',   defaultEmoji: '🏥', hint: 'Mosaic grid (5 images)',   color: '#10B981' },
  { key: 'wellness',      defaultTitle: 'Wellness & Care Products', defaultEmoji: '🌿', hint: 'Care section heading', color: '#7B2FBE' },
];

const SEASON_PRESETS = {
  hero: [
    { label: '🌟 Default', emoji: '🖼️', title: 'New Arrivals' },
    { label: '☀️ Summer',  emoji: '☀️', title: 'Summer Collection' },
    { label: '🌧️ Rainy',   emoji: '🌧️', title: 'Rainy Season Picks' },
    { label: '❄️ Winter',  emoji: '❄️', title: 'Winter Collection' },
    { label: '🪔 Diwali',  emoji: '🪔', title: 'Diwali Collection' },
    { label: '🎄 Christmas', emoji: '🎄', title: 'Christmas Picks' },
  ],
  category: [
    { label: '📁 Default', emoji: '📁', title: 'Shop By Category' },
    { label: '🎁 Festival', emoji: '🎁', title: 'Festival Picks' },
    { label: '☀️ Summer',  emoji: '☀️', title: 'Summer Categories' },
  ],
  budget: [
    { label: '🏪 Default', emoji: '🏪', title: 'Budget Store' },
    { label: '🎁 Festival', emoji: '🎁', title: 'Festival Deals' },
    { label: '🪔 Diwali',  emoji: '🪔', title: 'Diwali Offers' },
  ],
  sunny: [
    { label: '☀️ Summer',  emoji: '☀️', title: 'Sunny Play Days' },
    { label: '🌧️ Rainy',   emoji: '🌧️', title: 'Rainy Season Fun' },
    { label: '❄️ Winter',  emoji: '❄️', title: 'Winter Wonderland' },
  ],
  promo: [
    { label: '🏷️ Default', emoji: '🏷️', title: 'Special Offers' },
    { label: '🪔 Diwali',  emoji: '🪔', title: 'Diwali Special' },
    { label: '🎄 Christmas', emoji: '🎄', title: 'Christmas Sale' },
  ],
  gender: [
    { label: '👗 Default', emoji: '👗', title: 'Shop by Style' },
    { label: '☀️ Summer',  emoji: '☀️', title: 'Summer Style' },
  ],
  toys: [
    { label: '🧸 Default', emoji: '🧸', title: 'Toys & Games' },
    { label: '🎄 Christmas', emoji: '🎄', title: 'Christmas Toys' },
  ],
  'personal-care': [
    { label: '🧴 Default', emoji: '🧴', title: 'Personal Baby Care' },
    { label: '☀️ Summer',  emoji: '☀️', title: 'Summer Care' },
  ],
  'health-care': [
    { label: '🏥 Default', emoji: '🏥', title: 'Health & Safety' },
    { label: '💊 Medical', emoji: '💊', title: 'Baby Health Essentials' },
  ],
  wellness: [
    { label: '🌿 Default', emoji: '🌿', title: 'Wellness & Care Products' },
    { label: '💚 Natural', emoji: '💚', title: 'Natural Wellness' },
  ],
};

// ============================================================
// SECTION SETTINGS COMPONENT
// ============================================================
function SectionSettings() {
  const [settings,  setSettings]  = useState({});
  const [saving,    setSaving]    = useState(null);
  const [saved,     setSaved]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/section-settings');
        const data = await res.json();
        setSettings(data.settings || {});
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateSetting = (key, field, value) => {
    setSettings(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  const applyPreset = (sectionKey, preset) => {
    setSettings(prev => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), title: preset.title, emoji: preset.emoji } }));
    toast.success(`Applied: ${preset.label} ✅`);
  };

  const saveSection = async (key) => {
    setSaving(key);
    try {
      const res = await fetch('/api/section-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { [key]: settings[key] || {} } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSaved(key);
      toast.success('✅ Saved!');
      setTimeout(() => setSaved(null), 2500);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const saveAll = async () => {
    setSavingAll(true);
    try {
      const res = await fetch('/api/section-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('✅ All saved!');
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSavingAll(false);
    }
  };

  const resetSection = async (key) => {
    const section = DEFAULT_SECTIONS.find(s => s.key === key);
    const defaultData = { title: section?.defaultTitle || '', emoji: section?.defaultEmoji || '' };
    setSettings(prev => ({ ...prev, [key]: defaultData }));
    try {
      await fetch('/api/section-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { [key]: defaultData } }),
      });
      toast.success('Reset ↺');
    } catch {
      toast.error('Failed to reset');
    }
  };

  const resetAll = async () => {
    if (!confirm('Reset ALL sections to default?')) return;
    const defaults = {};
    DEFAULT_SECTIONS.forEach(s => { defaults[s.key] = { title: s.defaultTitle, emoji: s.defaultEmoji }; });
    setSettings(defaults);
    try {
      await fetch('/api/section-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: defaults }),
      });
      toast.success('All reset ↺');
    } catch {
      toast.error('Failed');
    }
  };

  const inp = { width: '100%', padding: '11px 13px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', background: 'white', color: '#2D1A4A', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#7B2FBE', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#9585B0', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
        <p style={{ fontWeight: '700' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>🎨 Section Names & Seasons</h2>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.82rem', fontWeight: '600' }}>✅ Saved to MongoDB</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={resetAll} style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>↺ Reset All</button>
          <button onClick={saveAll} disabled={savingAll} style={{ padding: '8px 20px', background: savingAll ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: savingAll ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {savingAll ? '⏳ Saving...' : '💾 Save All'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {DEFAULT_SECTIONS.map(section => {
          const current  = settings[section.key] || {};
          const title    = (current.title !== undefined && current.title !== null && current.title !== '') ? current.title : section.defaultTitle;
          const emoji    = (current.emoji !== undefined && current.emoji !== null && current.emoji !== '') ? current.emoji : section.defaultEmoji;
          const isEdited = !!(current.title || current.emoji);
          const presets  = SEASON_PRESETS[section.key] || [];
          const showExtra = ['personal-care', 'health-care', 'wellness'].includes(section.key);

          return (
            <div key={section.key} style={{ background: 'white', borderRadius: '14px', border: `2px solid ${isEdited ? section.color : '#EDD9FF'}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', background: isEdited ? `linear-gradient(135deg, ${section.color}10, #F3E8FF)` : '#FBF7FF', borderBottom: '1.5px solid #EDD9FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '1.6rem', width: '46px', height: '46px', borderRadius: '12px', background: isEdited ? `${section.color}15` : 'white', border: `2px solid ${isEdited ? section.color : '#EDD9FF'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{emoji}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '0 0 2px', color: '#2D1A4A' }}>{emoji} {title}</h3>
                    <p style={{ fontSize: '11px', color: '#9585B0', margin: 0, fontWeight: '600' }}>{section.hint}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
                  {isEdited && (
                    <button onClick={() => resetSection(section.key)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>↺</button>
                  )}
                  <button onClick={() => saveSection(section.key)} disabled={saving === section.key} style={{ padding: '6px 16px', background: saved === section.key ? '#d1fae5' : `linear-gradient(135deg, ${section.color}, #7B2FBE)`, color: saved === section.key ? '#059669' : 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {saved === section.key ? '✅' : saving === section.key ? '⏳' : '💾 Save'}
                  </button>
                </div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={lbl}>Emoji</label>
                    <input type="text" value={emoji || ''} onChange={e => updateSetting(section.key, 'emoji', e.target.value)} placeholder={section.defaultEmoji} style={{ ...inp, textAlign: 'center', fontSize: '20px', padding: '8px' }} />
                  </div>
                  <div>
                    <label style={lbl}>Section Title</label>
                    <input type="text" value={title || ''} onChange={e => updateSetting(section.key, 'title', e.target.value)} placeholder={section.defaultTitle} style={inp} />
                  </div>
                </div>

                {showExtra && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={lbl}>Subtitle / Badge</label>
                      <input type="text" value={current.subtitle || ''} onChange={e => updateSetting(section.key, 'subtitle', e.target.value)} placeholder={section.key === 'personal-care' ? '🧴 Baby Care Essentials' : section.key === 'health-care' ? '💊 Stay Safe & Healthy' : '🌿 Baby Wellness'} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Description</label>
                      <input type="text" value={current.description || ''} onChange={e => updateSetting(section.key, 'description', e.target.value)} placeholder="Short description..." style={inp} />
                    </div>
                    {section.key !== 'wellness' && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={lbl}>Button Text</label>
                        <input type="text" value={current.buttonText || ''} onChange={e => updateSetting(section.key, 'buttonText', e.target.value)} placeholder="View All" style={inp} />
                      </div>
                    )}
                    {section.key === 'wellness' && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={lbl}>Badge Text</label>
                        <input type="text" value={current.badge || ''} onChange={e => updateSetting(section.key, 'badge', e.target.value)} placeholder="🌿 Baby Wellness" style={inp} />
                      </div>
                    )}
                  </div>
                )}

                {presets.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#9585B0', margin: '0 0 7px', textTransform: 'uppercase' }}>⚡ Quick Presets</p>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {presets.map((preset, i) => (
                        <button key={i} onClick={() => applyPreset(section.key, preset)} style={{ padding: '5px 13px', background: title === preset.title && emoji === preset.emoji ? `linear-gradient(135deg, ${section.color}, #7B2FBE)` : '#F3E8FF', color: title === preset.title && emoji === preset.emoji ? 'white' : '#7B2FBE', border: title === preset.title && emoji === preset.emoji ? 'none' : '1.5px solid #DFC5F8', borderRadius: '999px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// BRANDS TAB COMPONENT
// ============================================================
function BrandsTab() {
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
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBrands(); }, []);

  const openAdd  = () => { setEditing(null); setForm({ ...emptyForm, order: brands.length }); setShowForm(true); };
  const openEdit = (brand) => {
    setEditing(brand);
    setForm({ name: brand.name || '', color: brand.color || '#FF6B35', link: brand.link || '/products', isActive: brand.isActive, order: brand.order || 0, logo: brand.logo || null });
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
      setForm(f => ({ ...f, logo: { url: data.url || data.images?.[0]?.url, publicId: data.publicId || data.images?.[0]?.publicId || '' } }));
      toast.success('✅ Logo uploaded!');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() && !form.logo?.url) { toast.error('Please add brand name OR logo'); return; }
    setSaving(true);
    try {
      const url    = editing ? `/api/brands/${editing.id}` : '/api/brands';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? '✅ Updated!' : '✅ Added!');
      setShowForm(false); setEditing(null); fetchBrands();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this brand?')) return;
    const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted ✅'); fetchBrands(); }
    else toast.error('Failed');
  };

  const toggleActive = async (brand) => {
    const res = await fetch(`/api/brands/${brand.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !brand.isActive }) });
    if (res.ok) { toast.success(!brand.isActive ? '✅ Active!' : '⭕ Inactive'); fetchBrands(); }
  };

  const inp = { width: '100%', padding: '11px 13px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', background: 'white', color: '#2D1A4A', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#7B2FBE', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', background: '#FBF7FF', borderRadius: '12px', border: '1.5px solid #EDD9FF' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#6B4E8A', fontWeight: '600' }}>🏷️ Brand auto-scroll strip on home page</p>
        <button onClick={openAdd} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Brand</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9585B0' }}>⏳ Loading...</div>
      ) : brands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '2px dashed #EDD9FF', color: '#9585B0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏷️</div>
          <p style={{ fontWeight: '700', fontSize: '1rem', margin: '0 0 16px' }}>No brands yet!</p>
          <button onClick={openAdd} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add First Brand</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {brands.map(brand => (
            <div key={brand.id} style={{ background: 'white', borderRadius: '14px', border: `2px solid ${brand.isActive ? brand.color + '40' : '#f0f0f0'}`, padding: '16px', opacity: brand.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                {brand.logo?.url
                  ? <img src={brand.logo.url} alt={brand.name} style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', border: `2px solid ${brand.color}30` }} />
                  : <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: `${brand.color}15`, border: `2px solid ${brand.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', background: brand.color }} /></div>
                }
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: brand.color, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.name}</h3>
                  <p style={{ fontSize: '11px', color: '#9585B0', margin: 0, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {brand.link}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => openEdit(brand)} style={{ flex: 1, padding: '8px 10px', background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
                <button onClick={() => toggleActive(brand)} style={{ padding: '8px 10px', background: brand.isActive ? '#d1fae5' : '#f3f4f6', color: brand.isActive ? '#059669' : '#666', border: `1.5px solid ${brand.isActive ? '#6ee7b7' : '#ddd'}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>{brand.isActive ? '✅' : '⭕'}</button>
                <button onClick={() => handleDelete(brand.id)} style={{ padding: '8px 10px', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null); } }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10, padding: '16px 20px 12px', borderBottom: '1.5px solid #EDD9FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px 20px 0 0' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#2D1A4A' }}>{editing ? '✏️ Edit Brand' : '➕ Add Brand'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit' }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Brand Name (optional if logo uploaded)</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mothercare" style={inp} />
              </div>
              <div>
                <label style={lbl}>Brand Color</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: '48px', height: '42px', border: '2px solid #EDD9FF', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                  <input type="text" value={form.color} onChange={e => set('color', e.target.value)} style={{ ...inp, flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Brand Link</label>
                <input type="text" value={form.link} onChange={e => set('link', e.target.value)} placeholder="/products" style={inp} />
              </div>
              <div>
                <label style={lbl}>Logo (optional)</label>
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploading} />
                  <div style={{ width: '100%', height: '90px', border: `2px dashed ${form.color}`, borderRadius: '12px', background: `${form.color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {uploading
                      ? <p style={{ color: form.color, fontWeight: '700' }}>⏳ Uploading...</p>
                      : form.logo?.url
                        ? <img src={form.logo.url} alt="logo" style={{ height: '70px', objectFit: 'contain' }} />
                        : <div style={{ textAlign: 'center' }}><div style={{ fontSize: '22px' }}>🏷️</div><p style={{ fontSize: '12px', fontWeight: '700', color: form.color, margin: '4px 0 0' }}>Click to upload</p></div>
                    }
                  </div>
                </label>
                {form.logo?.url && (
                  <button type="button" onClick={() => set('logo', null)} style={{ marginTop: '6px', width: '100%', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Remove</button>
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#2D1A4A' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#FF6B35' }} />
                ✅ Active
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '12px 18px', border: '2px solid #EDD9FF', borderRadius: '10px', background: 'white', color: '#6B4E8A', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={saving || uploading} style={{ flex: 1, padding: '12px 18px', background: saving ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? '⏳ Saving...' : editing ? '💾 Update' : '✨ Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CARE GRID MANAGER — Personal Care & Health Care
// ============================================================
function CareGridManager({ type, title, accentColor, layout }) {
  const SLOTS = layout === 'bento'
    ? [
        { key: 0, label: '🟪 Big Card (Left, Tall)', area: 'bentoBig'  },
        { key: 1, label: '🟦 Top Right 1',           area: 'bentoTop1' },
        { key: 2, label: '🟦 Top Right 2',           area: 'bentoTop2' },
        { key: 3, label: '🟧 Wide Bottom',           area: 'bentoWide' },
      ]
    : [
        { key: 0, label: '🟦 Top Left',          area: 'mosaicTL' },
        { key: 1, label: '🟧 Top Right (Wide)',  area: 'mosaicTR' },
        { key: 2, label: '🟪 Bottom Left',       area: 'mosaicBL' },
        { key: 3, label: '🟦 Bottom Center',     area: 'mosaicBC' },
        { key: 4, label: '🟩 Bottom Right',      area: 'mosaicBR' },
      ];

  const [banners,  setBanners]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [uploading, setUploading] = useState({});
  const [saving,    setSaving]    = useState(false);

  const fallbackLink = type === 'personal-care' ? '/products?category=personal-care' : '/products?category=health-care';

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/banners');
      const data = await res.json();
      const filtered = (data.banners || []).filter(b => b.type === type).sort((a, b) => (a.order || 0) - (b.order || 0));
      const padded = [];
      for (let i = 0; i < SLOTS.length; i++) {
        if (filtered[i]) padded.push(filtered[i]);
        else padded.push({ _new: true, type, title: `${title} ${i + 1}`, image: null, mobileImage: null, isActive: true, order: i, buttonLink: fallbackLink });
      }
      setBanners(padded);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, [type]);

  const uploadImage = async (slotIndex, side, file) => {
    if (!file) return;
    const k = `${slotIndex}-${side}`;
    setUploading(prev => ({ ...prev, [k]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', `firstcry/banners/${type}`);
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const imgObj = { url: data.url || data.images?.[0]?.url, publicId: data.publicId || data.images?.[0]?.publicId || '' };
      setBanners(prev => {
        const u = [...prev];
        if (side === 'front') u[slotIndex] = { ...u[slotIndex], image: imgObj };
        else                  u[slotIndex] = { ...u[slotIndex], mobileImage: imgObj };
        return u;
      });
      toast.success(`✅ ${side === 'front' ? 'Front' : 'Back'} uploaded!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(prev => ({ ...prev, [k]: false }));
    }
  };

  const removeImage = (slotIndex, side) => {
    setBanners(prev => {
      const u = [...prev];
      if (side === 'front') u[slotIndex] = { ...u[slotIndex], image: null };
      else                  u[slotIndex] = { ...u[slotIndex], mobileImage: null };
      return u;
    });
  };

  const updateLink = (slotIndex, value) => {
    setBanners(prev => {
      const u = [...prev];
      u[slotIndex] = { ...u[slotIndex], buttonLink: value };
      return u;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (let i = 0; i < banners.length; i++) {
        const b = banners[i];
        if (b._new && !b.image && !b.mobileImage) continue;
        const payload = {
          title:       b.title       || `${title} ${i + 1}`,
          type,
          image:       b.image       || null,
          mobileImage: b.mobileImage || null,
          buttonLink:  b.buttonLink  || fallbackLink,
          isActive:    b.isActive !== false,
          order:       i,
        };
        if (b.id) {
          await fetch(`/api/banners/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
          await fetch('/api/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
      }
      toast.success('✅ All saved!');
      fetchBanners();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9585B0' }}>⏳ Loading...</div>;
  }

  const SlotCard = ({ slot, slotIndex }) => {
    const banner   = banners[slotIndex] || {};
    const frontImg = banner.image?.url;
    const backImg  = banner.mobileImage?.url;
    const uplF     = uploading[`${slotIndex}-front`];
    const uplB     = uploading[`${slotIndex}-back`];

    return (
      <div className={`careSlot care-${slot.area}`} style={{ border: `2px solid ${accentColor}40`, borderRadius: '14px', background: 'white', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ background: `${accentColor}12`, padding: '7px 10px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: accentColor, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {slot.label}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '800', color: '#7B2FBE', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>🖼️ FRONT</p>
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept="image/*" onChange={e => uploadImage(slotIndex, 'front', e.target.files[0])} style={{ display: 'none' }} disabled={uplF} />
              <div style={{ width: '100%', height: '120px', border: `2px dashed ${accentColor}`, borderRadius: '10px', background: '#fff8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uplF ? <p style={{ color: accentColor, fontWeight: '700', fontSize: '11px', margin: 0 }}>⏳</p>
                  : frontImg
                    ? <img src={frontImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px' }}>📷</div><p style={{ margin: '3px 0 0', fontSize: '10px', fontWeight: '700', color: accentColor, fontFamily: 'Nunito, sans-serif' }}>Click</p></div>}
              </div>
            </label>
            {frontImg && (
              <button type="button" onClick={() => removeImage(slotIndex, 'front')} style={{ marginTop: '4px', width: '100%', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            )}
          </div>

          <div>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '800', color: '#10B981', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>🔄 BACK</p>
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept="image/*" onChange={e => uploadImage(slotIndex, 'back', e.target.files[0])} style={{ display: 'none' }} disabled={uplB} />
              <div style={{ width: '100%', height: '120px', border: `2px dashed #10B981`, borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uplB ? <p style={{ color: '#10B981', fontWeight: '700', fontSize: '11px', margin: 0 }}>⏳</p>
                  : backImg
                    ? <img src={backImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px' }}>🔄</div><p style={{ margin: '3px 0 0', fontSize: '10px', fontWeight: '700', color: '#10B981', fontFamily: 'Nunito, sans-serif' }}>Click</p></div>}
              </div>
            </label>
            {backImg && (
              <button type="button" onClick={() => removeImage(slotIndex, 'back')} style={{ marginTop: '4px', width: '100%', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
            )}
          </div>
        </div>

        <input
          type="text"
          value={banner.buttonLink || ''}
          onChange={e => updateLink(slotIndex, e.target.value)}
          placeholder="🔗 Card link"
          style={{ width: '100%', padding: '8px 10px', fontSize: '11px', border: '1.5px solid #EDD9FF', borderRadius: '7px', fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#2D1A4A', boxSizing: 'border-box' }}
        />
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', padding: '14px 18px', background: `linear-gradient(135deg, ${accentColor}15, #FBF7FF)`, borderRadius: '12px', border: `2px solid ${accentColor}30` }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', fontFamily: 'Nunito, sans-serif' }}>
            {layout === 'bento' ? '🧴 Personal Care' : '🏥 Health Care'} — {SLOTS.length} Image Cards
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9585B0', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
            Each card has Front + Back image (3D flip on hover). Section text editable in 🎨 Section Names tab.
          </p>
        </div>
        <button onClick={saveAll} disabled={saving} style={{ padding: '10px 22px', background: saving ? '#ccc' : `linear-gradient(135deg, ${accentColor}, #7B2FBE)`, color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {saving ? '⏳ Saving...' : '💾 Save All'}
        </button>
      </div>

      <div className={`careGrid ${layout === 'bento' ? 'careBentoLayout' : 'careMosaicLayout'}`}>
        {SLOTS.map((slot, i) => <SlotCard key={i} slot={slot} slotIndex={i} />)}
      </div>

      <style>{`
        .careGrid { display: grid; gap: 14px; }
        .careBentoLayout { grid-template-columns: 1.4fr 1fr 1fr; grid-template-rows: auto auto; }
        .careBentoLayout .care-bentoBig  { grid-column: 1; grid-row: 1 / span 2; }
        .careBentoLayout .care-bentoTop1 { grid-column: 2; grid-row: 1; }
        .careBentoLayout .care-bentoTop2 { grid-column: 3; grid-row: 1; }
        .careBentoLayout .care-bentoWide { grid-column: 2 / span 2; grid-row: 2; }
        .careMosaicLayout { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto; }
        .careMosaicLayout .care-mosaicTL { grid-column: 1; grid-row: 1; }
        .careMosaicLayout .care-mosaicTR { grid-column: 2 / span 2; grid-row: 1; }
        .careMosaicLayout .care-mosaicBL { grid-column: 1; grid-row: 2; }
        .careMosaicLayout .care-mosaicBC { grid-column: 2; grid-row: 2; }
        .careMosaicLayout .care-mosaicBR { grid-column: 3; grid-row: 2; }
        @media (max-width: 900px) {
          .careBentoLayout, .careMosaicLayout { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .careBentoLayout .care-bentoBig,
          .careBentoLayout .care-bentoTop1,
          .careBentoLayout .care-bentoTop2,
          .careBentoLayout .care-bentoWide,
          .careMosaicLayout .care-mosaicTL,
          .careMosaicLayout .care-mosaicTR,
          .careMosaicLayout .care-mosaicBL,
          .careMosaicLayout .care-mosaicBC,
          .careMosaicLayout .care-mosaicBR { grid-column: auto !important; grid-row: auto !important; }
        }
        @media (max-width: 560px) {
          .careBentoLayout, .careMosaicLayout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// MAIN ADMIN BANNERS PAGE
// ============================================================
export default function AdminBanners() {
  const [activeTab,       setActiveTab]       = useState('hero');
  const [allBanners,      setAllBanners]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showForm,        setShowForm]        = useState(false);
  const [editing,         setEditing]         = useState(null);
  const [uploading,       setUploading]       = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingHero,   setUploadingHero]   = useState(false); // ✅ NEW: single hero media
  const [saving,          setSaving]          = useState(false);

  const emptyForm = {
    title: '', subtitle: '', buttonText: 'Shop Now', buttonLink: '/products',
    bgColor: '#ff6b9d', image: null, mobileImage: null,
    panels: PANEL_DEFAULTS,
    isActive: true, order: 0, type: 'hero', emoji: '', price: '', offer: '',
    color: '#ff6b9d', slug: '', gender: 'girl', festivalName: '',
    startDate: '', endDate: '', foodCategory: '', evGender: 'boy',
    newBornGender: 'girl', ageGroup: '',
  };

  const [form, setForm] = useState(emptyForm);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/banners');
      const data = await res.json();
      setAllBanners(data.banners || []);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBanners(); }, []);

  const heroBanners         = allBanners.filter(b => b.type === 'hero' || !b.type);
  const categoryBanners     = allBanners.filter(b => b.type === 'category');
  const festivalBanners     = allBanners.filter(b => b.type === 'festival');
  const budgetBanners       = allBanners.filter(b => b.type === 'budget');
  const sunnyBanners        = allBanners.filter(b => b.type === 'sunny');
  const offerBanners        = allBanners.filter(b => b.type === 'promo');
  const genderBanners       = allBanners.filter(b => b.type === 'gender');
  const babyFoodBanners     = allBanners.filter(b => b.type === 'baby-food');
  const toysBanners         = allBanners.filter(b => b.type === 'toys');
  const evBanners           = allBanners.filter(b => b.type === 'electric-vehicle');
  const personalCareBanners = allBanners.filter(b => b.type === 'personal-care');
  const healthCareBanners   = allBanners.filter(b => b.type === 'health-care');

  const openAdd = (type) => {
    setEditing(null);
    setForm({
      ...emptyForm,
      type,
      panels: PANEL_DEFAULTS,
      buttonLink:
        type === 'festival'          ? '/products'
        : type === 'category'        ? '/products?category=clothing'
        : type === 'budget'          ? '/products?maxPrice=299'
        : type === 'sunny'           ? '/products?category=clothing'
        : type === 'promo'           ? '/products'
        : type === 'gender'          ? '/products?search=girl'
        : type === 'baby-food'       ? '/products?category=food'
        : type === 'toys'            ? '/products?category=toys'
        : type === 'electric-vehicle'? '/products?category=electric-vehicles'
        : '/products',
      offer:    type === 'budget' ? 'Under' : type === 'promo' ? '20%' : '',
      gender:   type === 'gender' ? 'girl' : null,
      evGender: type === 'electric-vehicle' ? 'boy' : '',
      color:    type === 'category' ? '#FF6B35' : '#ff6b9d',
    });
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title:         banner.title         || '',
      subtitle:      banner.subtitle      || '',
      buttonText:    banner.buttonText    || 'Shop Now',
      buttonLink:    banner.buttonLink    || '/products',
      bgColor:       banner.bgColor       || '#ff6b9d',
      image:         banner.image         || null,
      mobileImage:   banner.mobileImage   || null,
      panels:        banner.panels?.length > 0 ? banner.panels : PANEL_DEFAULTS,
      isActive:      banner.isActive,
      order:         banner.order         || 0,
      type:          banner.type          || 'hero',
      emoji:         banner.emoji         || '',
      price:         banner.price         || '',
      offer:         banner.offer         || '',
      color:         banner.color         || '#ff6b9d',
      slug:          banner.slug          || '',
      gender:        banner.gender        || 'girl',
      festivalName:  banner.festivalName  || '',
      startDate:     banner.startDate     ? new Date(banner.startDate).toISOString().slice(0, 16) : '',
      endDate:       banner.endDate       ? new Date(banner.endDate).toISOString().slice(0, 16)   : '',
      foodCategory:  banner.foodCategory  || '',
      evGender:      banner.evGender      || 'boy',
      newBornGender: banner.newBornGender || 'girl',
      ageGroup:      banner.ageGroup      || '',
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/banners');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, image: { url: data.url || data.images?.[0]?.url, publicId: data.publicId || data.images?.[0]?.publicId || '' } }));
      toast.success('✅ Uploaded!');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const handleMobileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMobile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/banners/mobile');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => ({ ...f, mobileImage: { url: data.url || data.images?.[0]?.url, publicId: data.publicId || data.images?.[0]?.publicId || '' } }));
      toast.success('✅ Mobile uploaded!');
    } catch (err) { toast.error(err.message); }
    finally { setUploadingMobile(false); }
  };

  // ✅ NEW — Single hero media upload (image OR video)
  const handleHeroMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/banners/hero');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(f => {
        const panels = [...(f.panels || PANEL_DEFAULTS)];
        // Always update first (and only) panel - mark as big
        panels[0] = {
          ...panels[0],
          isBig:    true,
          url:      data.url || data.images?.[0]?.url || '',
          publicId: data.publicId || data.images?.[0]?.publicId || '',
        };
        return { ...f, panels };
      });
      toast.success('✅ Hero media uploaded!');
    } catch (err) { toast.error(err.message); }
    finally { setUploadingHero(false); }
  };

  const updateHeroPanel = (field, value) => {
    setForm(f => {
      const panels = [...(f.panels || PANEL_DEFAULTS)];
      panels[0] = { ...panels[0], isBig: true, [field]: value };
      return { ...f, panels };
    });
  };

  const removeHeroMedia = () => {
    setForm(f => {
      const panels = [...(f.panels || PANEL_DEFAULTS)];
      panels[0] = { ...panels[0], url: '', publicId: '' };
      return { ...f, panels };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const payload = {
        title:         form.title,
        subtitle:      form.subtitle      || null,
        buttonText:    form.buttonText    || 'Shop Now',
        buttonLink:    form.buttonLink    || '/products',
        bgColor:       form.bgColor       || '#ff6b9d',
        isActive:      form.isActive,
        order:         parseInt(form.order) || 0,
        type:          form.type,
        emoji:         form.emoji         || null,
        price:         form.price         ? parseFloat(form.price) : null,
        offer:         form.offer         || null,
        color:         form.color         || null,
        slug:          form.slug          || null,
        image:         form.image         || null,
        mobileImage:   form.mobileImage   || null,
        gender:        form.gender        || null,
        festivalName:  form.festivalName  || null,
        startDate:     form.startDate     || null,
        endDate:       form.endDate       || null,
        foodCategory:  form.foodCategory  || null,
        evGender:      form.evGender      || null,
        newBornGender: form.newBornGender || null,
        ageGroup:      form.ageGroup      || null,
        panels: form.type === 'hero'
          ? (form.panels || PANEL_DEFAULTS).map(p => ({
              url:      p.url      || '',
              publicId: p.publicId || '',
              label:    p.label    || '',
              sublabel: p.sublabel || '',
              link:     p.link     || '/products',
              bg:       p.bg       || '#FDE8D0',
              isBig:    true,  // ✅ Always mark hero panel as big
            }))
          : [],
      };

      const url    = editing ? `/api/banners/${editing.id}` : '/api/banners';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? '✅ Updated!' : '✅ Created!');
      setShowForm(false); setEditing(null); fetchBanners();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return;
    const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted ✅'); fetchBanners(); }
    else toast.error('Failed');
  };

  const toggleActive = async (banner) => {
    const res = await fetch(`/api/banners/${banner.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !banner.isActive }) });
    if (res.ok) { toast.success(!banner.isActive ? '✅ Active!' : '⭕ Inactive'); fetchBanners(); }
  };

  const inp   = { width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', background: 'white', color: '#2D1A4A', boxSizing: 'border-box' };
  const lbl   = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#7B2FBE', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' };
  const pInp  = { width: '100%', padding: '8px 10px', border: '2px solid #EDD9FF', borderRadius: '8px', fontSize: '12px', fontFamily: 'Nunito, sans-serif', outline: 'none', background: 'white', color: '#2D1A4A', boxSizing: 'border-box', fontWeight: '600' };
  const pLbl  = { display: 'block', fontSize: '10px', fontWeight: '800', color: '#7B2FBE', marginBottom: '4px', textTransform: 'uppercase' };
  const tabSt = (key) => ({ padding: '9px 15px', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', background: activeTab === key ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)' : '#f3f4f6', color: activeTab === key ? 'white' : '#555', boxShadow: activeTab === key ? '0 4px 14px rgba(255,107,53,0.25)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' });

  // ✅ Helper: detect if URL is video
  const isVideoUrl = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
  };

  const BannerCard = ({ banner }) => {
    const heroPanel = banner.panels?.[0];
    const heroMedia = heroPanel?.url;
    const heroIsVideo = isVideoUrl(heroMedia);

    return (
      <div style={{ background: 'white', borderRadius: '16px', border: `2px solid ${banner.isActive ? '#EDD9FF' : '#f0f0f0'}`, overflow: 'hidden', boxShadow: '0 4px 16px rgba(123,47,190,0.08)', opacity: banner.isActive ? 1 : 0.65 }}>
        <div style={{ height: '150px', background: banner.bgColor || banner.color || 'linear-gradient(135deg,#FF6B35,#7B2FBE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative', overflow: 'hidden' }}>
          {/* Show hero media preview */}
          {banner.type === 'hero' && heroMedia ? (
            heroIsVideo ? (
              <video src={heroMedia} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={heroMedia} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )
          ) : banner.image?.url ? (
            <img src={banner.image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>{banner.emoji || '🖼️'}</span>
          )}

          {banner.type === 'hero' && heroMedia && (
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: '800', background: heroIsVideo ? 'rgba(255,71,87,0.95)' : 'rgba(244,123,32,0.9)', color: 'white' }}>
              {heroIsVideo ? '🎥 VIDEO' : '🖼️ IMAGE'}
            </div>
          )}
          <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: '800', background: banner.isActive ? 'rgba(5,150,105,0.9)' : 'rgba(100,100,100,0.7)', color: 'white' }}>{banner.isActive ? '● Active' : '○ Inactive'}</div>
          <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: '800', background: 'rgba(0,0,0,0.55)', color: 'white', textTransform: 'capitalize' }}>{banner.type}</div>
        </div>
        <div style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '0.90rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px' }}>{banner.title}</h3>
          {banner.subtitle && <p style={{ fontSize: '0.78rem', color: '#9585B0', margin: '0 0 6px' }}>{banner.subtitle}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
            {banner.buttonLink && <span style={{ fontSize: '10px', background: '#F3E8FF', color: '#7B2FBE', padding: '2px 7px', borderRadius: '5px', fontWeight: '600' }}>🔗 {banner.buttonLink}</span>}
            {banner.price && <span style={{ fontSize: '10px', background: '#FFF3EC', color: '#FF6B35', padding: '2px 7px', borderRadius: '5px', fontWeight: '700' }}>₹{banner.price}</span>}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => openEdit(banner)} style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
            <button onClick={() => toggleActive(banner)} style={{ padding: '8px 10px', background: banner.isActive ? '#d1fae5' : '#f3f4f6', color: banner.isActive ? '#059669' : '#666', border: `1.5px solid ${banner.isActive ? '#6ee7b7' : '#ddd'}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>{banner.isActive ? '✅' : '⭕'}</button>
            <button onClick={() => handleDelete(banner.id)} style={{ padding: '8px 10px', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</button>
          </div>
        </div>
      </div>
    );
  };

  const ImgUpload = ({ label, value, onChange, uploading: upl, onRemove }) => (
    <div>
      <label style={lbl}>{label}</label>
      <label style={{ cursor: 'pointer', display: 'block' }}>
        <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} disabled={upl} />
        <div style={{ width: '100%', height: '130px', border: `2px dashed ${form.color || '#FF6B35'}`, borderRadius: '12px', background: '#fff8fb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
          {upl
            ? <p style={{ color: '#FF6B35', fontWeight: '700', fontSize: '13px' }}>⏳ Uploading...</p>
            : value?.url
              ? <img src={value.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }} />
              : <div style={{ textAlign: 'center' }}><div style={{ fontSize: '28px' }}>🖼️</div><p style={{ fontSize: '12px', fontWeight: '700', color: form.color || '#FF6B35', margin: '6px 0 0' }}>Click to upload</p></div>
          }
        </div>
      </label>
      {value?.url && (
        <button type="button" onClick={onRemove} style={{ marginTop: '6px', width: '100%', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', padding: '7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Remove</button>
      )}
    </div>
  );

  const formTitle = () => {
    const action = editing ? '✏️ Edit' : '➕ Add';
    const map = { hero: 'Hero Banner', category: 'Category Card', festival: 'Festival Banner', budget: 'Budget Card', sunny: 'Sunny Card', promo: 'Promo Offer', gender: 'Girl/Boy Card', 'baby-food': 'Baby Food Card', toys: 'Toys Card', 'electric-vehicle': 'Electric Vehicle' };
    return `${action} ${map[form.type] || 'Banner'}`;
  };

  const TABS = [
    { key: 'hero',             label: '🖼️ Hero',           list: heroBanners },
    { key: 'category',         label: '📁 Categories',      list: categoryBanners },
    { key: 'festival',         label: '🎪 Festival',        list: festivalBanners },
    { key: 'budget',           label: '🏪 Budget',          list: budgetBanners },
    { key: 'sunny',            label: '☀️ Sunny',           list: sunnyBanners },
    { key: 'promo',            label: '🏷️ Promo',           list: offerBanners },
    { key: 'gender',           label: '👧👦 Gender',         list: genderBanners },
    { key: 'baby-food',        label: '🍼 Baby Food',       list: babyFoodBanners },
    { key: 'toys',             label: '🧸 Toys',            list: toysBanners },
    { key: 'electric-vehicle', label: '🚗 Electric',        list: evBanners },
    { key: 'personal-care',    label: '🧴 Personal Care',   list: personalCareBanners },
    { key: 'health-care',      label: '🏥 Health Care',     list: healthCareBanners },
    { key: 'brands',           label: '🏷️ Brands',          list: [] },
    { key: 'section-settings', label: '🎨 Section Names',   list: [] },
  ];
  const currentTab = TABS.find(t => t.key === activeTab);

  const tabInfo = {
    hero:               '🎥 Hero banners — upload ONE image OR video (full-screen auto-play)',
    category:           '📁 Category cards — upload image, name, color & link',
    festival:           '🎪 Festival banners with schedule + text overlay',
    budget:             '🏪 Budget price circles',
    sunny:              '☀️ Category cards section',
    promo:              '🏷️ Promo offer cards',
    gender:             '👧👦 Girl & Boy cards',
    'baby-food':        '🍼 Baby food cards',
    toys:               '🧸 Toys & Games',
    'electric-vehicle': '🚗 Electric vehicles',
  };

  const isCareTab    = activeTab === 'personal-care' || activeTab === 'health-care';
  const isSpecialTab = ['brands', 'section-settings', 'personal-care', 'health-care'].includes(activeTab);

  // ✅ Get current hero panel for preview
  const heroPanel = form.panels?.[0] || PANEL_DEFAULTS[0];
  const heroIsVideo = isVideoUrl(heroPanel.url);

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', padding: '4px' }}>

      <div className="adminMainHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>Banners & Sections 🖼️</h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.85rem' }}>Manage home page content</p>
        </div>
      </div>

      <div className="adminTabsContainer" style={{ display: 'flex', gap: '7px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab.key} style={tabSt(tab.key)} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
            {tab.key !== 'brands' && tab.key !== 'section-settings' && ` (${tab.list.length})`}
          </button>
        ))}
      </div>

      {/* SPECIAL TABS */}
      {activeTab === 'brands'           && <BrandsTab />}
      {activeTab === 'section-settings' && <SectionSettings />}
      {activeTab === 'personal-care'    && <CareGridManager type="personal-care" title="Personal Care" accentColor="#7B2FBE" layout="bento" />}
      {activeTab === 'health-care'      && <CareGridManager type="health-care"   title="Health Care"   accentColor="#10B981" layout="mosaic" />}

      {/* NORMAL TABS */}
      {!isSpecialTab && currentTab && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', background: '#FBF7FF', borderRadius: '12px', border: '1.5px solid #EDD9FF' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B4E8A', fontWeight: '600' }}>{tabInfo[activeTab] || ''}</p>
            <button onClick={() => openAdd(activeTab)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>+ Add</button>
          </div>

          {loading
            ? <div style={{ textAlign: 'center', padding: '40px', color: '#9585B0' }}>⏳ Loading...</div>
            : currentTab.list.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '2px dashed #EDD9FF', color: '#9585B0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{currentTab.label.split(' ')[0]}</div>
                  <p style={{ fontWeight: '700', fontSize: '1rem', margin: '0 0 16px' }}>No items yet</p>
                  <button onClick={() => openAdd(activeTab)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add First</button>
                </div>
              )
              : (
                <div className="adminBannersGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {currentTab.list.map(banner => <BannerCard key={banner.id} banner={banner} />)}
                </div>
              )
          }
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && !isCareTab && (
        <div className="adminModal"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.60)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null); } }}>

          <div className="adminModalCard"
            style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}
            onClick={e => e.stopPropagation()}>

            <div className="adminModalHeader"
              style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10, padding: '16px 22px 12px', borderBottom: '1.5px solid #EDD9FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px 20px 0 0' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#2D1A4A' }}>{formTitle()}</h2>
                <p style={{ fontSize: '11px', color: '#9585B0', margin: '2px 0 0', fontWeight: '600' }}>{editing ? 'Update banner' : 'Add new banner'}</p>
              </div>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', color: '#2D1A4A', flexShrink: 0 }}>✕</button>
            </div>

            <form onSubmit={handleSave} className="adminModalBody" style={{ padding: '18px 22px 22px' }}>
              <div className="adminFormGrid" style={{ display: 'grid', gap: '20px', alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>

                  <div>
                    <label style={lbl}>
                      {form.type === 'category' ? 'Category Name *'
                        : form.type === 'budget' ? 'Card Name *'
                        : form.type === 'sunny' ? 'Card Label *'
                        : form.type === 'promo' ? 'Offer Title *'
                        : form.type === 'festival' ? 'Festival Title *'
                        : form.type === 'baby-food' ? 'Food Name *'
                        : form.type === 'toys' ? 'Toy Name *'
                        : form.type === 'electric-vehicle' ? 'Vehicle Name *'
                        : 'Banner Title *'}
                    </label>
                    <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enter title..." required style={inp} />
                  </div>

                  {!['budget', 'sunny', 'category'].includes(form.type) && (
                    <div>
                      <label style={lbl}>Subtitle / Description</label>
                      <input type="text" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Optional description" style={inp} />
                    </div>
                  )}

                  {form.type === 'category' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={lbl}>Button Link *</label>
                        <input type="text" value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="/products?category=clothing" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Card Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="color" value={form.color || '#FF6B35'} onChange={e => set('color', e.target.value)} style={{ width: '44px', height: '40px', border: '2px solid #EDD9FF', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                          <input type="text" value={form.color || '#FF6B35'} onChange={e => set('color', e.target.value)} style={{ ...inp, flex: 1 }} />
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Order (0 = first)</label>
                        <input type="number" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)} min="0" style={inp} />
                      </div>
                    </div>
                  )}

                  {form.type === 'hero' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={lbl}>Button Text</label><input type="text" value={form.buttonText} onChange={e => set('buttonText', e.target.value)} placeholder="Shop Now" style={inp} /></div>
                      <div><label style={lbl}>Button Link</label><input type="text" value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="/products" style={inp} /></div>
                      <div>
                        <label style={lbl}>BG Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="color" value={form.bgColor} onChange={e => set('bgColor', e.target.value)} style={{ width: '44px', height: '40px', border: '2px solid #EDD9FF', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                          <input type="text" value={form.bgColor} onChange={e => set('bgColor', e.target.value)} style={{ ...inp, flex: 1 }} />
                        </div>
                      </div>
                      <div><label style={lbl}>Order</label><input type="number" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)} min="0" style={inp} /></div>
                    </div>
                  )}

                  {form.type === 'festival' && (
                    <>
                      <div><label style={lbl}>Festival Name</label><input type="text" value={form.festivalName} onChange={e => set('festivalName', e.target.value)} placeholder="e.g. Diwali" style={inp} /></div>
                      <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div><label style={lbl}>📅 Start Date</label><input type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inp} /></div>
                        <div><label style={lbl}>📅 End Date</label><input type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={inp} /></div>
                        <div><label style={lbl}>Button Text</label><input type="text" value={form.buttonText} onChange={e => set('buttonText', e.target.value)} placeholder="Shop Now" style={inp} /></div>
                        <div><label style={lbl}>Button Link</label><input type="text" value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="/products" style={inp} /></div>
                      </div>
                      <div><label style={lbl}>Emoji</label><input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🪔" style={inp} /></div>
                    </>
                  )}

                  {form.type === 'budget' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={lbl}>Price (₹)</label><input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="499" min="0" style={inp} /></div>
                      <div><label style={lbl}>Offer Label</label><input type="text" value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="Under" style={inp} /></div>
                      <div><label style={lbl}>Emoji</label><input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🎀" style={inp} /></div>
                      <div><label style={lbl}>Color</label><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: '44px', height: '40px', border: '2px solid #EDD9FF', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} /><input type="text" value={form.color} onChange={e => set('color', e.target.value)} style={{ ...inp, flex: 1 }} /></div></div>
                    </div>
                  )}

                  {form.type === 'sunny' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={lbl}>Category Slug</label><input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="clothing" style={inp} /></div>
                      <div><label style={lbl}>Emoji</label><input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="👕" style={inp} /></div>
                    </div>
                  )}

                  {form.type === 'promo' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={lbl}>Offer Badge</label><input type="text" value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="20%" style={inp} /></div>
                      <div><label style={lbl}>Color</label><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><input type="color" value={form.color || '#ff6b9d'} onChange={e => set('color', e.target.value)} style={{ width: '44px', height: '40px', border: '2px solid #EDD9FF', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} /><input type="text" value={form.color} onChange={e => set('color', e.target.value)} style={{ ...inp, flex: 1 }} /></div></div>
                      <div><label style={lbl}>Emoji</label><input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🎁" style={inp} /></div>
                      <div><label style={lbl}>Button Link</label><input type="text" value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="/products" style={inp} /></div>
                    </div>
                  )}

                  {form.type === 'gender' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={lbl}>For</label><select value={form.gender || 'girl'} onChange={e => set('gender', e.target.value)} style={{ ...inp, cursor: 'pointer' }}><option value="girl">👧 Girl</option><option value="boy">👦 Boy</option></select></div>
                      <div><label style={lbl}>Button Link</label><input type="text" value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="/products" style={inp} /></div>
                    </div>
                  )}

                  {form.type === 'baby-food' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={lbl}>Emoji</label><input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🥣" style={inp} /></div>
                      <div><label style={lbl}>Button Link</label><input type="text" value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="/products" style={inp} /></div>
                    </div>
                  )}

                  {form.type === 'toys' && (
                    <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><label style={lbl}>Emoji</label><input type="text" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🧸" style={inp} /></div>
                      <div><label style={lbl}>Button Link</label><input type="text" value={form.buttonLink} onChange={e => set('buttonLink', e.target.value)} placeholder="/products" style={inp} /></div>
                    </div>
                  )}

                  {form.type === 'electric-vehicle' && (
                    <>
                      <div><label style={lbl}>For Gender *</label><select value={form.evGender || 'boy'} onChange={e => set('evGender', e.target.value)} style={{ ...inp, cursor: 'pointer' }}><option value="boy">👦 Boys</option><option value="girl">👧 Girls</option></select></div>
                      <div className="adminFormCols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div><label style={lbl}>Price (₹)</label><input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="4999" min="0" style={inp} /></div>
                        <div><label style={lbl}>Age Group</label><input type="text" value={form.ageGroup} onChange={e => set('ageGroup', e.target.value)} placeholder="2-5 Years" style={inp} /></div>
                      </div>
                    </>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#2D1A4A', padding: '10px 14px', background: '#F3E8FF', borderRadius: '10px' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#FF6B35', cursor: 'pointer' }} />
                    ✅ Active — show on home page
                  </label>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>

                  {form.type !== 'hero' && (
                    <ImgUpload
                      label={
                        form.type === 'category' ? '📁 Category Image *'
                        : form.type === 'festival' ? '🖥️ Desktop Image'
                        : '🖼️ Front Image (Main)'
                      }
                      value={form.image}
                      onChange={handleImageUpload}
                      uploading={uploading}
                      onRemove={() => setForm(f => ({ ...f, image: null }))}
                    />
                  )}

                  {['sunny', 'baby-food', 'toys', 'electric-vehicle'].includes(form.type) && (
                    <>
                      <div>
                        <ImgUpload
                          label="🔄 Back Image (3D Flip on Hover)"
                          value={form.mobileImage}
                          onChange={handleMobileImageUpload}
                          uploading={uploadingMobile}
                          onRemove={() => setForm(f => ({ ...f, mobileImage: null }))}
                        />
                        <p style={{ fontSize: '11px', color: '#7B2FBE', marginTop: '6px', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
                          💡 This image shows on hover (3D flip)
                        </p>
                      </div>

                      {(form.image?.url || form.mobileImage?.url) && (
                        <div style={{ border: '2px solid #E03F4F', borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(135deg, #FFF5F5, #FFE8EB)', padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', fontFamily: 'Nunito, sans-serif' }}>🎲 Live 3D Flip Preview</h4>
                              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9585B0', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>Hover to flip</p>
                            </div>
                            <span style={{ padding: '4px 10px', background: '#E03F4F', color: 'white', borderRadius: '999px', fontSize: '10px', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>HOVER ME</span>
                          </div>
                          <div className="adminFlipScene">
                            <div className="adminFlipCard">
                              <div className="adminFlipFace adminFlipFront">
                                {form.image?.url
                                  ? <img src={form.image.url} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'linear-gradient(135deg, #F3E8FF, #FFE8EB)', color: '#9585B0' }}><span style={{ fontSize: '2.5rem' }}>🖼️</span><p style={{ fontSize: '12px', fontWeight: '700', margin: '8px 0 0', fontFamily: 'Nunito, sans-serif' }}>Upload Front</p></div>
                                }
                                <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', background: 'rgba(0,0,0,0.7)', color: 'white', borderRadius: '999px', fontSize: '10px', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>FRONT</div>
                              </div>
                              <div className="adminFlipFace adminFlipBack">
                                {form.mobileImage?.url
                                  ? <img src={form.mobileImage.url} alt="Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'linear-gradient(135deg, #FFE8B0, #FFD78A)', color: '#9585B0' }}><span style={{ fontSize: '2.5rem' }}>🔄</span><p style={{ fontSize: '12px', fontWeight: '700', margin: '8px 0 0', fontFamily: 'Nunito, sans-serif' }}>Upload Back</p></div>
                                }
                                <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', background: 'rgba(224,63,79,0.9)', color: 'white', borderRadius: '999px', fontSize: '10px', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>BACK</div>
                              </div>
                            </div>
                          </div>
                          <style>{`
                            .adminFlipScene { perspective: 1200px; width: 100%; height: 280px; cursor: pointer; margin-top: 4px; }
                            .adminFlipCard { position: relative; width: 100%; height: 100%; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; border-radius: 16px; }
                            .adminFlipScene:hover .adminFlipCard { transform: rotateY(180deg); }
                            .adminFlipFace { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 16px; overflow: hidden; background: white; border: 3px solid #E03F4F; box-sizing: border-box; box-shadow: 0 6px 20px rgba(224,63,79,0.20); }
                            .adminFlipFront { transform: rotateY(0deg); }
                            .adminFlipBack  { transform: rotateY(180deg); }
                          `}</style>
                        </div>
                      )}
                    </>
                  )}

                  {/* ✅ NEW HERO MEDIA UPLOAD (Image or Video) */}
                  {form.type === 'hero' && (
                    <div style={{ border: '2px solid #EDD9FF', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#FFF3EC,#F3E8FF)', borderBottom: '1.5px solid #EDD9FF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>🎥</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A' }}>Hero Media (Image or Video)</h4>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9585B0', fontWeight: '600' }}>
                            📸 Image OR 🎥 Video — Auto-plays full-screen on hero
                          </p>
                        </div>
                      </div>

                      <div style={{ padding: '14px' }}>
                        <div style={{ background: heroPanel.bg || '#FFF3E8', borderRadius: '14px', padding: '14px', border: '2px solid rgba(255,255,255,0.9)' }}>

                          {/* UPLOAD AREA */}
                          <label style={{ cursor: 'pointer', display: 'block', marginBottom: '12px' }}>
                            <input
                              type="file"
                              accept="image/*,video/mp4,video/webm,video/quicktime"
                              onChange={handleHeroMediaUpload}
                              style={{ display: 'none' }}
                              disabled={uploadingHero}
                            />
                            <div style={{
                              width: '100%',
                              height: '240px',
                              border: '2px dashed #C8B4DC',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.85)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              position: 'relative',
                            }}>
                              {uploadingHero ? (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                                  <p style={{ color: '#7B2FBE', fontWeight: '700', fontSize: '13px', margin: 0, fontFamily: 'Nunito, sans-serif' }}>Uploading...</p>
                                </div>
                              ) : heroPanel.url ? (
                                heroIsVideo ? (
                                  <>
                                    <video
                                      src={heroPanel.url}
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <span style={{
                                      position: 'absolute', top: '10px', right: '10px',
                                      background: 'rgba(0,0,0,0.65)', color: 'white',
                                      padding: '4px 10px', borderRadius: '999px',
                                      fontSize: '10px', fontWeight: '800',
                                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                                      fontFamily: 'Nunito, sans-serif',
                                    }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4757' }} />
                                      VIDEO
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <img src={heroPanel.url} alt={heroPanel.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <span style={{
                                      position: 'absolute', top: '10px', right: '10px',
                                      background: 'rgba(0,0,0,0.65)', color: 'white',
                                      padding: '4px 10px', borderRadius: '999px',
                                      fontSize: '10px', fontWeight: '800',
                                      fontFamily: 'Nunito, sans-serif',
                                    }}>
                                      🖼️ IMAGE
                                    </span>
                                  </>
                                )
                              ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎥</div>
                                  <p style={{ color: '#7B2FBE', fontWeight: '800', fontSize: '15px', margin: '0 0 6px', fontFamily: 'Nunito, sans-serif' }}>
                                    Click to Upload Media
                                  </p>
                                  <p style={{ color: '#9585B0', fontWeight: '600', fontSize: '11px', margin: 0, fontFamily: 'Nunito, sans-serif', lineHeight: '1.5' }}>
                                    📸 Image (JPG/PNG/WebP) up to 10 MB<br />
                                    🎥 Video (MP4/WebM) up to 50 MB
                                  </p>
                                </div>
                              )}
                            </div>
                          </label>

                          {heroPanel.url && (
                            <button
                              type="button"
                              onClick={removeHeroMedia}
                              style={{ width: '100%', padding: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px' }}
                            >
                              🗑️ Remove Media
                            </button>
                          )}

                          {/* META FIELDS */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={pLbl}>Badge Label</label>
                              <input
                                type="text"
                                value={heroPanel.label || ''}
                                onChange={e => updateHeroPanel('label', e.target.value)}
                                placeholder="🔥 Trending"
                                style={pInp}
                              />
                            </div>
                            <div>
                              <label style={pLbl}>Sub Label</label>
                              <input
                                type="text"
                                value={heroPanel.sublabel || ''}
                                onChange={e => updateHeroPanel('sublabel', e.target.value)}
                                placeholder="2.4k sold this week"
                                style={pInp}
                              />
                            </div>
                            <div>
                              <label style={pLbl}>Click Link</label>
                              <input
                                type="text"
                                value={heroPanel.link || ''}
                                onChange={e => updateHeroPanel('link', e.target.value)}
                                placeholder="/products"
                                style={pInp}
                              />
                            </div>
                            <div>
                              <label style={pLbl}>BG Color (fallback)</label>
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={heroPanel.bg || '#FDE8D0'}
                                  onChange={e => updateHeroPanel('bg', e.target.value)}
                                  style={{ width: '36px', height: '34px', border: '2px solid #EDD9FF', borderRadius: '6px', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                                />
                                <input
                                  type="text"
                                  value={heroPanel.bg || '#FDE8D0'}
                                  onChange={e => updateHeroPanel('bg', e.target.value)}
                                  style={{ ...pInp, flex: 1 }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Info note */}
                          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                            <p style={{ margin: 0, fontSize: '11px', color: '#0369A1', fontWeight: '600', fontFamily: 'Nunito, sans-serif', lineHeight: '1.5' }}>
                              💡 <strong>Tip:</strong> Videos auto-play muted on the hero. Users can unmute with the 🔊 button. Keep videos under 30 seconds for best experience.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="adminFormFooter" style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1.5px solid #EDD9FF' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  style={{ padding: '12px 22px', border: '2px solid #EDD9FF', borderRadius: '10px', background: 'white', color: '#6B4E8A', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading || uploadingMobile || uploadingHero}
                  style={{ flex: 1, padding: '12px 22px', background: saving ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 14px rgba(255,107,53,0.30)' }}>
                  {saving ? '⏳ Saving...' : editing ? '💾 Update Banner' : '✨ Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .adminFormGrid { grid-template-columns: 1fr 340px; gap: 24px; }
        @media (max-width: 1024px) { .adminFormGrid { grid-template-columns: 1fr 300px; } }
        @media (max-width: 820px)  { .adminFormGrid { grid-template-columns: 1fr !important; gap: 18px !important; } }
        @media (max-width: 600px)  { .adminFormCols { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px)  { .adminBannersGrid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important; gap: 12px !important; } }
        @media (max-width: 480px) {
          .adminBannersGrid { grid-template-columns: 1fr !important; }
          .adminMainHeader h1 { font-size: 1.3rem !important; }
          .adminTabsContainer button { padding: 8px 12px !important; font-size: 11.5px !important; }
          .adminFormFooter { flex-direction: column-reverse !important; gap: 8px !important; }
          .adminFormFooter button { width: 100% !important; }
          .adminModal { padding: 8px !important; }
          .adminModalCard { border-radius: 14px !important; }
          .adminModalHeader { padding: 12px 14px 10px !important; }
          .adminModalBody { padding: 14px 14px 18px !important; }
        }
        @media (max-width: 380px) { .adminTabsContainer button { padding: 7px 10px !important; font-size: 11px !important; } }
        input, select { min-height: 44px; }
      `}</style>
    </div>
  );
}