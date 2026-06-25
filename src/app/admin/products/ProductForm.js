'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './form.module.css';

const CATEGORY_ORDER = [
  'clothing', 'personal-care', 'health-care', 'baby-gear',
  'walkers', 'toys', 'cradles-cribs', 'electric-vehicles', 'food',
];

const CLOTHING_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '0-3M', '3-6M', '6-9M', '6-12M', '12-18M', '18-24M',
  '1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', 'Free Size',
];

const CLOTHING_GENDERS = [
  { value: 'boy',    label: '👦 Boy'    },
  { value: 'girl',   label: '👧 Girl'   },
  { value: 'unisex', label: '🧒 Unisex' },
];

const CLOTHING_COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange',
  'White', 'Black', 'Grey', 'Brown', 'Navy', 'Maroon', 'Multicolor', 'Printed',
];

const CLOTHING_MATERIALS = [
  'Cotton', 'Organic Cotton', 'Polyester', 'Wool',
  'Fleece', 'Denim', 'Linen', 'Silk', 'Blend',
];

// ✅ 4 Fixed image slots
const IMAGE_SLOTS = [
  { key: 'front', label: 'Front View',  icon: '🖼️', required: true  },
  { key: 'back',  label: 'Back View',   icon: '🔄', required: false },
  { key: 'side',  label: 'Side View',   icon: '↔️', required: false },
  { key: 'top',   label: 'Top View',    icon: '⬆️', required: false },
];

