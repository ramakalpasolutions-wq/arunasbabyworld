'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './form.module.css';

// ✅ Clothing specific options
const CLOTHING_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '0-3M', '3-6M', '6-9M', '6-12M',
  '12-18M', '18-24M',
  '1Y', '2Y', '3Y', '4Y', '5Y',
  '6Y', '7Y', '8Y', '9Y', '10Y',
  'Free Size',
];

const CLOTHING_GENDERS = [
  { value: 'boy',    label: '👦 Boy' },
  { value: 'girl',   label: '👧 Girl' },
  { value: 'unisex', label: '🧒 Unisex' },
];

const CLOTHING_COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Pink',
  'Purple', 'Orange', 'White', 'Black', 'Grey',
  'Brown', 'Navy', 'Maroon', 'Multicolor', 'Printed',
];

const CLOTHING_MATERIALS = [
  'Cotton', 'Organic Cotton', 'Polyester', 'Wool',
  'Fleece', 'Denim', 'Linen', 'Silk', 'Blend',
];

// ✅ Age groups
const AGE_GROUPS = [
  '0-3 months', '3-6 months', '6-12 months',
  '1-2 years', '2-3 years', '3-5 years',
  '5-8 years', '8-12 years', '12+ years',
  'All ages',
];

/* ── Drag & Drop Image Upload ── */
function ImageUploader({ images, onUpload, onRemove, uploading }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    );
    if (files.length) onUpload(files);
  };

  return (
    <div className={styles.uploaderWrap}>
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={e => { if (e.target.files.length) onUpload(Array.from(e.target.files)); e.target.value = ''; }}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        {uploading ? (
          <div className={styles.uploadingState}>
            <div className={styles.spinner} />
            <p>Uploading images...</p>
          </div>
        ) : (
          <div className={styles.dropContent}>
            <div className={styles.uploadIcon}>📤</div>
            <p className={styles.dropTitle}>Drag & Drop images here</p>
            <p className={styles.dropOr}>— or —</p>
            <button type="button" className={styles.browseBtn}
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
              📁 Browse Files
            </button>
            <p className={styles.dropHint}>PNG, JPG, JPEG, WEBP • Max 5MB each</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h4>Uploaded Images ({images.length})</h4>
            <small>First image is the main product image</small>
          </div>
          <div className={styles.previewGrid}>
            {images.map((img, i) => (
              <div key={i} className={styles.previewCard}>
                <div className={styles.previewImgWrap}>
                  <img src={img.url} alt={`Product ${i + 1}`} className={styles.previewImg} />
                  {i === 0 && <span className={styles.mainBadge}>⭐ Main</span>}
                  <button type="button" className={styles.removeImgBtn} onClick={() => onRemove(i)}>🗑️</button>
                </div>
                <p className={styles.imgLabel}>{i === 0 ? 'Main Image' : `Image ${i + 1}`}</p>
              </div>
            ))}
            <div className={styles.addMoreCard} onClick={() => inputRef.current?.click()}>
              <span>+</span><p>Add More</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductForm({ id }) {
  const router  = useRouter();
  const isEdit  = !!id;

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);

  // ✅ Check if selected category is clothing
  const [selectedCatSlug, setSelectedCatSlug] = useState('');
  const isClothing = selectedCatSlug?.toLowerCase().includes('cloth') ||
                     selectedCatSlug?.toLowerCase().includes('apparel') ||
                     selectedCatSlug?.toLowerCase().includes('wear') ||
                     selectedCatSlug?.toLowerCase().includes('dress') ||
                     selectedCatSlug?.toLowerCase().includes('tops') ||
                     selectedCatSlug?.toLowerCase().includes('shirt');

  const [form, setForm] = useState({
    name:             '',
    description:      '',
    shortDescription: '',
    price:            '',
    discountPrice:    '',
    stock:            '',
    brand:            '',
    categoryId:       '',
    ageGroup:         '',
    tags:             '',
    isFeatured:       false,
    isTrending:       false,
    isActive:         true,
    features:         '',
    images:           [],
    // ✅ New clothing fields
    size:             '',
    gender:           '',
    color:            '',
    material:         '',
  });

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        if (d.categories?.length > 0) setCategories(d.categories);
      });

    if (isEdit) {
      fetch(`/api/products/${id}`)
        .then(r => r.json())
        .then(d => {
          const p = d.product;
          if (!p) return;
          setForm({
            name:             p.name             || '',
            description:      p.description      || '',
            shortDescription: p.shortDescription || '',
            price:            p.price            || '',
            discountPrice:    p.discountPrice    || '',
            stock:            p.stock            || '',
            brand:            p.brand            || '',
            categoryId:       p.categoryId       || '',
            ageGroup:         p.ageGroup         || '',
            tags:             p.tags?.join(', ') || '',
            isFeatured:       p.isFeatured       || false,
            isTrending:       p.isTrending       || false,
            isActive:         p.isActive !== false,
            features:         p.features?.join('\n') || '',
            images:           p.images           || [],
            size:             p.size             || '',
            gender:           p.gender           || '',
            color:            p.color            || '',
            material:         p.material         || '',
          });
          // ✅ Set category slug for clothing detection
          const cat = d.product?.category;
          if (cat) setSelectedCatSlug(cat.slug || cat.name || '');
        });
    }
  }, [id, isEdit]);

  // ✅ When category changes — update slug for clothing detection
  const handleCategoryChange = (catId) => {
    set('categoryId', catId);
    const cat = categories.find(c => c.id === catId);
    setSelectedCatSlug(cat?.slug || cat?.name || '');

    // ✅ Reset clothing fields if category changes
    set('size', '');
    set('gender', '');
    set('color', '');
    set('material', '');
  };

  const handleImageUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 5MB`);
          setUploading(false);
          return;
        }
      }
      const fd = new FormData();
      for (const file of files) fd.append('file', file);
      fd.append('folder', 'firstcry/products');

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const newImages = data.images || [];
      if (!newImages.length) { toast.error('No images uploaded'); return; }

      setForm(f => ({ ...f, images: [...f.images, ...newImages] }));
      toast.success(`${newImages.length} image(s) uploaded ✅`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    toast.success('Image removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.stock || !form.categoryId || !form.description) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    // ✅ Clothing validation
    if (isClothing && !form.size) {
      toast.error('Please select size for clothing product');
      return;
    }
    if (isClothing && !form.gender) {
      toast.error('Please select gender for clothing product');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:             form.name,
        description:      form.description,
        shortDescription: form.shortDescription || null,
        price:            parseFloat(form.price),
        discountPrice:    form.discountPrice ? parseFloat(form.discountPrice) : null,
        stock:            parseInt(form.stock),
        brand:            form.brand    || null,
        categoryId:       form.categoryId,
        ageGroup:         form.ageGroup || null,
        tags:             form.tags.split(',').map(t => t.trim()).filter(Boolean),
        features:         form.features.split('\n').map(f => f.trim()).filter(Boolean),
        isFeatured:       form.isFeatured,
        isTrending:       form.isTrending,
        isActive:         form.isActive,
        images:           form.images,
        // ✅ Clothing fields
        size:             form.size     || null,
        gender:           form.gender   || null,
        color:            form.color    || null,
        material:         form.material || null,
      };

      if (payload.discountPrice && payload.price) {
        payload.discountPercent = Math.round(
          ((payload.price - payload.discountPrice) / payload.price) * 100
        );
      }

      const url    = isEdit ? `/api/products/${id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(isEdit ? '✅ Product updated!' : '✅ Product created!');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</h1>
          <p>{isEdit ? 'Update product details below' : 'Fill in the details to add a new product'}</p>
        </div>
        <button onClick={() => router.back()} className="btn btn-outline">← Back</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>

          {/* ══ LEFT COLUMN ══ */}
          <div className={styles.col}>

            <div className={styles.card}>
              <h3>📝 Basic Information</h3>

              <div className="form-group">
                <label>Product Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <input
                  className="form-control"
                  value={form.shortDescription}
                  onChange={e => set('shortDescription', e.target.value)}
                  placeholder="Brief description shown on product cards"
                />
              </div>

              <div className="form-group">
                <label>Full Description *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Detailed product description..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Key Features (one per line)</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.features}
                  onChange={e => set('features', e.target.value)}
                  placeholder={`Soft cotton material\nMachine washable\nBIS certified safe`}
                />
              </div>
            </div>

            {/* Images */}
            <div className={styles.card}>
              <h3>🖼️ Product Images</h3>
              <ImageUploader
                images={form.images}
                onUpload={handleImageUpload}
                onRemove={removeImage}
                uploading={uploading}
              />
            </div>

            {/* ✅ CLOTHING FIELDS — only shows when clothing category selected */}
            {isClothing && (
              <div className={styles.card} style={{
                border: '2px solid #FF6B35',
                borderRadius: '16px',
              }}>
                <h3 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#FF6B35',
                }}>
                  👗 Clothing Details
                  <span style={{
                    fontSize: '0.70rem',
                    background: '#FFF3EC',
                    color: '#FF6B35',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}>
                    Required for clothing
                  </span>
                </h3>

                {/* Gender */}
                <div className="form-group">
                  <label>Gender *</label>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginTop: '6px',
                  }}>
                    {CLOTHING_GENDERS.map(g => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => set('gender', g.value)}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '999px',
                          border: '2px solid',
                          borderColor: form.gender === g.value ? '#FF6B35' : '#EDD9FF',
                          background: form.gender === g.value
                            ? 'linear-gradient(135deg, #FF6B35, #7B2FBE)'
                            : 'white',
                          color: form.gender === g.value ? 'white' : '#6B4E8A',
                          fontWeight: '700',
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div className="form-group">
                  <label>Size *</label>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '6px',
                  }}>
                    {CLOTHING_SIZES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('size', s)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: '2px solid',
                          borderColor: form.size === s ? '#7B2FBE' : '#EDD9FF',
                          background: form.size === s
                            ? 'linear-gradient(135deg, #7B2FBE, #9B4FDE)'
                            : 'white',
                          color: form.size === s ? 'white' : '#6B4E8A',
                          fontWeight: '700',
                          fontSize: '0.80rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="form-group">
                  <label>Color</label>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '6px',
                  }}>
                    {CLOTHING_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set('color', c)}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: form.color === c ? '#FF6B35' : '#EDD9FF',
                          background: form.color === c ? '#FFF3EC' : 'white',
                          color: form.color === c ? '#FF6B35' : '#6B4E8A',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {/* Custom color input */}
                  <input
                    className="form-control"
                    value={form.color}
                    onChange={e => set('color', e.target.value)}
                    placeholder="Or type custom color..."
                    style={{ marginTop: '10px' }}
                  />
                </div>

                {/* Material */}
                <div className="form-group">
                  <label>Material</label>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '6px',
                  }}>
                    {CLOTHING_MATERIALS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => set('material', m)}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: form.material === m ? '#7B2FBE' : '#EDD9FF',
                          background: form.material === m ? '#F3E8FF' : 'white',
                          color: form.material === m ? '#7B2FBE' : '#6B4E8A',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ✅ Clothing summary */}
                {(form.gender || form.size || form.color) && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
                    borderRadius: '12px',
                    border: '1.5px solid #EDD9FF',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    color: '#2D1A4A',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}>
                    {form.gender && (
                      <span>
                        {form.gender === 'boy' ? '👦' : form.gender === 'girl' ? '👧' : '🧒'}
                        {' '}{form.gender}
                      </span>
                    )}
                    {form.size     && <span>📏 {form.size}</span>}
                    {form.color    && <span>🎨 {form.color}</span>}
                    {form.material && <span>🧵 {form.material}</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className={styles.col}>

            {/* Pricing */}
            <div className={styles.card}>
              <h3>💰 Pricing & Stock</h3>
              <div className={styles.row2}>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    placeholder="0.00"
                    min="0" step="0.01" required
                  />
                </div>
                <div className="form-group">
                  <label>Discount Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.discountPrice}
                    onChange={e => set('discountPrice', e.target.value)}
                    placeholder="Optional"
                    min="0" step="0.01"
                  />
                </div>
              </div>

              {form.price && form.discountPrice && (
                <div className={styles.discountPreview}>
                  🏷️ Discount:{' '}
                  <strong>
                    {Math.round(((form.price - form.discountPrice) / form.price) * 100)}% off
                  </strong>
                  {' '}— Customer saves{' '}
                  <strong>₹{(form.price - form.discountPrice).toFixed(2)}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.stock}
                  onChange={e => set('stock', e.target.value)}
                  placeholder="0" min="0" required
                />
              </div>
            </div>

            {/* Organization */}
            <div className={styles.card}>
              <h3>🗂️ Organization</h3>

              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-control"
                  value={form.categoryId}
                  onChange={e => handleCategoryChange(e.target.value)}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <small style={{ color: 'red' }}>⚠️ No categories found</small>
                )}

                {/* ✅ Clothing badge */}
                {isClothing && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 14px',
                    background: '#FFF3EC',
                    border: '1.5px solid #FFD4B8',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: '#FF6B35',
                  }}>
                    👗 Clothing category detected — Size & Gender fields are now required!
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input
                  className="form-control"
                  value={form.brand}
                  onChange={e => set('brand', e.target.value)}
                  placeholder="Brand name"
                />
              </div>

              <div className="form-group">
                <label>Age Group</label>
                <select
                  className="form-control"
                  value={form.ageGroup}
                  onChange={e => set('ageGroup', e.target.value)}
                >
                  <option value="">Select Age Group</option>
                  {AGE_GROUPS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  className="form-control"
                  value={form.tags}
                  onChange={e => set('tags', e.target.value)}
                  placeholder="cotton, newborn, summer"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className={styles.card}>
              <h3>👁️ Visibility</h3>
              <div className={styles.checkboxes}>
                {[
                  { key: 'isActive',   label: '✅ Active (visible to customers)' },
                  { key: 'isFeatured', label: '⭐ Featured (shown on home page)' },
                  { key: 'isTrending', label: '🔥 Trending (shown on home page)' },
                ].map(({ key, label }) => (
                  <label key={key} className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={e => set(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className={styles.submitRow}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || uploading}
                style={{ flex: 1 }}
              >
                {loading
                  ? '⏳ Saving...'
                  : isEdit
                    ? '💾 Update Product'
                    : '✨ Create Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}