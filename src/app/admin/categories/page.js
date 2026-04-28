'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const CATEGORY_TYPES = [
  { value: 'normal', label: '📦 Normal Category' },
  { value: 'maternity', label: '🤰 Maternity' },
  { value: 'personal-care', label: '💄 Women Personal Care' },
  { value: 'healthy-care', label: '💊 Healthy Care' },
];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGrid, setUploadingGrid] = useState(false);
  const [activeTab, setActiveTab] = useState('normal');

  const emptyForm = {
    name: '',
    description: '',
    color: '#ff6b9d',
    icon: '',
    type: 'normal',
    banner: null,
    gridImages: [],
  };

  const [form, setForm] = useState(emptyForm);

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => { setCategories(d.categories || []); setLoading(false); });
  };

  useEffect(() => { fetchCategories(); }, []);

  // Filter by type
  const normalCats = categories.filter(c => c.type === 'normal' || !c.type);
  const maternityCats = categories.filter(c => c.type === 'maternity');
  const personalCareCats = categories.filter(c => c.type === 'personal-care');
  const healthyCats = categories.filter(c => c.type === 'healthy-care');

  const openAdd = (type = 'normal') => {
    setEditing(null);
    setForm({ ...emptyForm, type });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      color: cat.color || '#ff6b9d',
      icon: cat.icon || '',
      type: cat.type || 'normal',
      banner: cat.banner || null,
      gridImages: cat.gridImages || [],
    });
    setShowForm(true);
  };

  // Upload banner image
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/categories');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const imageUrl = data.url || data.images?.[0]?.url;
      setForm(f => ({ ...f, banner: { url: imageUrl, publicId: data.publicId || '' } }));
      toast.success('✅ Banner uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Upload grid images
  const handleGridImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingGrid(true);
    try {
      const fd = new FormData();
      for (const file of files) fd.append('file', file);
      fd.append('folder', 'firstcry/categories/grid');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newImages = data.images || [{ url: data.url, publicId: data.publicId }];
      setForm(f => ({
        ...f,
        gridImages: [...(f.gridImages || []), ...newImages],
      }));
      toast.success(`✅ ${newImages.length} image(s) uploaded!`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingGrid(false);
    }
  };

  const removeGridImage = (idx) => {
    setForm(f => ({ ...f, gridImages: f.gridImages.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? 'Updated! ✅' : 'Created! ✅');
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted ✅'); fetchCategories(); }
    else toast.error('Failed to delete');
  };

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'linear-gradient(135deg, #ff6b9d, #7c3aed)' : '#f3f4f6',
    color: activeTab === tab ? 'white' : '#666',
  });

  const renderCategoryCard = (cat) => (
    <div key={cat.id} className={styles.catCard} style={{ borderColor: cat.color }}>
      <div className={styles.catHeader}>
        <div className={styles.catIcon} style={{ background: `${cat.color}20`, color: cat.color }}>
          {cat.banner?.url ? (
            <img src={cat.banner.url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            cat.icon || cat.name[0]
          )}
        </div>
        <div className={styles.catActions}>
          <button onClick={() => openEdit(cat)} className={styles.editBtn}>✏️ Edit</button>
          <button onClick={() => handleDelete(cat.id, cat.name)} className={styles.deleteBtn}>🗑️</button>
        </div>
      </div>
      <h3 className={styles.catName}>{cat.name}</h3>
      {cat.description && <p className={styles.catDesc}>{cat.description}</p>}
      {cat.gridImages?.length > 0 && (
        <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
          🖼️ {cat.gridImages.length} grid image(s)
        </p>
      )}
      {cat.banner?.url && (
        <p style={{ fontSize: '11px', color: '#10b981', margin: '4px 0 0' }}>
          ✅ Banner image set
        </p>
      )}
      <div className={styles.catMeta}>
        <span style={{ background: `${cat.color}15`, color: cat.color }}>{cat.slug}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Categories 🗂️</h1>
          <p>{categories.length} categories total</p>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd(activeTab === 'normal' ? 'normal' : activeTab)}>
          + Add {activeTab === 'normal' ? 'Category' : activeTab === 'maternity' ? 'Maternity' : activeTab === 'personal-care' ? 'Personal Care' : 'Healthy Care'}
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button style={tabStyle('normal')} onClick={() => setActiveTab('normal')}>
          📦 Normal ({normalCats.length})
        </button>
        <button style={tabStyle('maternity')} onClick={() => setActiveTab('maternity')}>
          🤰 Maternity ({maternityCats.length})
        </button>
        <button style={tabStyle('personal-care')} onClick={() => setActiveTab('personal-care')}>
          💄 Personal Care ({personalCareCats.length})
        </button>
        <button style={tabStyle('healthy-care')} onClick={() => setActiveTab('healthy-care')}>
          💊 Healthy Care ({healthyCats.length})
        </button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{ maxWidth: '700px' }}>
            <div className={styles.modalHeader}>
              <h2>{editing ? '✏️ Edit' : '➕ Add'} {CATEGORY_TYPES.find(t => t.value === form.type)?.label}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                {/* LEFT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Maternity Wear" required />
                  </div>

                  <div className="form-group">
                    <label>Type</label>
                    <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {CATEGORY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label>Icon (emoji)</label>
                      <input className="form-control" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🤰" />
                    </div>
                    <div className="form-group">
                      <label>Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: '44px', height: '38px', border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }} />
                        <input className="form-control" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Banner Image Upload */}
                  <div className="form-group">
                    <label>🖼️ Long Banner Image</label>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} disabled={uploading} />
                      <div style={{
                        width: '100%', height: '120px', border: `2px dashed ${form.color || '#ff6b9d'}`,
                        borderRadius: '12px', background: '#fff8fb', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', cursor: 'pointer', position: 'relative',
                      }}>
                        {uploading ? (
                          <div style={{ textAlign: 'center' }}>⏳<p style={{ fontSize: '11px', color: '#ff6b9d' }}>Uploading...</p></div>
                        ) : form.banner?.url ? (
                          <img src={form.banner.url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px' }}>🖼️</div>
                            <p style={{ fontSize: '11px', color: '#ff6b9d', fontWeight: '700' }}>Upload Long Banner</p>
                            <p style={{ fontSize: '10px', color: '#999' }}>1920x400px recommended</p>
                          </div>
                        )}
                      </div>
                    </label>
                    {form.banner?.url && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, banner: null }))}
                        style={{ marginTop: '4px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', width: '100%' }}>
                        🗑️ Remove Banner
                      </button>
                    )}
                  </div>

                  {/* Grid Images Upload */}
                  <div className="form-group">
                    <label>📷 Grid Images (Multiple)</label>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input type="file" accept="image/*" multiple onChange={handleGridImageUpload} style={{ display: 'none' }} disabled={uploadingGrid} />
                      <div style={{
                        width: '100%', height: '80px', border: '2px dashed #0ea5e9',
                        borderRadius: '12px', background: '#f0f9ff', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                        {uploadingGrid ? (
                          <div style={{ textAlign: 'center' }}>⏳<p style={{ fontSize: '11px', color: '#0ea5e9' }}>Uploading...</p></div>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px' }}>📷</div>
                            <p style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '700' }}>Upload Grid Images</p>
                            <p style={{ fontSize: '10px', color: '#999' }}>Select multiple images</p>
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Grid Images Preview */}
                    {form.gridImages?.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
                        {form.gridImages.map((img, i) => (
                          <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                            <img src={img.url} alt={`Grid ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => removeGridImage(i)}
                              style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.gridImages?.length > 0 && (
                      <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✅ {form.gridImages.length} grid image(s) ready</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading || uploadingGrid}>
                  {saving ? '⏳ Saving...' : editing ? '💾 Update' : '✨ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY GRIDS BY TAB */}
      {loading ? (
        <div className={styles.loadingGrid}>
          {[1,2,3].map(i => <div key={i} className={`skeleton ${styles.skeletonCard}`} />)}
        </div>
      ) : (
        <>
          {activeTab === 'normal' && (
            <div className={styles.catGrid}>
              {normalCats.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
                  <div style={{ fontSize: '40px' }}>📦</div>
                  <p>No normal categories yet</p>
                </div>
              ) : normalCats.map(renderCategoryCard)}
            </div>
          )}

          {activeTab === 'maternity' && (
            <div>
              <div style={{ background: '#fdf2f8', border: '1px solid #f0abfc', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#701a75' }}>
                ℹ️ Add <strong>1 banner image</strong> (long) + <strong>multiple grid images</strong> for the Maternity section on home page.
              </div>
              <div className={styles.catGrid}>
                {maternityCats.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '40px' }}>🤰</div>
                    <p>No maternity categories yet</p>
                    <button onClick={() => openAdd('maternity')} className="btn btn-primary" style={{ marginTop: '12px' }}>+ Add Maternity</button>
                  </div>
                ) : maternityCats.map(renderCategoryCard)}
              </div>
            </div>
          )}

          {activeTab === 'personal-care' && (
            <div>
              <div style={{ background: '#fdf2f8', border: '1px solid #f0abfc', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#701a75' }}>
                ℹ️ Add <strong>1 banner image</strong> + <strong>grid images</strong> for Women Personal Care section.
              </div>
              <div className={styles.catGrid}>
                {personalCareCats.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '40px' }}>💄</div>
                    <p>No personal care categories yet</p>
                    <button onClick={() => openAdd('personal-care')} className="btn btn-primary" style={{ marginTop: '12px' }}>+ Add Personal Care</button>
                  </div>
                ) : personalCareCats.map(renderCategoryCard)}
              </div>
            </div>
          )}

          {activeTab === 'healthy-care' && (
            <div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#166534' }}>
                ℹ️ Add <strong>1 banner image</strong> + <strong>grid images</strong> for Healthy Care section.
              </div>
              <div className={styles.catGrid}>
                {healthyCats.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '40px' }}>💊</div>
                    <p>No healthy care categories yet</p>
                    <button onClick={() => openAdd('healthy-care')} className="btn btn-primary" style={{ marginTop: '12px' }}>+ Add Healthy Care</button>
                  </div>
                ) : healthyCats.map(renderCategoryCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}