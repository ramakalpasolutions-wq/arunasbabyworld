'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AGE_GROUPS = [
  '0-3 months', '3-6 months', '6-12 months', '1-2 years',
  '2-3 years', '3-5 years', '5-8 years', '8-12 years', '12+ years', 'All ages',
];

const GENDERS   = [
  { value: 'boy', label: 'Boy' },
  { value: 'girl', label: 'Girl' },
  { value: 'unisex', label: 'Unisex' },
];
const COLORS    = ['Red','Blue','Green','Yellow','Pink','Purple','Orange','White','Black','Grey','Brown','Navy','Maroon','Multicolor','Printed'];
const MATERIALS = ['Cotton','Organic Cotton','Polyester','Wool','Fleece','Denim','Linen','Silk','Blend'];

// ✅ 4 image slot definitions
const IMAGE_SLOTS = [
  { key: 'front', label: 'Front', icon: '🖼️' },
  { key: 'back',  label: 'Back',  icon: '🔄' },
  { key: 'side',  label: 'Side',  icon: '↔️' },
  { key: 'top',   label: 'Top',   icon: '⬆️' },
];

const inputStyle = {
  width: '100%', padding: '8px 10px',
  border: '1px solid #EDD9FF', borderRadius: '8px',
  fontSize: '13px', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit',
};
const labelStyle = {
  fontSize: '11px', fontWeight: '700', color: '#666',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  display: 'block', marginBottom: '4px',
};
const selectStyle = {
  width: '100%', padding: '8px 10px',
  border: '1px solid #EDD9FF', borderRadius: '8px',
  fontSize: '13px', boxSizing: 'border-box',
  outline: 'none', background: 'white',
  cursor: 'pointer', fontFamily: 'inherit',
};