/* ── Single Image Slot Uploader ── */
function ImageSlot({ slot, image, onUpload, onRemove, uploading, index }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onUpload(file, index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '0.80rem', fontWeight: '800', color: '#6B4E8A',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        <span>{slot.icon}</span>
        <span>{slot.label}</span>
        {slot.required && (
          <span style={{
            fontSize: '0.65rem', background: '#FF6B35', color: 'white',
            padding: '1px 6px', borderRadius: '999px', fontWeight: '800',
          }}>Required</span>
        )}
        {index === 0 && image && (
          <span style={{
            fontSize: '0.65rem',
            background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
            color: 'white', padding: '1px 8px',
            borderRadius: '999px', fontWeight: '800',
          }}>⭐ Main</span>
        )}
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && !image && inputRef.current?.click()}
        style={{
          width: '100%', aspectRatio: '1',
          border: `2px dashed ${
            image       ? '#22C55E'  :
            dragOver    ? '#7B2FBE'  :
            slot.required && !image ? '#FF6B35' : '#EDD9FF'
          }`,
          borderRadius: '14px',
          background: image ? 'transparent' : dragOver ? '#F3E8FF' : '#FBF7FF',
          cursor: image || uploading ? 'default' : 'pointer',
          position: 'relative', overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxShadow: image
            ? '0 4px 16px rgba(34,197,94,0.15)'
            : dragOver
              ? '0 4px 16px rgba(123,47,190,0.15)'
              : 'none',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={e => {
            if (e.target.files[0]) onUpload(e.target.files[0], index);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
          disabled={uploading || !!image}
        />

        {image ? (
          <>
            <img
              src={image.url}
              alt={slot.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '8px', opacity: 0, transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
            >
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onRemove(index); }}
                style={{
                  background: '#DC2626', color: 'white',
                  border: 'none', padding: '6px 14px',
                  borderRadius: '8px', fontSize: '0.78rem',
                  fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >🗑️ Remove</button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onRemove(index);
                  setTimeout(() => inputRef.current?.click(), 100);
                }}
                style={{
                  background: '#7B2FBE', color: 'white',
                  border: 'none', padding: '6px 14px',
                  borderRadius: '8px', fontSize: '0.78rem',
                  fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >🔄 Replace</button>
            </div>

            <div style={{
              position: 'absolute', top: '6px', right: '6px',
              background: '#22C55E', color: 'white',
              width: '22px', height: '22px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.70rem', fontWeight: '800',
            }}>✓</div>
          </>
        ) : uploading ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '8px',
          }}>
            <div style={{
              width: '28px', height: '28px',
              border: '3px solid rgba(255,107,53,0.2)',
              borderTop: '3px solid #FF6B35',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: '0.72rem', color: '#FF6B35', fontWeight: '700' }}>
              Uploading...
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '6px', padding: '12px',
          }}>
            <span style={{ fontSize: '1.8rem' }}>{slot.icon}</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: '700',
              color: '#9585B0', textAlign: 'center', lineHeight: 1.3,
            }}>
              Click or drop<br />{slot.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 4-Slot Image Uploader ── */
function MultiImageUploader({ images, onUploadSlot, onRemoveSlot, uploadingSlot }) {
  const uploadedCount = images.filter(Boolean).length;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '12px',
      }}>
        <span style={{ fontSize: '0.80rem', fontWeight: '700', color: '#6B4E8A' }}>
          {uploadedCount}/4 images uploaded
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {IMAGE_SLOTS.map((_, i) => (
            <div key={i} style={{
              width: '28px', height: '6px', borderRadius: '999px',
              background: images[i] ? '#22C55E' : '#EDD9FF',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
      }}>
        {IMAGE_SLOTS.map((slot, i) => (
          <ImageSlot
            key={slot.key}
            slot={slot}
            image={images[i] || null}
            onUpload={onUploadSlot}
            onRemove={onRemoveSlot}
            uploading={uploadingSlot === i}
            index={i}
          />
        ))}
      </div>

      <div style={{
        marginTop: '12px', padding: '10px 14px',
        background: uploadedCount === 0
          ? '#FFF3EC'
          : uploadedCount === 4 ? '#F0FDF4' : '#FBF7FF',
        border: `1.5px solid ${
          uploadedCount === 0 ? '#FFD4B8' :
          uploadedCount === 4 ? '#BBF7D0' : '#EDD9FF'
        }`,
        borderRadius: '10px', fontSize: '0.78rem',
        fontWeight: '600',
        color: uploadedCount === 4 ? '#166534' : '#6B4E8A',
      }}>
        {uploadedCount === 0 && '📸 Upload Front View first (required). Other views are optional.'}
        {uploadedCount === 1 && '✅ Front image uploaded! Add more views for better product display.'}
        {uploadedCount === 2 && '✅ 2 images uploaded! You can add 2 more views.'}
        {uploadedCount === 3 && '✅ 3 images uploaded! One more slot available.'}
        {uploadedCount === 4 && '🎉 All 4 product views uploaded! Customers will love this.'}
      </div>
    </div>
  );
}

export default function ProductForm({ id }) {
  const router  = useRouter();
  const isEdit  = !!id;

  const [categories,    setCategories]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const [selectedCatSlug, setSelectedCatSlug] = useState('');
  const isClothing = selectedCatSlug?.toLowerCase().includes('cloth') ||
                     selectedCatSlug?.toLowerCase().includes('apparel') ||
                     selectedCatSlug?.toLowerCase().includes('wear');

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
    images:           [null, null, null, null],
    size:             '',
    gender:           '',
    color:            '',
    material:         '',
  });

  /* ============================================================
     ✅ Fetch categories & product (edit mode)
     ============================================================ */
  useEffect(() => {
    fetch('/api/categories?all=true')
      .then(r => r.json())
      .then(d => {
        let cats = d.categories || [];
        cats.sort((a, b) => {
          const aIdx = CATEGORY_ORDER.indexOf(a.slug);
          const bIdx = CATEGORY_ORDER.indexOf(b.slug);
          const aOrder = aIdx === -1 ? 999 : aIdx;
          const bOrder = bIdx === -1 ? 999 : bIdx;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.name.localeCompare(b.name);
        });
        setCategories(cats);
      })
      .catch(() => toast.error('Failed to load categories'));

    if (isEdit) {
      fetch(`/api/products/${id}`)
        .then(r => r.json())
        .then(d => {
          const p = d.product;
          if (!p) return;

          const existingImages = p.images || [];
          const slottedImages = [
            existingImages[0] || null,
            existingImages[1] || null,
            existingImages[2] || null,
            existingImages[3] || null,
          ];

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
            images:           slottedImages,
            size:             p.size             || '',
            gender:           p.gender           || '',
            color:            p.color            || '',
            material:         p.material         || '',
          });

          const cat = p.category;
          if (cat) setSelectedCatSlug(cat.slug || cat.name || '');
        });
    }
  }, [id, isEdit]);

  const handleCategoryChange = (catId) => {
    set('categoryId', catId);
    const cat = categories.find(c => c.id === catId);
    setSelectedCatSlug(cat?.slug || cat?.name || '');
    set('size', '');
    set('gender', '');
    set('color', '');
    set('material', '');
  };

  /* ── Upload single slot ── */
  const handleSlotUpload = async (file, slotIndex) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Image too large. Max 5MB`);
      return;
    }

    setUploadingSlot(slotIndex);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/products');

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploaded = data.images?.[0] || { url: data.url, publicId: data.publicId };
      if (!uploaded?.url) throw new Error('No image URL returned');

      setForm(f => {
        const newImages = [...f.images];
        newImages[slotIndex] = uploaded;
        return { ...f, images: newImages };
      });

      const slotNames = ['Front', 'Back', 'Side', 'Top'];
      toast.success(`${slotNames[slotIndex]} view uploaded! ✅`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  };

  /* ── Remove single slot ── */
  const handleSlotRemove = (slotIndex) => {
    setForm(f => {
      const newImages = [...f.images];
      newImages[slotIndex] = null;
      return { ...f, images: newImages };
    });
    const slotNames = ['Front', 'Back', 'Side', 'Top'];
    toast.success(`${slotNames[slotIndex]} view removed`);
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.stock || !form.categoryId || !form.description) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!form.images[0]) {
      toast.error('Please upload at least the Front View image');
      return;
    }

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
      const uploadedImages = form.images.filter(Boolean);

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
        images:           uploadedImages,
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
  const uploadedCount = form.images.filter(Boolean).length;

  const predefinedCats = categories.filter(c => CATEGORY_ORDER.includes(c.slug));
  const customCats     = categories.filter(c => !CATEGORY_ORDER.includes(c.slug));

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
                <input className="form-control" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Enter product name" required />
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <input className="form-control" value={form.shortDescription}
                  onChange={e => set('shortDescription', e.target.value)}
                  placeholder="Brief description shown on product cards" />
              </div>

              <div className="form-group">
                <label>Full Description *</label>
                <textarea className="form-control" rows={5} value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Detailed product description..." required />
              </div>

              <div className="form-group">
                <label>Key Features (one per line)</label>
                <textarea className="form-control" rows={4} value={form.features}
                  onChange={e => set('features', e.target.value)}
                  placeholder={`Soft cotton material\nMachine washable\nBIS certified safe`} />
              </div>
            </div>

            <div className={styles.card}>
              <h3>
                🖼️ Product Images
                <span style={{
                  marginLeft: '10px', fontSize: '0.70rem',
                  background: uploadedCount > 0
                    ? 'linear-gradient(135deg,#22C55E,#16A34A)'
                    : '#FFF3EC',
                  color: uploadedCount > 0 ? 'white' : '#FF6B35',
                  padding: '2px 10px', borderRadius: '999px', fontWeight: '800',
                }}>
                  {uploadedCount}/4 uploaded
                </span>
              </h3>

              <MultiImageUploader
                images={form.images}
                onUploadSlot={handleSlotUpload}
                onRemoveSlot={handleSlotRemove}
                uploadingSlot={uploadingSlot}
              />
            </div>

            {/* Clothing Fields */}
            {isClothing && (
              <div className={styles.card} style={{
                border: '2px solid #FF6B35', borderRadius: '16px',
              }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF6B35' }}>
                  👗 Clothing Details
                  <span style={{
                    fontSize: '0.70rem', background: '#FFF3EC', color: '#FF6B35',
                    padding: '2px 10px', borderRadius: '999px',
                    fontWeight: '700', textTransform: 'uppercase',
                  }}>Required for clothing</span>
                </h3>

                <div className="form-group">
                  <label>Gender *</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {CLOTHING_GENDERS.map(g => (
                      <button key={g.value} type="button" onClick={() => set('gender', g.value)}
                        style={{
                          padding: '8px 20px', borderRadius: '999px', border: '2px solid',
                          borderColor: form.gender === g.value ? '#FF6B35' : '#EDD9FF',
                          background: form.gender === g.value
                            ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)' : 'white',
                          color: form.gender === g.value ? 'white' : '#6B4E8A',
                          fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                          transition: 'all 0.2s', fontFamily: 'inherit',
                        }}>{g.label}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Size *</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {CLOTHING_SIZES.map(s => (
                      <button key={s} type="button" onClick={() => set('size', s)}
                        style={{
                          padding: '6px 14px', borderRadius: '10px', border: '2px solid',
                          borderColor: form.size === s ? '#7B2FBE' : '#EDD9FF',
                          background: form.size === s
                            ? 'linear-gradient(135deg,#7B2FBE,#9B4FDE)' : 'white',
                          color: form.size === s ? 'white' : '#6B4E8A',
                          fontWeight: '700', fontSize: '0.80rem', cursor: 'pointer',
                          transition: 'all 0.2s', fontFamily: 'inherit',
                        }}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {CLOTHING_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => set('color', c)}
                        style={{
                          padding: '5px 14px', borderRadius: '8px', border: '2px solid',
                          borderColor: form.color === c ? '#FF6B35' : '#EDD9FF',
                          background: form.color === c ? '#FFF3EC' : 'white',
                          color: form.color === c ? '#FF6B35' : '#6B4E8A',
                          fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer',
                          transition: 'all 0.2s', fontFamily: 'inherit',
                        }}>{c}</button>
                    ))}
                  </div>
                  <input className="form-control" value={form.color}
                    onChange={e => set('color', e.target.value)}
                    placeholder="Or type custom color..." style={{ marginTop: '10px' }} />
                </div>

                <div className="form-group">
                  <label>Material</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {CLOTHING_MATERIALS.map(m => (
                      <button key={m} type="button" onClick={() => set('material', m)}
                        style={{
                          padding: '5px 14px', borderRadius: '8px', border: '2px solid',
                          borderColor: form.material === m ? '#7B2FBE' : '#EDD9FF',
                          background: form.material === m ? '#F3E8FF' : 'white',
                          color: form.material === m ? '#7B2FBE' : '#6B4E8A',
                          fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer',
                          transition: 'all 0.2s', fontFamily: 'inherit',
                        }}>{m}</button>
                    ))}
                  </div>
                </div>

                {(form.gender || form.size || form.color) && (
                  <div style={{
                    marginTop: '12px', padding: '12px 16px',
                    background: 'linear-gradient(135deg,#FFF3EC,#F3E8FF)',
                    borderRadius: '12px', border: '1.5px solid #EDD9FF',
                    fontSize: '0.84rem', fontWeight: '600', color: '#2D1A4A',
                    display: 'flex', flexWrap: 'wrap', gap: '10px',
                  }}>
                    {form.gender   && <span>{form.gender === 'boy' ? '👦' : form.gender === 'girl' ? '👧' : '🧒'} {form.gender}</span>}
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

            <div className={styles.card}>
              <h3>💰 Pricing & Stock</h3>
              <div className={styles.row2}>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" className="form-control" value={form.price}
                    onChange={e => set('price', e.target.value)}
                    placeholder="0.00" min="0" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Discount Price (₹)</label>
                  <input type="number" className="form-control" value={form.discountPrice}
                    onChange={e => set('discountPrice', e.target.value)}
                    placeholder="Optional" min="0" step="0.01" />
                </div>
              </div>

              {form.price && form.discountPrice && (
                <div className={styles.discountPreview}>
                  🏷️ Discount: <strong>
                    {Math.round(((form.price - form.discountPrice) / form.price) * 100)}% off
                  </strong>
                  {' '}— Save <strong>₹{(form.price - form.discountPrice).toFixed(2)}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input type="number" className="form-control" value={form.stock}
                  onChange={e => set('stock', e.target.value)}
                  placeholder="0" min="0" required />
              </div>
            </div>

            <div className={styles.card}>
              <h3>🗂️ Organization</h3>

              <div className="form-group">
                <label>Category *</label>

                <select className="form-control" value={form.categoryId}
                  onChange={e => handleCategoryChange(e.target.value)} required>
                  <option value="">-- Select Category --</option>

                  {predefinedCats.length > 0 && (
                    <optgroup label="⭐ Main Categories">
                      {predefinedCats.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon ? `${c.icon} ` : ''}{c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {customCats.length > 0 && (
                    <optgroup label="✨ Custom Categories">
                      {customCats.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon ? `${c.icon} ` : ''}{c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {categories.length === 0 && (
                  <small style={{ color: 'red' }}>⚠️ No categories found</small>
                )}

                {categories.length > 0 && (
                  <small style={{
                    display: 'block',
                    marginTop: '6px',
                    color: '#6B4E8A',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                  }}>
                    📊 {predefinedCats.length} main + {customCats.length} custom = {categories.length} total
                  </small>
                )}

                {isClothing && (
                  <div style={{
                    marginTop: '8px', padding: '6px 14px',
                    background: '#FFF3EC', border: '1.5px solid #FFD4B8',
                    borderRadius: '8px', fontSize: '0.78rem',
                    fontWeight: '700', color: '#FF6B35',
                  }}>
                    👗 Clothing detected — Size & Gender required!
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input className="form-control" value={form.brand}
                  onChange={e => set('brand', e.target.value)} placeholder="Brand name" />
              </div>

              {/* ✅ SIMPLE AGE GROUP — TYPE FREELY */}
              <div className="form-group">
                <label>Age Group</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.ageGroup}
                  onChange={e => set('ageGroup', e.target.value)}
                  placeholder="e.g. 13 yrs, 2 yrs, 6 months, Newborn..."
                />
                <small style={{
                  display: 'block',
                  marginTop: '6px',
                  color: '#9585B0',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                }}>
                  💡 Type any age (e.g. "13 yrs", "2 yrs", "6 months", "All ages")
                </small>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input className="form-control" value={form.tags}
                  onChange={e => set('tags', e.target.value)}
                  placeholder="cotton, newborn, summer" />
              </div>
            </div>

            <div className={styles.card}>
              <h3>👁️ Visibility</h3>
              <div className={styles.checkboxes}>
                {[
                  { key: 'isActive',   label: '✅ Active (visible to customers)' },
                  { key: 'isFeatured', label: '⭐ Featured (shown on home page)'  },
                  { key: 'isTrending', label: '🔥 Trending (shown on home page)'  },
                ].map(({ key, label }) => (
                  <label key={key} className={styles.checkLabel}>
                    <input type="checkbox" checked={form[key]}
                      onChange={e => set(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {uploadedCount > 0 && (
              <div className={styles.card}>
                <h3>📸 Image Preview</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}>
                  {IMAGE_SLOTS.map((slot, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      {form.images[i] ? (
                        <div style={{
                          aspectRatio: '1', borderRadius: '10px',
                          overflow: 'hidden',
                          border: i === 0
                            ? '2px solid #FF6B35'
                            : '2px solid #EDD9FF',
                        }}>
                          <img
                            src={form.images[i].url}
                            alt={slot.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          aspectRatio: '1', borderRadius: '10px',
                          border: '2px dashed #EDD9FF',
                          display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          background: '#FBF7FF', fontSize: '1.2rem',
                        }}>
                          {slot.icon}
                        </div>
                      )}
                      <p style={{
                        fontSize: '0.65rem', fontWeight: '700',
                        color: form.images[i] ? '#22C55E' : '#9585B0',
                        margin: '4px 0 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}>
                        {slot.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.submitRow}>
              <button type="button" className="btn btn-outline" onClick={() => router.back()}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || uploadingSlot !== null}
                style={{ flex: 1 }}
              >
                {loading
                  ? '⏳ Saving...'
                  : uploadingSlot !== null
                    ? '⏳ Uploading image...'
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