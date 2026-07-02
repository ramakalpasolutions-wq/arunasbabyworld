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

const CLOTHING_MATERIALS = [
  'Cotton', 'Organic Cotton', 'Polyester', 'Wool',
  'Fleece', 'Denim', 'Linen', 'Silk', 'Blend',
];

const PRESET_COLORS = [
  { name: 'Red',        hex: '#EF4444' },
  { name: 'Blue',       hex: '#3B82F6' },
  { name: 'Pink',       hex: '#EC4899' },
  { name: 'Yellow',     hex: '#F59E0B' },
  { name: 'Green',      hex: '#10B981' },
  { name: 'Purple',     hex: '#8B5CF6' },
  { name: 'Orange',     hex: '#F97316' },
  { name: 'White',      hex: '#FFFFFF' },
  { name: 'Black',      hex: '#000000' },
  { name: 'Grey',       hex: '#6B7280' },
  { name: 'Brown',      hex: '#92400E' },
  { name: 'Navy',       hex: '#1E3A8A' },
  { name: 'Maroon',     hex: '#7F1D1D' },
  { name: 'Multicolor', hex: '#A855F7' },
  { name: 'Printed',    hex: '#EAB308' },
];

const IMAGE_SLOTS = [
  { key: 'front', label: 'Front', icon: '🖼️', required: true  },
  { key: 'back',  label: 'Back',  icon: '🔄', required: false },
  { key: 'side',  label: 'Side',  icon: '↔️', required: false },
  { key: 'top',   label: 'Top',   icon: '⬆️', required: false },
];

/* ────────────────────────────────────────────────────────────
   IMAGE SLOT — single image uploader
   ──────────────────────────────────────────────────────────── */