export default function BulkUploadClient() {
  const router   = useRouter();
  const inputRef = useRef(null);

  const [categories,       setCategories]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saving,           setSaving]           = useState(false);
  const [dragOver,         setDragOver]         = useState(false);
  const [products,         setProducts]         = useState([]);

  // Track which slot of which product is uploading
  // Format: { productId, slotIndex }
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const selectedCat     = categories.find(c => c.id === selectedCategory);
  const selectedCatName = selectedCat?.name || '';
  const isClothingCat   = selectedCat?.slug?.toLowerCase().includes('cloth') ||
                          selectedCat?.name?.toLowerCase().includes('cloth');

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));
  }, []);

  /* ── Handle initial bulk image drop/select
       Each image → 1 product (with 4 slots, first slot filled) ── */
  const handleFiles = async (files) => {
    if (!selectedCategory) {
      toast.error('Please select a category first!');
      return;
    }

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) { toast.error('Please select image files only'); return; }

    const toastId = toast.loading(`Uploading ${imageFiles.length} images...`);

    try {
      const fd = new FormData();
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} too large`); continue; }
        fd.append('file', file);
      }
      fd.append('folder', 'firstcry/products');

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploadedImages = data.images || [];
      if (!uploadedImages.length) { toast.error('No images uploaded'); return; }

      // ✅ Each image = 1 product, placed in FRONT slot (index 0)
      const newProducts = uploadedImages.map((img, i) => ({
        id:               `${Date.now()}-${i}`,
        name:             '',
        price:            '',
        discountPrice:    '',
        stock:            '',
        shortDescription: '',
        brand:            '',
        ageGroup:         '',
        gender:           '',
        size:             '',
        color:            '',
        material:         '',
        isFeatured:       false,
        isTrending:       false,
        isActive:         true,
        // ✅ 4 slots — first filled, rest empty
        images:           [img, null, null, null],
      }));

      setProducts(prev => [...prev, ...newProducts]);
      toast.success(`${uploadedImages.length} products created! Add more views & details below.`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Upload failed');
    }
  };

  /* ── Upload additional slot image for a product ── */
  const handleSlotUpload = async (productId, slotIndex, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    setUploadingSlot({ productId, slotIndex });
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/products');

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploaded = data.images?.[0] || { url: data.url, publicId: data.publicId };

      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p;
        const newImages = [...p.images];
        newImages[slotIndex] = uploaded;
        return { ...p, images: newImages };
      }));

      const slotNames = ['Front','Back','Side','Top'];
      toast.success(`${slotNames[slotIndex]} view uploaded! ✅`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  };

  /* ── Remove a slot image ── */
  const handleSlotRemove = (productId, slotIndex) => {
    // Don't allow removing front (index 0) if it's the only image
    if (slotIndex === 0) {
      toast.error('Cannot remove main image. Delete the product instead.');
      return;
    }
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const newImages = [...p.images];
      newImages[slotIndex] = null;
      return { ...p, images: newImages };
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateProduct = (id, key, value) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));

  const removeProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Removed');
  };

  const handleSaveAll = async () => {
    if (!selectedCategory) { toast.error('Please select a category'); return; }
    if (!products.length)   { toast.error('No products to save');     return; }

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name)      { toast.error(`Product #${i + 1}: Name required`);  return; }
      if (!p.price)     { toast.error(`Product #${i + 1}: Price required`); return; }
      if (!p.stock)     { toast.error(`Product #${i + 1}: Stock required`); return; }
      if (!p.images[0]) { toast.error(`Product #${i + 1}: Front image missing`); return; }
      if (isClothingCat && !p.gender) {
        toast.error(`Product #${i + 1}: Gender required`); return;
      }
      if (isClothingCat && !p.size) {
        toast.error(`Product #${i + 1}: Size required`); return;
      }
    }

    setSaving(true);
    const toastId = toast.loading(`Saving ${products.length} products...`);

    try {
      const payload = {
        categoryId: selectedCategory,
        products: products.map(p => ({
          name:             p.name,
          shortDescription: p.shortDescription || null,
          price:            parseFloat(p.price),
          discountPrice:    p.discountPrice ? parseFloat(p.discountPrice) : null,
          stock:            parseInt(p.stock),
          brand:            p.brand    || null,
          ageGroup:         p.ageGroup || null,
          gender:           p.gender   || null,
          size:             p.size     || null,
          color:            p.color    || null,
          material:         p.material || null,
          isFeatured:       p.isFeatured,
          isTrending:       p.isTrending,
          isActive:         p.isActive,
          // ✅ Filter out null slots
          images:           p.images.filter(Boolean),
          tags:             [],
          features:         [],
        })),
      };

      const res  = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok) throw new Error(data.error || 'Save failed');

      toast.success(`${data.saved} products saved!`);
      if (data.failed > 0) toast.error(`${data.failed} products failed`);
      setProducts([]);
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      padding: '24px', maxWidth: '1200px',
      margin: '0 auto', fontFamily: "'Nunito', sans-serif",
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>
            📦 Bulk Product Upload
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '14px' }}>
            Each image = 1 product. Add up to 4 views per product (Front, Back, Side, Top)
          </p>
        </div>
        <button onClick={() => router.push('/admin/products')} style={{
          padding: '8px 20px', border: '2px solid #EDD9FF', borderRadius: '10px',
          background: 'white', cursor: 'pointer', fontSize: '14px',
          fontWeight: '600', color: '#6B4E8A', fontFamily: 'inherit',
        }}>
          ← Back to Products
        </button>
      </div>

      {/* Step 1 — Category */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        marginBottom: '20px', boxShadow: '0 2px 12px rgba(123,47,190,0.08)',
        border: selectedCategory ? '2px solid #22C55E' : '2px solid #EDD9FF',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#2D1A4A' }}>
          Step 1 — Select Category
        </h3>
        <p style={{ color: '#9585B0', fontSize: '13px', margin: '0 0 16px' }}>
          All uploaded products will go into this category
        </p>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          style={{ ...selectStyle, maxWidth: '400px', padding: '12px 16px', fontSize: '15px', border: '2px solid #EDD9FF' }}>
          <option value="">-- Select Category --</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
          ))}
        </select>

        {selectedCategory && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              padding: '5px 16px',
              background: 'linear-gradient(135deg,#FFF3EC,#F3E8FF)',
              border: '1.5px solid #EDD9FF', borderRadius: '999px',
              fontSize: '13px', fontWeight: '700', color: '#FF6B35',
            }}>
              ✅ {selectedCatName}
            </span>
            {isClothingCat && (
              <span style={{
                padding: '5px 16px', background: '#FFF3EC',
                border: '1.5px solid #FFD4B8', borderRadius: '999px',
                fontSize: '12px', fontWeight: '700', color: '#FF6B35',
              }}>
                👗 Clothing — Gender & Size required
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 2 — Upload Front Images */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        marginBottom: '20px', boxShadow: '0 2px 12px rgba(123,47,190,0.08)',
        border: products.length > 0 ? '2px solid #22C55E' : '2px solid #EDD9FF',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#2D1A4A' }}>
          Step 2 — Upload Product Front Images
        </h3>
        <p style={{ color: '#9585B0', fontSize: '13px', margin: '0 0 16px' }}>
          Select multiple images. Each image = 1 product (Front view). You can add Back/Side/Top later.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#7B2FBE' : '#FF6B35'}`,
            borderRadius: '16px', padding: '48px 24px',
            textAlign: 'center',
            background: dragOver ? '#F3E8FF' : '#FFF9F5',
            cursor: 'pointer', transition: 'all 0.3s',
          }}
        >
          <input ref={inputRef} type="file" multiple accept="image/*"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }} />

          <p style={{ fontWeight: '800', fontSize: '18px', margin: '0 0 8px', color: '#2D1A4A' }}>
            📤 Drag & Drop Front Images Here
          </p>
          <p style={{ color: '#9585B0', fontSize: '14px', margin: '0 0 20px' }}>
            Each image becomes 1 product in{' '}
            <strong style={{ color: '#FF6B35' }}>{selectedCatName || 'selected category'}</strong>
          </p>
          <button type="button"
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
            style={{
              background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
              color: 'white', border: 'none', padding: '12px 32px',
              borderRadius: '12px', fontSize: '15px', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Browse Images
          </button>
          <p style={{ color: '#C8B8DC', fontSize: '12px', marginTop: '12px' }}>
            PNG, JPG, WEBP — Max 5MB each
          </p>
        </div>
      </div>

      {/* Step 3 — Fill Details */}
      {products.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '24px',
          boxShadow: '0 2px 12px rgba(123,47,190,0.08)', border: '2px solid #EDD9FF',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#2D1A4A' }}>
                Step 3 — Fill Details & Add More Views
              </h3>
              <p style={{ color: '#9585B0', fontSize: '13px', margin: 0 }}>
                {products.length} products — Add Back, Side, Top views for each product
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setProducts([])} style={{
                padding: '8px 16px', border: '2px solid #ff4444',
                color: '#ff4444', borderRadius: '10px', background: 'white',
                cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit',
              }}>
                Clear All
              </button>
              <button onClick={handleSaveAll} disabled={saving} style={{
                padding: '10px 24px',
                background: saving ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {saving ? 'Saving...' : `💾 Save All ${products.length} Products`}
              </button>
            </div>
          </div>

          {/* Product Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {products.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                index={idx}
                isClothingCat={isClothingCat}
                selectedCatName={selectedCatName}
                uploadingSlot={uploadingSlot}
                onUpdate={updateProduct}
                onRemove={removeProduct}
                onSlotUpload={handleSlotUpload}
                onSlotRemove={handleSlotRemove}
              />
            ))}
          </div>

          {/* Bottom Save */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button onClick={handleSaveAll} disabled={saving} style={{
              padding: '14px 48px',
              background: saving ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontSize: '16px', fontWeight: '800',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              boxShadow: saving ? 'none' : '0 6px 20px rgba(255,107,53,0.30)',
            }}>
              {saving ? 'Saving...' : `💾 Save All ${products.length} Products`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Product Card Component ── */
function ProductCard({
  product, index, isClothingCat, selectedCatName,
  uploadingSlot, onUpdate, onRemove, onSlotUpload, onSlotRemove,
}) {
  const slotInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const uploadedCount = product.images.filter(Boolean).length;

  return (
    <div style={{
      border: '2px solid #EDD9FF', borderRadius: '20px',
      overflow: 'hidden', background: '#FDFBFF',
      boxShadow: '0 2px 16px rgba(123,47,190,0.08)',
      width: '100%',
      minWidth: 0,
    }}>
      {/* Card Header */}
      <div style={{
        background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          flexWrap: 'wrap', flex: 1, minWidth: 0,
        }}>
          <span style={{
            background: 'white', color: '#FF6B35',
            width: '28px', height: '28px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '800',
            flexShrink: 0,
          }}>
            {index + 1}
          </span>
          <span style={{
            color: 'white', fontWeight: '700', fontSize: '14px',
            wordBreak: 'break-word',
          }}>
            {product.name || `Product #${index + 1}`}
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '2px 10px', borderRadius: '999px',
            fontSize: '11px', fontWeight: '700',
          }}>
            {selectedCatName}
          </span>
        </div>
        <button onClick={() => onRemove(product.id)} style={{
          background: 'rgba(220,38,38,0.85)', color: 'white',
          border: 'none', padding: '4px 12px', borderRadius: '8px',
          cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit',
          flexShrink: 0,
        }}>
          🗑️ Remove
        </button>
      </div>

      <div style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
          width: '100%',
          minWidth: 0,
        }}>

          {/* ── LEFT: 4 Image Slots ── */}
          <div style={{ minWidth: 0, width: '100%' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '12px',
            }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#2D1A4A' }}>
                🖼️ Product Images
              </h4>
              <span style={{
                fontSize: '11px', fontWeight: '700',
                color: uploadedCount === 4 ? '#22C55E' : '#9585B0',
              }}>
                {uploadedCount}/4 views
              </span>
            </div>

            {/* 4 slots grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              maxWidth: '400px',
            }}>
              {IMAGE_SLOTS.map((slot, i) => {
                const isUploading = uploadingSlot?.productId === product.id &&
                                    uploadingSlot?.slotIndex === i;
                const img = product.images[i];

                return (
                  <div key={slot.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    {/* Label */}
                    <div style={{
                      fontSize: '10px', fontWeight: '800', color: '#9585B0',
                      textTransform: 'uppercase', textAlign: 'center',
                      letterSpacing: '0.3px',
                    }}>
                      {slot.icon} {slot.label}
                      {i === 0 && (
                        <span style={{
                          display: 'block', fontSize: '8px',
                          color: '#FF6B35', fontWeight: '800',
                        }}>★ Main</span>
                      )}
                    </div>

                    {/* Slot Box */}
                    <input
                      ref={slotInputRefs[i]}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={i === 0 || isUploading}
                      onChange={e => {
                        if (e.target.files[0]) onSlotUpload(product.id, i, e.target.files[0]);
                        e.target.value = '';
                      }}
                    />

                    <div
                      onClick={() => {
                        if (i === 0) return;
                        if (!img && !isUploading) slotInputRefs[i].current?.click();
                      }}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '10px',
                        border: `2px ${img ? 'solid' : 'dashed'} ${
                          i === 0    ? '#FF6B35' :
                          img        ? '#22C55E' :
                          isUploading ? '#7B2FBE' : '#EDD9FF'
                        }`,
                        background: img
                          ? 'transparent'
                          : isUploading ? '#F3E8FF' : '#FBF7FF',
                        cursor: i === 0 ? 'default' : img ? 'default' : 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                      }}
                    >
                      {img ? (
                        <>
                          <img src={img.url} alt={slot.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          {i !== 0 && (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); onSlotRemove(product.id, i); }}
                              style={{
                                position: 'absolute', top: '2px', right: '2px',
                                background: 'rgba(220,38,38,0.85)', color: 'white',
                                border: 'none', width: '18px', height: '18px',
                                borderRadius: '50%', cursor: 'pointer',
                                fontSize: '9px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'inherit',
                              }}
                            >✕</button>
                          )}
                          {i === 0 && (
                            <div style={{
                              position: 'absolute', bottom: '2px', right: '2px',
                              background: '#22C55E', color: 'white',
                              width: '16px', height: '16px', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '9px', fontWeight: '800',
                            }}>✓</div>
                          )}
                        </>
                      ) : isUploading ? (
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', height: '100%',
                        }}>
                          <div style={{
                            width: '18px', height: '18px',
                            border: '2px solid rgba(123,47,190,0.2)',
                            borderTop: '2px solid #7B2FBE',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                          }} />
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          height: '100%', gap: '2px',
                        }}>
                          <span style={{ fontSize: '1rem' }}>{slot.icon}</span>
                          {i !== 0 && (
                            <span style={{ fontSize: '8px', color: '#9585B0', fontWeight: '700' }}>
                              + Add
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', maxWidth: '400px' }}>
              {IMAGE_SLOTS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '4px', borderRadius: '999px',
                  background: product.images[i] ? '#22C55E' : '#EDD9FF',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          </div>

          {/* ── RIGHT: Product Details ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '10px',
            minWidth: 0,
            width: '100%',
          }}>

            {/* Name */}
            <div style={{ minWidth: 0 }}>
              <label style={labelStyle}>Product Name *</label>
              <input value={product.name}
                onChange={e => onUpdate(product.id, 'name', e.target.value)}
                placeholder="e.g. Baby Cotton T-Shirt"
                style={{ ...inputStyle, border: !product.name ? '1px solid #ff4444' : '1px solid #EDD9FF' }} />
            </div>

            {/* Short Description */}
            <div style={{ minWidth: 0 }}>
              <label style={labelStyle}>Short Description</label>
              <input value={product.shortDescription}
                onChange={e => onUpdate(product.id, 'shortDescription', e.target.value)}
                placeholder="Brief description"
                style={{ ...inputStyle, border: '1px solid #EDD9FF' }} />
            </div>

            {/* Price & Discount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', minWidth: 0 }}>
              <div style={{ minWidth: 0 }}>
                <label style={labelStyle}>Price (₹) *</label>
                <input type="number" value={product.price}
                  onChange={e => onUpdate(product.id, 'price', e.target.value)}
                  placeholder="0" min="0"
                  style={{ ...inputStyle, border: !product.price ? '1px solid #ff4444' : '1px solid #EDD9FF' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={labelStyle}>Discount (₹)</label>
                <input type="number" value={product.discountPrice}
                  onChange={e => onUpdate(product.id, 'discountPrice', e.target.value)}
                  placeholder="Optional" min="0"
                  style={{ ...inputStyle, border: '1px solid #EDD9FF' }} />
              </div>
            </div>

            {/* Stock & Brand */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', minWidth: 0 }}>
              <div style={{ minWidth: 0 }}>
                <label style={labelStyle}>Stock *</label>
                <input type="number" value={product.stock}
                  onChange={e => onUpdate(product.id, 'stock', e.target.value)}
                  placeholder="0" min="0"
                  style={{ ...inputStyle, border: !product.stock ? '1px solid #ff4444' : '1px solid #EDD9FF' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={labelStyle}>Brand</label>
                <input value={product.brand}
                  onChange={e => onUpdate(product.id, 'brand', e.target.value)}
                  placeholder="Brand name"
                  style={{ ...inputStyle, border: '1px solid #EDD9FF' }} />
              </div>
            </div>

            {/* Age Group — Free text input */}
            <div style={{ minWidth: 0 }}>
              <label style={labelStyle}>Age Group</label>
              <input
                type="text"
                value={product.ageGroup}
                onChange={e => onUpdate(product.id, 'ageGroup', e.target.value)}
                placeholder="e.g. 13 yrs, 2 yrs, 6 months, Newborn..."
                list={`age-suggestions-${product.id}`}
                style={{ ...inputStyle, border: '1px solid #EDD9FF' }}
              />
              <datalist id={`age-suggestions-${product.id}`}>
                <option value="Newborn" />
                <option value="0-3 months" />
                <option value="3-6 months" />
                <option value="6-12 months" />
                <option value="1 year" />
                <option value="2 years" />
                <option value="3 years" />
                <option value="5 years" />
                <option value="8 years" />
                <option value="10 years" />
                <option value="12+ years" />
                <option value="All ages" />
              </datalist>
              <small style={{
                display: 'block', marginTop: '4px',
                color: '#9585B0', fontSize: '10px', fontWeight: '600',
              }}>
                💡 Type any age (e.g. "13 yrs", "2.5 years", "6 months")
              </small>
            </div>

            {/* Clothing Fields */}
            {isClothingCat && (
              <div style={{
                background: 'linear-gradient(135deg,#FFF3EC,#F3E8FF)',
                border: '1.5px solid #EDD9FF', borderRadius: '12px',
                padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
                minWidth: 0,
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#FF6B35', textTransform: 'uppercase' }}>
                  👗 Clothing Details
                </div>

                {/* Gender */}
                <div style={{ minWidth: 0 }}>
                  <label style={labelStyle}>Gender *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {GENDERS.map(g => (
                      <button key={g.value} type="button"
                        onClick={() => onUpdate(product.id, 'gender', g.value)}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: '8px', border: '1.5px solid',
                          borderColor: product.gender === g.value ? '#FF6B35' : '#EDD9FF',
                          background: product.gender === g.value
                            ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)' : 'white',
                          color: product.gender === g.value ? 'white' : '#6B4E8A',
                          fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                          transition: 'all 0.2s', fontFamily: 'inherit',
                        }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div style={{ minWidth: 0 }}>
                  <label style={labelStyle}>Size *</label>
                  <select value={product.size}
                    onChange={e => onUpdate(product.id, 'size', e.target.value)}
                    style={{
                      ...selectStyle,
                      border: isClothingCat && !product.size ? '1px solid #ff4444' : '1px solid #EDD9FF',
                    }}>
                    <option value="">Select Size</option>
                    <optgroup label="Baby Sizes">
                      {['0-3M','3-6M','6-9M','6-12M','12-18M','18-24M'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Kids Sizes">
                      {['1Y','2Y','3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Standard">
                      {['XS','S','M','L','XL','XXL','Free Size'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Color & Material */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <label style={labelStyle}>Color</label>
                    <select value={product.color}
                      onChange={e => onUpdate(product.id, 'color', e.target.value)}
                      style={{ ...selectStyle, border: '1px solid #EDD9FF' }}>
                      <option value="">Color</option>
                      {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label style={labelStyle}>Material</label>
                    <select value={product.material}
                      onChange={e => onUpdate(product.id, 'material', e.target.value)}
                      style={{ ...selectStyle, border: '1px solid #EDD9FF' }}>
                      <option value="">Material</option>
                      {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { key: 'isActive',   label: '✅ Active'   },
                { key: 'isFeatured', label: '⭐ Featured' },
                { key: 'isTrending', label: '🔥 Trending' },
              ].map(({ key, label }) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '12px', cursor: 'pointer', fontWeight: '600', color: '#6B4E8A',
                }}>
                  <input type="checkbox" checked={product[key]}
                    onChange={e => onUpdate(product.id, key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}