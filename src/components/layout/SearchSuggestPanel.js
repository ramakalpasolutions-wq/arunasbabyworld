'use client';

/**
 * Marketplace-style type-ahead panel (keyword completions, "in <category>",
 * product previews). Shared by the desktop dropdown and the mobile overlay.
 *
 * Items are addressed by a flat index (suggestions, then categories, then products)
 * so the parent can drive keyboard navigation with `buildSuggestItems`.
 */

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

export function categoryTermFor(data, query) {
  const q = String(query || '').trim();
  const top = data?.suggestions?.[0];
  return data?.correctedQuery || (top && norm(top).startsWith(norm(q)) ? top : q);
}

export function buildSuggestItems(data) {
  if (!data) return [];
  return [
    ...(data.suggestions || []).map((text) => ({ type: 'suggestion', text })),
    ...(data.categories || []).map((cat) => ({ type: 'category', cat })),
    ...(data.products || []).map((product) => ({ type: 'product', product })),
  ];
}

/** Typed part normal, completion bold — like Amazon / Flipkart. */
function Highlight({ text, query }) {
  const q = norm(query);
  const t = String(text);
  if (q && norm(t).startsWith(q)) {
    return (
      <>
        <span style={{ fontWeight: 500, color: '#334155' }}>{t.slice(0, q.length)}</span>
        <span style={{ fontWeight: 800, color: '#0F172A' }}>{t.slice(q.length)}</span>
      </>
    );
  }
  return <span style={{ fontWeight: 700, color: '#0F172A' }}>{t}</span>;
}

const rowBase = {
  display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
  padding: '10px 16px', border: 'none', textAlign: 'left', cursor: 'pointer',
  textDecoration: 'none', color: 'inherit', fontSize: '0.9rem', transition: 'background 0.12s',
};
const sectionLabel = {
  padding: '10px 16px 6px', margin: 0, fontSize: '0.7rem', fontWeight: 800,
  color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px',
};

export default function SearchSuggestPanel({
  query, data, loading, selectedIndex = -1, onHover,
  onPickSuggestion, onPickCategory, onPickProduct, onViewAll, onBrowseAll,
}) {
  const items = buildSuggestItems(data);
  const hasAny = items.length > 0;
  const q = query.trim();

  if (loading && !hasAny) {
    return (
      <div style={{ padding: '22px', textAlign: 'center', color: '#0369A1', fontSize: '0.86rem', fontWeight: 600 }}>
        <div style={{
          display: 'inline-block', width: 22, height: 22, border: '3px solid #E0F2FE',
          borderTop: '3px solid #0369A1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 6,
        }} />
        <p style={{ margin: 0 }}>Searching…</p>
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>🔍</div>
        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
          No matches for “{q}”
        </p>
        <p style={{ margin: '4px 0 12px', fontSize: '0.8rem', color: '#64748B' }}>
          Check the spelling, or try a more general word like “toys” or “diaper”.
        </p>
        <button
          type="button"
          onClick={onBrowseAll}
          style={{
            padding: '8px 20px', background: '#4FA3F0', color: 'white', border: 'none',
            borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Browse All Products
        </button>
      </div>
    );
  }

  // Term used for "<term> in <category>" — the corrected query or the top completion.
  const categoryTerm = categoryTermFor(data, q);

  let i = -1;
  const bg = (idx) => (selectedIndex === idx ? '#F0F9FF' : 'white');

  return (
    <div style={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }} role="listbox">
      {data.correctedQuery && (
        <p style={{ margin: 0, padding: '10px 16px', fontSize: '0.8rem', color: '#475569', background: '#FFFBEB', borderBottom: '1px solid #FEF3C7' }}>
          Showing results for <strong style={{ color: '#0F172A' }}>{data.correctedQuery}</strong>
        </p>
      )}

      {data.suggestions?.length > 0 && (
        <div style={{ padding: '4px 0' }}>
          {data.suggestions.map((text) => {
            i += 1;
            const idx = i;
            return (
              <button
                key={`s-${text}`}
                type="button"
                role="option"
                aria-selected={selectedIndex === idx}
                onMouseEnter={() => onHover?.(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickSuggestion(text)}
                style={{ ...rowBase, background: bg(idx) }}
              >
                <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>🔍</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Highlight text={text} query={q} />
                </span>
                <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>↖</span>
              </button>
            );
          })}
        </div>
      )}

      {data.categories?.length > 0 && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '4px 0' }}>
          {data.categories.map((cat) => {
            i += 1;
            const idx = i;
            return (
              <button
                key={`c-${cat.slug}`}
                type="button"
                role="option"
                aria-selected={selectedIndex === idx}
                onMouseEnter={() => onHover?.(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickCategory(cat, categoryTerm)}
                style={{ ...rowBase, background: bg(idx), fontSize: '0.86rem' }}
              >
                <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>🗂️</span>
                <span style={{ flex: 1, minWidth: 0, color: '#334155' }}>
                  <strong style={{ color: '#0F172A' }}>{categoryTerm}</strong>
                  {' in '}
                  <span style={{ color: '#0369A1', fontWeight: 700 }}>{cat.name}</span>
                </span>
                <span style={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>{cat.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {data.products?.length > 0 && (
        <div style={{ borderTop: '1px solid #F1F5F9' }}>
          <p style={sectionLabel}>Products</p>
          {data.products.map((product) => {
            i += 1;
            const idx = i;
            const price = Math.round(product.discountPrice > 0 ? product.discountPrice : product.price || 0);
            const oldPrice = product.discountPrice > 0 && product.discountPrice < product.price ? Math.round(product.price) : null;
            return (
              <button
                key={`p-${product.id}`}
                type="button"
                role="option"
                aria-selected={selectedIndex === idx}
                onMouseEnter={() => onHover?.(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickProduct(product)}
                style={{ ...rowBase, background: bg(idx), padding: '8px 16px' }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt=""
                    loading="lazy"
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #E5E7EB', background: '#F8FAFC' }}
                  />
                ) : (
                  <span style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧸</span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
                    {[product.brand, product.category].filter(Boolean).join(' · ')}
                    {product.stock <= 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}> · Out of stock</span>}
                  </span>
                </span>
                <span style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0369A1' }}>
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {oldPrice && (
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                      ₹{oldPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onViewAll}
        style={{
          width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, #4FA3F0, #0369A1)',
          color: 'white', border: 'none', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer',
        }}
      >
        See all {data.total > 0 ? `${data.total} ` : ''}results for “{data.correctedQuery || q}” →
      </button>
    </div>
  );
}
