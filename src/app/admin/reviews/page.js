'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAllReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllReviews(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Review deleted');
      fetchAllReviews();
    } else {
      toast.error('Failed to delete');
    }
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(filter));

  return (
    <div style={{ padding: '20px', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2D1A4A', margin: '0 0 4px' }}>
            ⭐ Reviews Management
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.85rem' }}>
            Total: {reviews.length} reviews
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '9px 16px', border: '2px solid #EDD9FF', borderRadius: '10px',
            fontSize: '14px', fontFamily: 'inherit', outline: 'none',
            background: 'white', color: '#2D1A4A', cursor: 'pointer',
          }}
        >
          <option value="all">All Ratings</option>
          <option value="5">⭐⭐⭐⭐⭐ 5 Star</option>
          <option value="4">⭐⭐⭐⭐ 4 Star</option>
          <option value="3">⭐⭐⭐ 3 Star</option>
          <option value="2">⭐⭐ 2 Star</option>
          <option value="1">⭐ 1 Star</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9585B0' }}>⏳ Loading...</div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '2px dashed #EDD9FF' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⭐</div>
          <p style={{ fontWeight: '700', color: '#9585B0' }}>No reviews found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReviews.map(review => (
            <div key={review.id} style={{
              padding: '16px 18px',
              background: 'white',
              border: '2px solid #EDD9FF',
              borderRadius: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#1F2937' }}>{review.name}</strong>
                    {review.isVerified && (
                      <span style={{ padding: '2px 8px', background: '#D1FAE5', color: '#065F46', borderRadius: '999px', fontSize: '0.65rem', fontWeight: '800' }}>
                        ✓ Verified Buyer
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ color: s <= review.rating ? '#FBBF24' : '#E5E7EB' }}>★</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#6B7280' }}>
                    📧 {review.email} · 🗓️ {new Date(review.createdAt).toLocaleString('en-IN')}
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#6B7280' }}>
                    🛒 Product: <Link href={`/admin/products/${review.productId}`} style={{ color: '#7B2FBE', fontWeight: '700' }}>
                      {review.productName || review.productId}
                    </Link>
                  </p>
                  {review.title && (
                    <h4 style={{ margin: '8px 0 4px', fontSize: '0.95rem', fontWeight: '800', color: '#1F2937' }}>
                      {review.title}
                    </h4>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.6 }}>
                    {review.comment}
                  </p>
                  {review.images?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {review.images.map((img, i) => (
                        <img key={i} src={img.url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E5E7EB' }} />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  style={{
                    padding: '8px 14px', background: '#FEE2E2', color: '#991B1B',
                    border: '1.5px solid #FCA5A5', borderRadius: '8px',
                    fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer',
                    fontFamily: 'inherit', flexShrink: 0,
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}