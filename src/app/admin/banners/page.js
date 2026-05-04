'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from '../categories/page.module.css';
import banStyles from './page.module.css';

export default function AdminBanners() {
  const [activeTab,     setActiveTab]     = useState('hero');
  const [allBanners,    setAllBanners]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [uploadingGrid, setUploadingGrid] = useState(false);
  const [saving,        setSaving]        = useState(false);

  const emptyForm = {
    title:      '',
    subtitle:   '',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    bgColor:    '#ff6b9d',
    image:      null,
    gridImages: [],
    isActive:   true,
    order:      0,
    type:       'hero',
    emoji:      '',
    price:      '',
    offer:      '',
    color:      '#ff6b9d',
    slug:       '',
    gender:     'girl',
  };

  const [form, setForm] = useState(emptyForm);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/banners');
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

  const heroBanners         = allBanners.filter(b => b.type === 'hero' || !b.type);
  const budgetBanners       = allBanners.filter(b => b.type === 'budget');
  const sunnyBanners        = allBanners.filter(b => b.type === 'sunny');
  const promoBanners        = allBanners.filter(b => b.type === 'promo');
  const genderBanners       = allBanners.filter(b => b.type === 'gender');
  const maternityBanners    = allBanners.filter(b => b.type === 'maternity');
  const personalCareBanners = allBanners.filter(b => b.type === 'personal-care');
  const healthCareBanners   = allBanners.filter(b => b.type === 'health-care');

  const openAdd = (type) => {
    setEditing(null);
    setForm({
      ...emptyForm,
      type,
      buttonLink:
        type === 'budget'         ? '/products?maxPrice=299'
        : type === 'sunny'        ? '/products?category=tops'
        : type === 'gender'       ? '/products?search=girl'
        : type === 'maternity'    ? '/products?category=maternity'
        : type === 'personal-care'? '/products?category=personal-care'
        : type === 'health-care'  ? '/products?category=health-care'
        : '/products',
      offer:  type === 'budget' ? 'Under' : type === 'promo' ? '20%' : '',
      gender: type === 'gender' ? 'girl' : null,
    });
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title:      banner.title      || '',
      subtitle:   banner.subtitle   || '',
      buttonText: banner.buttonText || 'Shop Now',
      buttonLink: banner.buttonLink || '/products',
      bgColor:    banner.bgColor    || '#ff6b9d',
      image:      banner.image      || null,
      gridImages: banner.gridImages || [],
      isActive:   banner.isActive,
      order:      banner.order || 0,
      type:       banner.type  || 'hero',
      emoji:      banner.emoji || '',
      price:      banner.price || '',
      offer:      banner.offer || '',
      color:      banner.color || '#ff6b9d',
      slug:       banner.slug  || '',
      gender:     banner.gender || 'girl',
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

  const handleGridImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingGrid(true);
    try {
      const fd = new FormData();
      for (const file of files) fd.append('file', file);
      fd.append('folder', 'firstcry/banners/grid');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const newImages = data.images || [{ url: data.url, publicId: data.publicId }];
      setForm(f => ({ ...f, gridImages: [...(f.gridImages || []), ...newImages] }));
      toast.success(`✅ ${newImages.length} grid image(s) uploaded!`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingGrid(false);
    }
  };

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
        title:      form.title,
        subtitle:   form.subtitle   || null,
        buttonText: form.buttonText || 'Shop Now',
        buttonLink:
          form.type === 'budget' ? `/products?maxPrice=${form.price}`
          : form.type === 'sunny' ? `/products?category=${form.slug}`
          : form.buttonLink || '/products',
        bgColor:    form.bgColor  || '#ff6b9d',
        isActive:   form.isActive,
        order:      parseInt(form.order) || 0,
        type:       form.type,
        emoji:      form.emoji  || null,
        price:      form.price  ? parseFloat(form.price) : null,
        offer:      form.offer  || null,
        color:      form.color  || null,
        slug:       form.slug   || null,
        image:      form.image  || null,
        gender:     form.gender || null,
        gridImages: form.gridImages || [],
      };

      const url    = editing ? `/api/banners/${editing.id}` : '/api/banners';
      const method = editing ? 'PUT' : 'POST';

      const res  = await fetch(url, {
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
    const action  = editing ? '✏️ Edit' : '➕ Add';
    const typeMap = {
      hero:            'Hero Banner',
      budget:          'Budget Card',
      sunny:           'Sunny Card',
      promo:           'Promo Offer',
      gender:          'Girl/Boy Card',
      maternity:       'Maternity Banner',
      'personal-care': 'Personal Care Banner',
      'health-care':   'Health Care Banner',
    };
    return `${action} ${typeMap[form.type] || 'Banner'}`;
  };

  // ✅ Grid image input block
  const GridImageInputs = ({ img, i }) => (
    <div style={{
      position: 'relative', borderRadius: '10px',
      overflow: 'hidden', background: '#f8f8f8',
      border: '1px solid #eee',
    }}>
      {/* Image preview */}
      <div style={{ height: '100px', overflow: 'hidden' }}>
        {img.url ? (
          <img src={img.url} alt={`Grid ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🖼️</div>
        )}
      </div>

      {/* ✅ Fields below image */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Title */}
        <input
          type="text"
          placeholder="Title..."
          value={img.title || ''}
          onChange={e => {
            const updated = [...form.gridImages];
            updated[i] = { ...updated[i], title: e.target.value };
            setForm(f => ({ ...f, gridImages: updated }));
          }}
          style={{
            width: '100%', padding: '4px 6px',
            border: '1px solid #ddd', borderRadius: '6px',
            fontSize: '11px', fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* ✅ Brand Name */}
        <input
          type="text"
          placeholder="Brand name..."
          value={img.brand || ''}
          onChange={e => {
            const updated = [...form.gridImages];
            updated[i] = { ...updated[i], brand: e.target.value };
            setForm(f => ({ ...f, gridImages: updated }));
          }}
          style={{
            width: '100%', padding: '4px 6px',
            border: '1px solid #DFC5F8', borderRadius: '6px',
            fontSize: '11px', fontFamily: 'inherit', outline: 'none',
            color: '#7B2FBE', boxSizing: 'border-box',
          }}
        />

        {/* ✅ Price */}
        <input
          type="number"
          placeholder="Price ₹"
          value={img.price || ''}
          onChange={e => {
            const updated = [...form.gridImages];
            updated[i] = { ...updated[i], price: e.target.value };
            setForm(f => ({ ...f, gridImages: updated }));
          }}
          style={{
            width: '100%', padding: '4px 6px',
            border: '1px solid #FFD4B8', borderRadius: '6px',
            fontSize: '11px', fontFamily: 'inherit', outline: 'none',
            color: '#FF6B35', boxSizing: 'border-box',
          }}
        />

        {/* ✅ Link */}
        <input
          type="text"
          placeholder="Link (e.g. /products/id)"
          value={img.link || ''}
          onChange={e => {
            const updated = [...form.gridImages];
            updated[i] = { ...updated[i], link: e.target.value };
            setForm(f => ({ ...f, gridImages: updated }));
          }}
          style={{
            width: '100%', padding: '4px 6px',
            border: '1px solid #BBF7D0', borderRadius: '6px',
            fontSize: '11px', fontFamily: 'inherit', outline: 'none',
            color: '#166534', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => setForm(f => ({
          ...f,
          gridImages: f.gridImages.filter((_, idx) => idx !== i),
        }))}
        style={{
          position: 'absolute', top: '4px', right: '4px',
          background: 'rgba(220,38,38,0.9)', color: 'white',
          border: 'none', borderRadius: '50%',
          width: '20px', height: '20px',
          fontSize: '11px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800',
        }}
      >
        ✕
      </button>
    </div>
  );

  // ✅ Image Upload Section
  const ImageUploadSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Main image */}
      <div>
        <label style={{
          fontSize: '0.85rem', fontWeight: '600',
          color: '#444', display: 'block', marginBottom: '6px',
        }}>
          {form.type === 'sunny'    ? '🖼️ Product Image'
           : form.type === 'promo'  ? '🖼️ Offer Image'
           : form.type === 'gender' ? '🖼️ Girl/Boy Image'
           : ['maternity','personal-care','health-care'].includes(form.type)
             ? '🖼️ Main Banner Image'
             : '🖼️ Banner Image'}
        </label>

        <label style={{ cursor: 'pointer', display: 'block' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          <div style={{
            width: '100%', height: '140px',
            border: `2px dashed ${form.color || '#ff6b9d'}`,
            borderRadius: '12px', background: '#fff8fb',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}>
            {uploading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px' }}>⏳</div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#ff6b9d' }}>Uploading...</p>
              </div>
            ) : form.image?.url ? (
              <>
                <img src={form.image.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <p style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>📷 Click to Change</p>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🖼️</div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#ff6b9d', margin: 0 }}>Click to upload</p>
                <p style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                  {['maternity','personal-care','health-care'].includes(form.type)
                    ? '1920x600px recommended'
                    : form.type === 'hero' ? '1920x600px' : '600x400px'}
                </p>
              </div>
            )}
          </div>
        </label>

        {form.image?.url ? (
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '10px', color: '#10b981', textAlign: 'center', fontWeight: '600', margin: 0 }}>✅ Image uploaded</p>
            <button
              type="button"
              onClick={handleRemoveImage}
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', padding: '5px 0', fontSize: '11px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
            >
              🗑️ Remove Image
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '10px', color: '#999', textAlign: 'center', marginTop: '4px' }}>No image uploaded</p>
        )}
      </div>

      {/* ✅ Grid Images — for maternity/personal-care/health-care */}
      {['maternity', 'personal-care', 'health-care'].includes(form.type) && (
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#444', display: 'block', marginBottom: '4px' }}>
            📷 Grid Images
          </label>

          {/* ✅ Info per type */}
          <div style={{
            background: form.type === 'health-care' ? '#f0fdf4' : form.type === 'personal-care' ? '#f0f9ff' : '#fdf4ff',
            border: `1px solid ${form.type === 'health-care' ? '#bbf7d0' : form.type === 'personal-care' ? '#7dd3fc' : '#e9d5ff'}`,
            borderRadius: '8px', padding: '8px 10px',
            fontSize: '11px',
            color: form.type === 'health-care' ? '#166534' : form.type === 'personal-care' ? '#0c4a6e' : '#6b21a8',
            marginBottom: '8px',
          }}>
            {form.type === 'maternity' && '🤰 Upload up to 6 grid images. Each needs Title + Price.'}
            {form.type === 'personal-care' && '🧴 Upload product images. Add Brand + Title + Price + Link for each.'}
            {form.type === 'health-care' && '🏥 Upload exactly 2 images:\n• Image 1 = 👶 Child Health\n• Image 2 = 👩 Women Health'}
          </div>

          <label style={{ cursor: 'pointer', display: 'block' }}>
            <input
              type="file"
              accept="image/*"
              multiple={form.type !== 'health-care'}
              onChange={handleGridImageUpload}
              style={{ display: 'none' }}
              disabled={uploadingGrid}
            />
            <div style={{
              width: '100%', height: '64px',
              border: '2px dashed #7B2FBE',
              borderRadius: '12px', background: '#F3E8FF',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: uploadingGrid ? 'not-allowed' : 'pointer',
            }}>
              {uploadingGrid ? (
                <p style={{ fontSize: '12px', color: '#7B2FBE', fontWeight: '700', margin: 0 }}>⏳ Uploading...</p>
              ) : (
                <>
                  <div style={{ fontSize: '18px' }}>📷</div>
                  <p style={{ fontSize: '11px', color: '#7B2FBE', fontWeight: '700', margin: '2px 0 0' }}>
                    {form.type === 'health-care' ? 'Upload 2 images (Child + Women)' : 'Upload Grid Images'}
                  </p>
                </>
              )}
            </div>
          </label>

          {form.gridImages?.length > 0 && (
            <>
              <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '6px',
  marginTop: '10px',
  maxHeight: '300px',
  overflowY: 'auto',
  padding: '4px',
}}>
                {form.gridImages.map((img, i) => (
                  <GridImageInputs key={i} img={img} i={i} />
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: '600' }}>
                ✅ {form.gridImages.length} grid image(s) ready
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );

  // ✅ Generic banner card renderer
  const renderGenericCard = (banner) => (
    <div key={banner.id} style={{
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      background: 'white',
      opacity: banner.isActive ? 1 : 0.5,
      position: 'relative',
    }}>
      <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
        {banner.image?.url ? (
          <img src={banner.image.url} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
            {banner.emoji || '🖼️'}
          </div>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 4px' }}>{banner.title}</h3>
        {banner.subtitle && <p style={{ fontSize: '0.82rem', color: '#666', margin: '0 0 4px' }}>{banner.subtitle}</p>}
        {banner.gridImages?.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            <p style={{ fontSize: '11px', color: '#7B2FBE', margin: '0 0 4px', fontWeight: '600' }}>
              📷 {banner.gridImages.length} grid image(s):
            </p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {banner.gridImages.slice(0, 4).map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img.url} alt={img.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                  {img.brand && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(123,47,190,0.8)', fontSize: '7px', color: 'white', textAlign: 'center', borderRadius: '0 0 6px 6px', padding: '1px' }}>
                      {img.brand}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0' }}>→ {banner.buttonLink || '/products'}</p>
      </div>
      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
        <button onClick={() => openEdit(banner)} style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #7B2FBE', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', color: '#7B2FBE', cursor: 'pointer' }}>✏️</button>
        <button onClick={() => toggleActive(banner)} style={{ background: banner.isActive ? '#d1fae5' : '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>{banner.isActive ? '✅' : '○'}</button>
        <button onClick={() => handleDelete(banner.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
      </div>
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
        <button style={tabStyle('hero')}           onClick={() => setActiveTab('hero')}>🖼️ Hero ({heroBanners.length})</button>
        <button style={tabStyle('budget')}         onClick={() => setActiveTab('budget')}>🏪 Budget ({budgetBanners.length})</button>
        <button style={tabStyle('sunny')}          onClick={() => setActiveTab('sunny')}>☀️ Sunny ({sunnyBanners.length})</button>
        <button style={tabStyle('promo')}          onClick={() => setActiveTab('promo')}>🏷️ Promo ({promoBanners.length})</button>
        <button style={tabStyle('gender')}         onClick={() => setActiveTab('gender')}>👧👦 Gender ({genderBanners.length})</button>
        <button style={tabStyle('maternity')}      onClick={() => setActiveTab('maternity')}>🤰 Maternity ({maternityBanners.length})</button>
        <button style={tabStyle('personal-care')}  onClick={() => setActiveTab('personal-care')}>🧴 Personal Care ({personalCareBanners.length})</button>
        <button style={tabStyle('health-care')}    onClick={() => setActiveTab('health-care')}>🏥 Health Care ({healthCareBanners.length})</button>
      </div>

      {/* ===== FORM MODAL ===== */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{
  maxWidth: '760px',
  width: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative',
}}>
            <div className={styles.modalHeader}>
              <h2>{formTitle()}</h2>
              <button className={styles.closeBtn} onClick={() => { setShowForm(false); setEditing(null); }}>✕</button>
            </div>

            <form onSubmit={handleSave} className={styles.form} style={{ paddingBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', alignItems: 'start' }}>

                {/* ── LEFT FIELDS ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Title */}
                  <div className="form-group">
                    <label>
                      {form.type === 'budget'          ? 'Card Name *'
                       : form.type === 'sunny'         ? 'Card Label *'
                       : form.type === 'promo'         ? 'Offer Title *'
                       : form.type === 'gender'        ? 'Card Title *'
                       : form.type === 'maternity'     ? 'Section Title *'
                       : form.type === 'personal-care' ? 'Section Title *'
                       : form.type === 'health-care'   ? 'Section Title *'
                       : 'Banner Title *'}
                    </label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder={
                        form.type === 'budget'          ? 'e.g. Under 299'
                        : form.type === 'sunny'         ? 'e.g. Tops'
                        : form.type === 'promo'         ? 'e.g. Summer Sale'
                        : form.type === 'gender'        ? 'e.g. For Her'
                        : form.type === 'maternity'     ? 'e.g. Maternity Collection'
                        : form.type === 'personal-care' ? 'e.g. Personal Care'
                        : form.type === 'health-care'   ? 'e.g. Health & Safety'
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
                        <input className="form-control" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Optional subtitle" />
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
                      <div style={{ padding: '14px', borderRadius: '50%', width: '130px', height: '130px', margin: '0 auto', background: `linear-gradient(135deg, ${form.color}20, ${form.color}40)`, border: `3px solid ${form.color}`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '1.6rem' }}>{form.emoji || '🎀'}</div>
                        <div style={{ fontSize: '0.55rem', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>{form.offer || 'Under'}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: form.color }}>₹{form.price || '299'}</div>
                      </div>
                    </>
                  )}

                  {/* SUNNY FIELDS */}
                  {form.type === 'sunny' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="form-group">
                        <label>Category Slug</label>
                        <input className="form-control" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="tops" />
                        <small style={{ color: '#888', fontSize: '11px' }}>URL: /products?category={form.slug}</small>
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
                        <input className="form-control" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Special offer" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Offer % Badge</label>
                          <input className="form-control" value={form.offer} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))} placeholder="20%" />
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
                    </>
                  )}

                  {/* GENDER FIELDS */}
                  {form.type === 'gender' && (
                    <>
                      <div className="form-group">
                        <label>For *</label>
                        <select className="form-control" value={form.gender || 'girl'} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                          <option value="girl">👧 Girl - For Her</option>
                          <option value="boy">👦 Boy - For Him</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Subtitle</label>
                        <input className="form-control" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. Cute & stylish picks for girls" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Button Link</label>
                          <input className="form-control" value={form.buttonLink} onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))} placeholder="/products?search=girl" />
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

                  {/* ✅ MATERNITY / PERSONAL CARE / HEALTH CARE FIELDS */}
                  {['maternity', 'personal-care', 'health-care'].includes(form.type) && (
                    <>
                      <div className="form-group">
                        <label>Subtitle</label>
                        <input
                          className="form-control"
                          value={form.subtitle}
                          onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                          placeholder={
                            form.type === 'maternity'     ? 'e.g. Everything for moms-to-be'
                            : form.type === 'personal-care' ? 'e.g. Premium baby care products'
                            : 'e.g. Health & safety for your family'
                          }
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Button Text</label>
                          <input className="form-control" value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))} placeholder="Shop Now" />
                        </div>
                        <div className="form-group">
                          <label>Button Link</label>
                          <input
                            className="form-control"
                            value={form.buttonLink}
                            onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                            placeholder={
                              form.type === 'maternity'      ? '/products?category=maternity'
                              : form.type === 'personal-care' ? '/products?category=personal-care'
                              : '/products?category=health-care'
                            }
                          />
                        </div>
                      </div>

                      {/* Health care specific — labels for child/women */}
                      {form.type === 'health-care' && (
                        <div style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          fontSize: '12px',
                          color: '#166534',
                          lineHeight: 1.6,
                        }}>
                          <strong>📋 Health Care Grid Instructions:</strong><br />
                          Upload exactly <strong>2 grid images</strong>:<br />
                          • <strong>Image 1</strong> = 👶 Child Health (add title "child" or "kids")<br />
                          • <strong>Image 2</strong> = 👩 Women Health (add title "women" or "mom")<br />
                          Each image needs: Title + Link to filtered products
                        </div>
                      )}

                      {form.type === 'personal-care' && (
                        <div style={{
                          background: '#f0f9ff',
                          border: '1px solid #7dd3fc',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          fontSize: '12px',
                          color: '#0c4a6e',
                          lineHeight: 1.6,
                        }}>
                          <strong>📋 Personal Care Grid Instructions:</strong><br />
                          Upload product images. For each image add:<br />
                          • <strong>Title</strong> = Product name<br />
                          • <strong>Brand</strong> = Brand name (shows on card)<br />
                          • <strong>Price</strong> = Product price (₹)<br />
                          • <strong>Link</strong> = /products/[product-id]
                        </div>
                      )}

                      {form.type === 'maternity' && (
                        <div style={{
                          background: '#fdf4ff',
                          border: '1px solid #e9d5ff',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          fontSize: '12px',
                          color: '#6b21a8',
                          lineHeight: 1.6,
                        }}>
                          <strong>📋 Maternity Grid Instructions:</strong><br />
                          Upload up to 6 grid images (3x2 layout).<br />
                          For each image add:<br />
                          • <strong>Title</strong> = Product/Collection name<br />
                          • <strong>Price</strong> = Starting price (₹)<br />
                          • <strong>Link</strong> = /products?category=maternity
                        </div>
                      )}
                    </>
                  )}

                  {/* Active checkbox */}
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

                {/* ── RIGHT - Image Upload ── */}
                <ImageUploadSection />
              </div>

              {/* Form Actions */}
              <div className={styles.formActions} style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading || uploadingGrid} style={{ flex: 1 }}>
                  {saving ? '⏳ Saving...' : editing ? '💾 Update' : '✨ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: HERO */}
      {activeTab === 'hero' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#166534' }}>
              ℹ️ Hero banners appear in the main slider.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('hero')}>+ Add Banner</button>
          </div>
          <div className={banStyles.bannersGrid}>
            {loading ? (
              <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading...</p>
            ) : heroBanners.length === 0 ? (
              <div className={banStyles.empty}><span>🖼️</span><p>No hero banners yet.</p></div>
            ) : heroBanners.map(banner => (
              <div key={banner.id} className={banStyles.bannerCard} style={{ backgroundImage: banner.image?.url ? `url(${banner.image.url})` : 'none', backgroundColor: banner.image?.url ? 'transparent' : (banner.bgColor || '#ff6b9d'), backgroundSize: 'cover', backgroundPosition: 'center', opacity: banner.isActive ? 1 : 0.6 }}>
                <div className={banStyles.bannerOverlay}>
                  <div className={banStyles.bannerInfo}>
                    <h3>{banner.title}</h3>
                    {banner.subtitle && <p>{banner.subtitle}</p>}
                    <span className={banStyles.btnPreview}>{banner.buttonText}</span>
                  </div>
                  <div className={banStyles.bannerActions}>
                    <button className={banStyles.actionBtn} onClick={() => openEdit(banner)} style={{ background: 'rgba(255,255,255,0.9)', color: '#7c3aed' }}>✏️ Edit</button>
                    <button className={`${banStyles.actionBtn} ${banner.isActive ? banStyles.activeBtn : banStyles.inactiveBtn}`} onClick={() => toggleActive(banner)}>{banner.isActive ? '✅ Active' : '○ Inactive'}</button>
                    <button className={banStyles.deleteActionBtn} onClick={() => handleDelete(banner.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: BUDGET */}
      {activeTab === 'budget' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#856404' }}>ℹ️ Budget cards show in Budget Store section.</div>
            <button className="btn btn-primary" onClick={() => openAdd('budget')}>+ Add Budget Card</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {budgetBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}><div style={{ fontSize: '40px' }}>🏪</div><p>No budget cards yet.</p></div>
            ) : budgetBanners.map(b => (
              <div key={b.id} style={{ border: `3px solid ${b.color || '#ff6b9d'}`, borderRadius: '50%', width: '160px', height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: b.isActive ? 1 : 0.5, margin: '0 auto', position: 'relative', background: b.image?.url ? `url(${b.image.url})` : `linear-gradient(135deg, ${b.color || '#ff6b9d'}15, ${b.color || '#ff6b9d'}30)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!b.image?.url && (<><div style={{ fontSize: '2rem' }}>{b.emoji || '🎀'}</div><div style={{ fontSize: '0.55rem', color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>{b.offer || 'Under'}</div><div style={{ fontSize: '1.4rem', fontWeight: '900', color: b.color || '#ff6b9d' }}>₹{b.price}</div></>)}
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', display: 'flex', gap: '3px' }}>
                  <button onClick={() => openEdit(b)} style={{ background: 'white', border: `1px solid ${b.color || '#ff6b9d'}`, borderRadius: '50%', width: '26px', height: '26px', fontSize: '10px', color: b.color || '#ff6b9d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                  <button onClick={() => toggleActive(b)} style={{ background: b.isActive ? '#d1fae5' : '#fee2e2', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.isActive ? '✅' : '○'}</button>
                  <button onClick={() => handleDelete(b.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SUNNY */}
      {activeTab === 'sunny' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#0c4a6e' }}>ℹ️ Sunny cards show in Sunny Play Days section.</div>
            <button className="btn btn-primary" onClick={() => openAdd('sunny')}>+ Add Sunny Card</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {sunnyBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}><div style={{ fontSize: '40px' }}>☀️</div><p>No sunny cards yet.</p></div>
            ) : sunnyBanners.map(s => (
              <div key={s.id} style={{ borderRadius: '14px', overflow: 'hidden', height: '200px', backgroundImage: s.image?.url ? `url(${s.image.url})` : 'linear-gradient(170deg, #c5e9f8, #8fd2f2)', backgroundSize: 'cover', backgroundPosition: 'center', border: '1.5px solid rgba(26,123,174,.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: s.isActive ? 1 : 0.5 }}>
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

      {/* TAB: PROMO */}
      {activeTab === 'promo' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#92400e' }}>ℹ️ Promo offers auto-slide on homepage.</div>
            <button className="btn btn-primary" onClick={() => openAdd('promo')}>+ Add Promo</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {promoBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}><div style={{ fontSize: '40px' }}>🏷️</div><p>No promo offers yet.</p></div>
            ) : promoBanners.map(p => (
              <div key={p.id} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: 'white', opacity: p.isActive ? 1 : 0.5, position: 'relative' }}>
                <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                  {p.image?.url ? <img src={p.image.url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff0f5, #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>{p.emoji || '🎁'}</div>}
                  {p.offer && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '55px', height: '55px', borderRadius: '50%', background: p.color || '#ff6b9d', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '1rem', fontWeight: '900', lineHeight: 1 }}>{p.offer}</span><span style={{ fontSize: '0.5rem', fontWeight: '800' }}>OFF</span></div>}
                </div>
                <div style={{ padding: '14px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 4px' }}>{p.title}</h3>
                  {p.subtitle && <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>{p.subtitle}</p>}
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

      {/* TAB: GENDER */}
      {activeTab === 'gender' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#fdf2f8', border: '1px solid #f0abfc', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#701a75' }}>ℹ️ Add 2 cards — one for Girl and one for Boy.</div>
            <button className="btn btn-primary" onClick={() => openAdd('gender')}>+ Add Girl/Boy Card</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
            {genderBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}><div style={{ fontSize: '40px' }}>👧👦</div><p>No gender cards yet.</p></div>
            ) : genderBanners.map(g => (
              <div key={g.id} style={{ borderRadius: '16px', overflow: 'hidden', height: '240px', backgroundImage: g.image?.url ? `url(${g.image.url})` : 'none', backgroundColor: g.image?.url ? 'transparent' : (g.color || '#ff6b9d'), backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', opacity: g.isActive ? 1 : 0.5, display: 'flex', alignItems: 'flex-end' }}>
                {!g.image?.url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>{g.gender === 'girl' ? '👧' : '👦'}</div>}
                <div style={{ width: '100%', padding: '14px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', position: 'relative', zIndex: 1 }}>
                  <p style={{ color: 'white', fontWeight: '800', fontSize: '1rem', margin: '0 0 2px' }}>{g.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0 }}>{g.gender === 'girl' ? '👧 For Her' : '👦 For Him'}</p>
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

      {/* TAB: MATERNITY */}
      {activeTab === 'maternity' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#6b21a8' }}>
              ℹ️ Upload <strong>1 main banner image</strong> + up to <strong>6 grid images</strong> (3x2 layout) with Title + Price.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('maternity')}>+ Add Maternity Banner</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {maternityBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '40px' }}>🤰</div>
                <p>No maternity banners yet.</p>
                <button className="btn btn-primary" onClick={() => openAdd('maternity')} style={{ marginTop: '12px' }}>+ Add First Banner</button>
              </div>
            ) : maternityBanners.map(renderGenericCard)}
          </div>
        </div>
      )}

      {/* TAB: PERSONAL CARE */}
      {activeTab === 'personal-care' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#f0f9ff', border: '1px solid #7dd3fc', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#0c4a6e' }}>
              ℹ️ Upload product images for auto-scroll section. Each needs <strong>Title + Brand + Price + Link</strong>.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('personal-care')}>+ Add Personal Care Banner</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {personalCareBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '40px' }}>🧴</div>
                <p>No personal care banners yet.</p>
                <button className="btn btn-primary" onClick={() => openAdd('personal-care')} style={{ marginTop: '12px' }}>+ Add First Banner</button>
              </div>
            ) : personalCareBanners.map(renderGenericCard)}
          </div>
        </div>
      )}

      {/* TAB: HEALTH CARE */}
      {activeTab === 'health-care' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#166534' }}>
              ℹ️ Upload exactly <strong>2 grid images</strong>: Image 1 = 👶 Child Health, Image 2 = 👩 Women Health. Add link for each.
            </div>
            <button className="btn btn-primary" onClick={() => openAdd('health-care')}>+ Add Health Care Banner</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {healthCareBanners.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '40px' }}>🏥</div>
                <p>No health care banners yet.</p>
                <button className="btn btn-primary" onClick={() => openAdd('health-care')} style={{ marginTop: '12px' }}>+ Add First Banner</button>
              </div>
            ) : healthCareBanners.map(renderGenericCard)}
          </div>
        </div>
      )}

    </div>
  );
}