function ImageSlot({ slot, image, onUpload, onRemove, uploading, index, accentColor = '#FF6B35' }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onUpload(file, index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        fontSize: '0.70rem', fontWeight: '800', color: '#6B4E8A',
        textTransform: 'uppercase', letterSpacing: '0.3px',
      }}>
        <span>{slot.icon}</span>
        <span>{slot.label}</span>
        {slot.required && (
          <span style={{
            fontSize: '0.55rem', background: accentColor, color: 'white',
            padding: '1px 5px', borderRadius: '999px', fontWeight: '800',
          }}>*</span>
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
            image    ? '#22C55E'  :
            dragOver ? accentColor  :
            slot.required && !image ? accentColor : '#EDD9FF'
          }`,
          borderRadius: '12px',
          background: image ? 'transparent' : dragOver ? '#F3E8FF' : '#FBF7FF',
          cursor: image || uploading ? 'default' : 'pointer',
          position: 'relative', overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={inputRef} type="file"
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
            <img src={image.url} alt={slot.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove(index); }}
              style={{
                position: 'absolute', top: '4px', right: '4px',
                background: 'rgba(220,38,38,0.95)', color: 'white',
                border: 'none', borderRadius: '50%',
                width: '22px', height: '22px',
                fontSize: '0.70rem', fontWeight: '800',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
            <div style={{
              position: 'absolute', bottom: '4px', left: '4px',
              background: '#22C55E', color: 'white',
              width: '18px', height: '18px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: '800',
            }}>✓</div>
          </>
        ) : uploading ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '6px',
          }}>
            <div style={{
              width: '22px', height: '22px',
              border: `3px solid ${accentColor}33`,
              borderTop: `3px solid ${accentColor}`,
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '4px', padding: '8px',
          }}>
            <span style={{ fontSize: '1.4rem' }}>{slot.icon}</span>
            <span style={{
              fontSize: '0.62rem', fontWeight: '700',
              color: '#9585B0', textAlign: 'center',
            }}>{slot.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COLOR VARIANT CARD
   ──────────────────────────────────────────────────────────── */
function ColorVariantCard({
  variant, index, onUpdate, onRemove,
  onUploadImage, onRemoveImage, uploadingSlot,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const set = (key, val) => onUpdate(index, { ...variant, [key]: val });

  const toggleSize = (size) => {
    const sizes = variant.sizes || [];
    if (sizes.includes(size)) {
      set('sizes', sizes.filter(s => s !== size));
    } else {
      set('sizes', [...sizes, size]);
    }
  };

  const handlePickPreset = (preset) => {
    onUpdate(index, { ...variant, colorName: preset.name, colorHex: preset.hex });
    setShowPicker(false);
  };

  const uploadedImages = (variant.images || []).filter(Boolean);

  return (
    <div style={{
      border: `2px solid ${variant.colorHex || '#EDD9FF'}`,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '16px',
      background: 'white',
      boxShadow: `0 4px 16px ${variant.colorHex || '#EDD9FF'}22`,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '14px',
        paddingBottom: '12px',
        borderBottom: `1.5px dashed ${variant.colorHex || '#EDD9FF'}66`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: variant.colorHex || '#ccc',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }} />
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A' }}>
              {variant.colorName || `Color #${index + 1}`}
            </div>
            <div style={{ fontSize: '0.70rem', color: '#9585B0', fontFamily: 'monospace' }}>
              {variant.colorHex || 'No hex'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          style={{
            background: '#FEE2E2', color: '#DC2626',
            border: 'none', padding: '6px 12px',
            borderRadius: '8px', fontSize: '0.78rem',
            fontWeight: '700', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          🗑️ Remove
        </button>
      </div>

      <div className="form-group">
        <label style={{ fontSize: '0.78rem' }}>Color Name & Hex *</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            value={variant.colorName || ''}
            onChange={e => set('colorName', e.target.value)}
            placeholder="e.g. Red, Sky Blue, Baby Pink..."
            style={{ flex: 1 }}
          />
          <input
            type="color"
            value={variant.colorHex || '#000000'}
            onChange={e => set('colorHex', e.target.value)}
            style={{
              width: '44px', height: '40px',
              border: '2px solid #EDD9FF',
              borderRadius: '8px', cursor: 'pointer',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            style={{
              background: '#F3E8FF', color: '#7B2FBE',
              border: 'none', padding: '8px 12px',
              borderRadius: '8px', fontSize: '0.78rem',
              fontWeight: '700', cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            🎨 Pick
          </button>
        </div>

        {showPicker && (
          <div style={{
            marginTop: '10px', padding: '12px',
            background: '#FBF7FF',
            border: '1.5px solid #EDD9FF',
            borderRadius: '10px',
            display: 'flex', flexWrap: 'wrap', gap: '6px',
          }}>
            {PRESET_COLORS.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePickPreset(p)}
                title={p.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 10px',
                  background: 'white',
                  border: `2px solid ${variant.colorHex === p.hex ? '#7B2FBE' : '#EDD9FF'}`,
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: '14px', height: '14px',
                  borderRadius: '50%',
                  background: p.hex,
                  border: '1.5px solid #ddd',
                }} />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.78rem' }}>Price (₹) *</label>
          <input
            type="number"
            className="form-control"
            value={variant.price || ''}
            onChange={e => set('price', e.target.value)}
            placeholder="0.00" min="0" step="0.01"
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.78rem' }}>Discount (₹)</label>
          <input
            type="number"
            className="form-control"
            value={variant.discountPrice || ''}
            onChange={e => set('discountPrice', e.target.value)}
            placeholder="Optional" min="0" step="0.01"
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.78rem' }}>Stock *</label>
          <input
            type="number"
            className="form-control"
            value={variant.stock ?? ''}
            onChange={e => set('stock', e.target.value)}
            placeholder="0" min="0"
          />
        </div>
      </div>

     

      <div className="form-group">
        <label style={{ fontSize: '0.78rem' }}>
          Images for {variant.colorName || 'this color'}
          <span style={{
            marginLeft: '8px', fontSize: '0.70rem',
            background: uploadedImages.length > 0 ? '#22C55E' : '#FFF3EC',
            color: uploadedImages.length > 0 ? 'white' : '#FF6B35',
            padding: '2px 8px', borderRadius: '999px', fontWeight: '700',
          }}>
            {uploadedImages.length}/4 uploaded
          </span>
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px', marginTop: '8px',
        }}>
          {IMAGE_SLOTS.map((slot, slotIdx) => (
            <ImageSlot
              key={slot.key}
              slot={slot}
              image={variant.images?.[slotIdx] || null}
              onUpload={(file, idx) => onUploadImage(index, idx, file)}
              onRemove={(idx) => onRemoveImage(index, idx)}
              uploading={uploadingSlot?.variant === index && uploadingSlot?.slot === slotIdx}
              index={slotIdx}
              accentColor={variant.colorHex || '#FF6B35'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN PRODUCT FORM
   ──────────────────────────────────────────────────────────── */
export default function ProductForm({ id }) {
  const router  = useRouter();
  const isEdit  = !!id;

  const [categories,    setCategories]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [uploadingProductSlot, setUploadingProductSlot] = useState(null);

  const [selectedCatSlug, setSelectedCatSlug] = useState('');
  const isClothing = selectedCatSlug?.toLowerCase().includes('cloth') ||
                     selectedCatSlug?.toLowerCase().includes('apparel') ||
                     selectedCatSlug?.toLowerCase().includes('wear');

  const [form, setForm] = useState({
    name:             '',
    description:      '',
    shortDescription: '',
    // ✅ Simple product pricing (used only when NO variants)
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
    gender:           '',
    material:         '',

    // Product-level images (4 slots)
    productImages: [null, null, null, null],

    colorVariants: [],
  });

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

          const viewNames = ['front', 'back', 'side', 'top'];
          const existingImages = [null, null, null, null];
          (p.images || []).forEach((img, i) => {
            const slotIdx = viewNames.indexOf(img.type || img.view);
            const idx = slotIdx !== -1 ? slotIdx : i;
            if (idx < 4) {
              existingImages[idx] = {
                url: img.url,
                publicId: img.publicId,
                view: viewNames[idx],
              };
            }
          });

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
            gender:           p.gender           || '',
            material:         p.material         || '',
            productImages:    existingImages,
            colorVariants:    p.colorVariants    || [],
          });

          const cat = p.category;
          if (cat) setSelectedCatSlug(cat.slug || cat.name || '');
        });
    }
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleCategoryChange = (catId) => {
    set('categoryId', catId);
    const cat = categories.find(c => c.id === catId);
    setSelectedCatSlug(cat?.slug || cat?.name || '');
  };

  /* ── Color Variants Management ── */
  const addVariant = () => {
    const newVariant = {
      colorName:     '',
      colorHex:      '#FF6B35',
      price:         form.price || '',
      discountPrice: '',
      stock:         0,
      sizes:         [],
      images:        [null, null, null, null],
    };
    setForm(f => ({ ...f, colorVariants: [...f.colorVariants, newVariant] }));
    toast.success('🎨 New color added! Fill in the details.');
  };

  const updateVariant = (index, updated) => {
    setForm(f => {
      const variants = [...f.colorVariants];
      variants[index] = updated;
      return { ...f, colorVariants: variants };
    });
  };

  const removeVariant = (index) => {
    if (!confirm(`Remove "${form.colorVariants[index]?.colorName || 'this color'}"?`)) return;
    setForm(f => ({
      ...f,
      colorVariants: f.colorVariants.filter((_, i) => i !== index),
    }));
    toast.success('Color removed');
  };

  /* ── Variant image upload ── */
  const handleVariantImageUpload = async (variantIdx, slotIdx, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB');
      return;
    }

    setUploadingSlot({ variant: variantIdx, slot: slotIdx });
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/products');

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploaded = data.images?.[0] || { url: data.url, publicId: data.publicId };
      if (!uploaded?.url) throw new Error('No image URL');

      const viewNames = ['front', 'back', 'side', 'top'];
      const imageObj = {
        url: uploaded.url,
        publicId: uploaded.publicId || '',
        view: viewNames[slotIdx],
      };

      setForm(f => {
        const variants = [...f.colorVariants];
        const images = [...(variants[variantIdx].images || [null, null, null, null])];
        images[slotIdx] = imageObj;
        variants[variantIdx] = { ...variants[variantIdx], images };
        return { ...f, colorVariants: variants };
      });

      toast.success(`${viewNames[slotIdx]} view uploaded! ✅`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleVariantImageRemove = (variantIdx, slotIdx) => {
    setForm(f => {
      const variants = [...f.colorVariants];
      const images = [...(variants[variantIdx].images || [null, null, null, null])];
      images[slotIdx] = null;
      variants[variantIdx] = { ...variants[variantIdx], images };
      return { ...f, colorVariants: variants };
    });
  };

  /* ── Product-level image upload ── */
  const handleProductImageUpload = async (slotIdx, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB');
      return;
    }

    setUploadingProductSlot(slotIdx);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/products');

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploaded = data.images?.[0] || { url: data.url, publicId: data.publicId };
      if (!uploaded?.url) throw new Error('No image URL');

      const viewNames = ['front', 'back', 'side', 'top'];
      const imageObj = {
        url: uploaded.url,
        publicId: uploaded.publicId || '',
        view: viewNames[slotIdx],
      };

      setForm(f => {
        const images = [...f.productImages];
        images[slotIdx] = imageObj;
        return { ...f, productImages: images };
      });

      toast.success(`${viewNames[slotIdx]} view uploaded! ✅`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingProductSlot(null);
    }
  };

  const handleProductImageRemove = (slotIdx) => {
    setForm(f => {
      const images = [...f.productImages];
      images[slotIdx] = null;
      return { ...f, productImages: images };
    });
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.categoryId || !form.description) {
      toast.error('Please fill: Name, Category & Description');
      return;
    }

    const hasVariants = form.colorVariants.length > 0;
    const productImagesUploaded = form.productImages.filter(Boolean);

    if (!hasVariants && productImagesUploaded.length === 0) {
      toast.error('Please add color variants OR upload product images');
      return;
    }

    // If NO variants → product images + price + stock required
    if (!hasVariants) {
      if (!form.productImages[0]) {
        toast.error('Please upload at least the Front product image');
        return;
      }
      if (!form.price || parseFloat(form.price) <= 0) {
        toast.error('Price is required');
        return;
      }
      if (form.stock === '' || form.stock === null) {
        toast.error('Stock is required');
        return;
      }
    }

    // If variants exist → validate each
    if (hasVariants) {
      for (let i = 0; i < form.colorVariants.length; i++) {
        const v = form.colorVariants[i];
        if (!v.colorName?.trim()) {
          toast.error(`Color #${i + 1}: Name is required`);
          return;
        }
        if (!v.price || parseFloat(v.price) <= 0) {
          toast.error(`${v.colorName}: Price is required`);
          return;
        }
        if (v.stock === '' || v.stock === null || v.stock === undefined) {
          toast.error(`${v.colorName}: Stock is required`);
          return;
        }
        if (!v.images || !v.images[0]) {
          toast.error(`${v.colorName}: Please upload at least the Front image`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      let finalImages;
      if (hasVariants) {
        const firstVariantImages = form.colorVariants[0]?.images?.filter(Boolean) || [];
        finalImages = firstVariantImages.map(img => ({
          url:      img.url,
          publicId: img.publicId,
          type:     img.view,
        }));
      } else {
        finalImages = productImagesUploaded.map(img => ({
          url:      img.url,
          publicId: img.publicId,
          type:     img.view,
        }));
      }

      // ✅ Auto price/stock from variants if available
      let basePrice, baseDiscount, baseStock;
      if (hasVariants) {
        const variantPrices = form.colorVariants.map(v => parseFloat(v.price) || 0);
        basePrice = Math.min(...variantPrices);
        // Use first variant's discount if it exists
        baseDiscount = form.colorVariants[0]?.discountPrice
          ? parseFloat(form.colorVariants[0].discountPrice)
          : null;
        baseStock = form.colorVariants.reduce(
          (sum, v) => sum + (parseInt(v.stock) || 0), 0
        );
      } else {
        basePrice = parseFloat(form.price);
        baseDiscount = form.discountPrice ? parseFloat(form.discountPrice) : null;
        baseStock = parseInt(form.stock) || 0;
      }

      const payload = {
        name:             form.name,
        description:      form.description,
        shortDescription: form.shortDescription || null,
        price:            basePrice,
        discountPrice:    baseDiscount,
        stock:            baseStock,
        brand:            form.brand    || null,
        categoryId:       form.categoryId,
        ageGroup:         form.ageGroup || null,
        tags:             form.tags.split(',').map(t => t.trim()).filter(Boolean),
        features:         form.features.split('\n').map(f => f.trim()).filter(Boolean),
        isFeatured:       form.isFeatured,
        isTrending:       form.isTrending,
        isActive:         form.isActive,
        images:           finalImages,
        gender:           form.gender   || null,
        material:         form.material || null,

        colorVariants: form.colorVariants.map(v => ({
          colorName:     v.colorName,
          colorHex:      v.colorHex,
          price:         parseFloat(v.price),
          discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
          stock:         parseInt(v.stock) || 0,
          sizes:         v.sizes || [],
          images:        (v.images || []).filter(Boolean),
        })),
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

  const predefinedCats = categories.filter(c => CATEGORY_ORDER.includes(c.slug));
  const customCats     = categories.filter(c => !CATEGORY_ORDER.includes(c.slug));

  const totalStock = form.colorVariants.reduce(
    (sum, v) => sum + (parseInt(v.stock) || 0), 0
  );

  const hasVariants = form.colorVariants.length > 0;
  const productImagesUploaded = form.productImages.filter(Boolean).length;

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

            {/* Basic Info */}
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

            {/* ✅ PRODUCT IMAGES + PRICING (shown when NO variants) */}
            {!hasVariants && (
              <div className={styles.card} style={{
                border: '2px solid #FF6B35',
                background: 'linear-gradient(135deg, #FFF8F3, #FFF)',
              }}>
                <h3 style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FF6B35',
                }}>
                  <span>🖼️ Product Images & Pricing *</span>
                  <span style={{
                    fontSize: '0.72rem',
                    background: productImagesUploaded > 0 ? '#22C55E' : '#FFF3EC',
                    color: productImagesUploaded > 0 ? 'white' : '#FF6B35',
                    padding: '4px 10px', borderRadius: '999px', fontWeight: '700',
                  }}>
                    {productImagesUploaded}/4 images
                  </span>
                </h3>
                <p style={{
                  fontSize: '0.76rem', color: '#9585B0',
                  fontWeight: '600', marginTop: '-6px',
                }}>
                  💡 Upload product images, set price & stock.
                  Add color variants below only if this product has multiple colors.
                </p>

                {/* Image Slots */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px', marginTop: '14px', marginBottom: '18px',
                }}>
                  {IMAGE_SLOTS.map((slot, slotIdx) => (
                    <ImageSlot
                      key={slot.key}
                      slot={slot}
                      image={form.productImages[slotIdx] || null}
                      onUpload={(file, idx) => handleProductImageUpload(idx, file)}
                      onRemove={(idx) => handleProductImageRemove(idx)}
                      uploading={uploadingProductSlot === slotIdx}
                      index={slotIdx}
                      accentColor="#FF6B35"
                    />
                  ))}
                </div>

                {/* Price + Discount + Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem' }}>Price (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem' }}>Discount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.discountPrice}
                      onChange={e => set('discountPrice', e.target.value)}
                      placeholder="Optional"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem' }}>Stock *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.stock}
                      onChange={e => set('stock', e.target.value)}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {form.price && form.discountPrice && (
                  <div className={styles.discountPreview} style={{ marginTop: '10px' }}>
                    🏷️ Discount: <strong>
                      {Math.round(((form.price - form.discountPrice) / form.price) * 100)}% off
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Warning if both exist */}
            {hasVariants && productImagesUploaded > 0 && (
              <div style={{
                padding: '14px 18px',
                background: '#FEF3C7',
                border: '2px solid #F59E0B',
                borderRadius: '12px',
                fontSize: '0.82rem',
                color: '#92400E',
                fontWeight: '600',
              }}>
                ℹ️ You have both product images AND color variants.
                Color variant images will be used instead.
              </div>
            )}

            {/* COLOR VARIANTS */}
            <div className={styles.card} style={{
              border: '2px solid #7B2FBE',
              background: 'linear-gradient(135deg, #FBF7FF, #FFF)',
            }}>
              <h3 style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                color: '#7B2FBE',
              }}>
                <span>🎨 Color Variants ({form.colorVariants.length})</span>
                <button
                  type="button"
                  onClick={addVariant}
                  style={{
                    background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)',
                    color: 'white', border: 'none',
                    padding: '8px 16px', borderRadius: '10px',
                    fontSize: '0.82rem', fontWeight: '700',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 12px rgba(123,47,190,0.3)',
                  }}
                >
                  + Add Color
                </button>
              </h3>

              {form.colorVariants.length === 0 ? (
                <div style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: '#FBF7FF',
                  border: '2px dashed #EDD9FF',
                  borderRadius: '12px',
                  marginTop: '12px',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎨</div>
                  <p style={{
                    fontSize: '0.88rem', fontWeight: '700',
                    color: '#6B4E8A', margin: '0 0 6px',
                  }}>
                    No color variants (optional)
                  </p>
                  <p style={{
                    fontSize: '0.74rem', color: '#9585B0',
                    marginBottom: '14px',
                  }}>
                    Skip this if your product has only one color.
                    Add colors if you have multiple color options.
                  </p>
                  <button
                    type="button"
                    onClick={addVariant}
                    style={{
                      background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
                      color: 'white', border: 'none',
                      padding: '9px 22px', borderRadius: '999px',
                      fontSize: '0.84rem', fontWeight: '700',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    + Add Color Variant
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '14px' }}>
                  {form.colorVariants.map((variant, i) => (
                    <ColorVariantCard
                      key={i}
                      variant={variant}
                      index={i}
                      onUpdate={updateVariant}
                      onRemove={removeVariant}
                      onUploadImage={handleVariantImageUpload}
                      onRemoveImage={handleVariantImageRemove}
                      uploadingSlot={uploadingSlot}
                    />
                  ))}

                  <div style={{
                    marginTop: '12px', padding: '14px 18px',
                    background: 'linear-gradient(135deg,#F0FDF4,#FBF7FF)',
                    border: '2px solid #BBF7D0',
                    borderRadius: '12px',
                    display: 'flex', flexWrap: 'wrap', gap: '14px',
                    fontSize: '0.84rem', fontWeight: '700',
                  }}>
                    <span style={{ color: '#166534' }}>
                      🎨 {form.colorVariants.length} color(s)
                    </span>
                    <span style={{ color: '#166534' }}>
                      📦 Total stock: {totalStock} units
                    </span>
                    <span style={{ color: '#166534' }}>
                      💰 Price range: ₹{Math.min(...form.colorVariants.map(v => parseFloat(v.price) || 0))} – ₹{Math.max(...form.colorVariants.map(v => parseFloat(v.price) || 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Clothing Common Fields */}
            {isClothing && (
              <div className={styles.card} style={{
                border: '2px solid #FF6B35', borderRadius: '16px',
              }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF6B35' }}>
                  👗 Clothing Details
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
                          fontFamily: 'inherit',
                        }}>{g.label}</button>
                    ))}
                  </div>
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
                          fontFamily: 'inherit',
                        }}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className={styles.col}>

            {/* ✅ Summary Card (replaces Default Pricing) */}
            {hasVariants && (
              <div className={styles.card} style={{
                border: '2px solid #22C55E',
                background: 'linear-gradient(135deg,#F0FDF4,#FFF)',
              }}>
                <h3 style={{ color: '#166534' }}>📊 Product Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '0.85rem', fontWeight: '700',
                  }}>
                    <span style={{ color: '#6B4E8A' }}>🎨 Colors:</span>
                    <span style={{ color: '#166534' }}>{form.colorVariants.length}</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '0.85rem', fontWeight: '700',
                  }}>
                    <span style={{ color: '#6B4E8A' }}>📦 Total Stock:</span>
                    <span style={{ color: '#166534' }}>{totalStock} units</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '0.85rem', fontWeight: '700',
                  }}>
                    <span style={{ color: '#6B4E8A' }}>💰 Price Range:</span>
                    <span style={{ color: '#166534' }}>
                      ₹{Math.min(...form.colorVariants.map(v => parseFloat(v.price) || 0))} – ₹{Math.max(...form.colorVariants.map(v => parseFloat(v.price) || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input className="form-control" value={form.brand}
                  onChange={e => set('brand', e.target.value)} placeholder="Brand name" />
              </div>

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
                  display: 'block', marginTop: '6px',
                  color: '#9585B0', fontSize: '0.72rem', fontWeight: '600',
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

            <div className={styles.submitRow}>
              <button type="button" className="btn btn-outline" onClick={() => router.back()}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || uploadingSlot !== null || uploadingProductSlot !== null}
                style={{ flex: 1 }}
              >
                {loading
                  ? '⏳ Saving...'
                  : (uploadingSlot !== null || uploadingProductSlot !== null)
                    ? '⏳ Uploading...'
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