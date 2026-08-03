'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { uploadFileToR2 } from '@/lib/uploadFile';

export default function ReviewsSection({ productId, productName }) {
  const { data: session } = useSession();
  const [reviews, setReviews]   = useState([]);
  const [stats,   setStats]     = useState({ avgRating: 0, totalReviews: 0, breakdown: {} });
  const [loading, setLoading]   = useState(true);
  const [canReview, setCanReview] = useState(null);
  const [sort, setSort] = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [imageIndex, setImageIndex] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&sort=${sort}&limit=50`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || { avgRating: 0, totalReviews: 0, breakdown: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!session) { setCanReview({ canReview: false, reason: 'not-logged-in' }); return; }
    const res = await fetch(`/api/reviews/can-review?productId=${productId}`);
    const data = await res.json();
    setCanReview(data);
  };

  useEffect(() => { fetchReviews(); }, [productId, sort]);
  useEffect(() => { checkEligibility(); }, [productId, session]);

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Review deleted');
      fetchReviews();
      checkEligibility();
    } else {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  return (
    <div style={{ padding: '20px 0' }}>
      {/* STATS HEADER */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '30px',
        padding: '24px',
        background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
        border: '2px solid #FFE4EC',
        borderRadius: '16px',
        marginBottom: '20px',
      }}>
        <div style={{ textAlign: 'center', minWidth: '160px' }}>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
            {stats.avgRating.toFixed(1)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '4px 0' }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{
                fontSize: '1.4rem',
                color: s <= Math.round(stats.avgRating) ? '#FBBF24' : '#E5E7EB',
              }}>★</span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          {[5, 4, 3, 2, 1].map(r => {
            const count = stats.breakdown[r] || 0;
            const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', minWidth: '20px' }}>{r}★</span>
                <div style={{ flex: 1, height: '8px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: '600', minWidth: '30px', textAlign: 'right' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WRITE REVIEW */}
      {canReview?.canReview && !showForm && (
        <button
          onClick={() => { setEditingReview(null); setShowForm(true); }}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '800',
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
            marginBottom: '20px',
            boxShadow: '0 6px 18px rgba(255,107,53,0.30)',
          }}
        >
          ✍️ Write a Review
        </button>
      )}

      {canReview?.reason === 'not-logged-in' && (
        <div style={{
          padding: '14px 20px',
          background: '#FFF7ED',
          border: '2px solid #FDBA74',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <p style={{ margin: 0, fontSize: '0.90rem', color: '#9A3412', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            🔒 Please login to write a review
          </p>
          <Link href={`/login?redirect=/products/${productId}`} style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '800',
            fontSize: '0.85rem',
            fontFamily: 'Nunito, sans-serif',
          }}>Login</Link>
        </div>
      )}

      {canReview?.reason === 'not-purchased' && (
        <div style={{
          padding: '14px 20px',
          background: '#EFF6FF',
          border: '2px solid #BFDBFE',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: 0, fontSize: '0.90rem', color: '#1E40AF', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            🛒 Only verified buyers can review this product
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#3B82F6', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
            Purchase this product to share your experience
          </p>
        </div>
      )}

      {canReview?.reason === 'already-reviewed' && !showForm && (
        <div style={{
          padding: '14px 20px',
          background: '#F0FDF4',
          border: '2px solid #86EFAC',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <p style={{ margin: 0, fontSize: '0.90rem', color: '#166534', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            ✅ You already reviewed this product
          </p>
          <button
            onClick={() => handleEdit(canReview.existingReview)}
            style={{
              padding: '8px 18px',
              background: 'white',
              border: '2px solid #166534',
              borderRadius: '8px',
              color: '#166534',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            ✏️ Edit Review
          </button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <ReviewForm
          productId={productId}
          productName={productName}
          existingReview={editingReview}
          onSuccess={() => {
            setShowForm(false);
            setEditingReview(null);
            fetchReviews();
            checkEligibility();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
        />
      )}

      {/* SORT + LIST */}
      {reviews.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
            📝 Customer Reviews ({stats.totalReviews})
          </h3>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#374151',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              background: 'white',
            }}
          >
            <option value="newest">✨ Newest First</option>
            <option value="oldest">📅 Oldest First</option>
            <option value="highest">⭐ Highest Rated</option>
            <option value="lowest">📉 Lowest Rated</option>
            <option value="most-helpful">👍 Most Helpful</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F9FAFB', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📝</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#374151', fontFamily: 'Nunito, sans-serif' }}>No reviews yet</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', fontFamily: 'Nunito, sans-serif' }}>Be the first to review this product!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={session?.user?.id}
              isAdmin={session?.user?.role === 'admin'}
              onDelete={() => handleDeleteReview(review.id)}
              onEdit={() => handleEdit(review)}
              onImageClick={(idx) => setImageIndex({ reviewId: review.id, idx, images: review.images })}
              onHelpfulUpdate={fetchReviews}
            />
          ))}
        </div>
      )}

      {imageIndex !== null && (
        <ImageLightbox
          images={imageIndex.images}
          currentIndex={imageIndex.idx}
          onClose={() => setImageIndex(null)}
        />
      )}
    </div>
  );
}

/* REVIEW CARD */
function ReviewCard({ review, currentUserId, isAdmin, onDelete, onEdit, onImageClick, onHelpfulUpdate }) {
  const isOwner = review.userId === currentUserId;
  const [markingHelpful, setMarkingHelpful] = useState(false);

  const handleHelpful = async () => {
    if (!currentUserId) { toast.error('Please login'); return; }
    setMarkingHelpful(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: 'POST' });
      if (res.ok) {
        toast.success('Thanks for your feedback!');
        onHelpfulUpdate();
      }
    } finally {
      setMarkingHelpful(false);
    }
  };

  const alreadyMarked = (review.helpfulBy || []).includes(currentUserId);

  return (
    <div style={{
      padding: '16px 18px',
      background: 'white',
      border: '1.5px solid #E5E7EB',
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            width: '38px', height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '900',
            fontFamily: 'Nunito, sans-serif',
          }}>
            {review.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '0.90rem', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
                {review.name}
              </strong>
              {review.isVerified && (
                <span style={{
                  padding: '2px 8px',
                  background: '#D1FAE5',
                  color: '#065F46',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  fontFamily: 'Nunito, sans-serif',
                }}>
                  ✓ Verified Buyer
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '2px', marginTop: '3px' }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{
                  fontSize: '0.95rem',
                  color: s <= review.rating ? '#FBBF24' : '#E5E7EB',
                }}>★</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'Nunito, sans-serif' }}>
            {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {(isOwner || isAdmin) && (
            <>
              {isOwner && (
                <button onClick={onEdit} style={{
                  padding: '4px 8px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                  borderRadius: '6px', fontSize: '0.7rem', color: '#1E40AF', cursor: 'pointer',
                  fontWeight: '700', fontFamily: 'Nunito, sans-serif',
                }}>✏️</button>
              )}
              <button onClick={onDelete} style={{
                padding: '4px 8px', background: '#FEE2E2', border: '1px solid #FCA5A5',
                borderRadius: '6px', fontSize: '0.7rem', color: '#991B1B', cursor: 'pointer',
                fontWeight: '700', fontFamily: 'Nunito, sans-serif',
              }}>🗑️</button>
            </>
          )}
        </div>
      </div>

      {review.title && (
        <h4 style={{ margin: '8px 0 4px', fontSize: '0.95rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
          {review.title}
        </h4>
      )}

      <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' }}>
        {review.comment}
      </p>

      {review.images?.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          {review.images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={`Review ${i + 1}`}
              onClick={() => onImageClick(i)}
              style={{
                width: '80px', height: '80px', objectFit: 'cover',
                borderRadius: '8px', border: '1.5px solid #E5E7EB',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleHelpful}
          disabled={markingHelpful}
          style={{
            padding: '5px 12px',
            background: alreadyMarked ? '#DBEAFE' : 'white',
            border: `1.5px solid ${alreadyMarked ? '#3B82F6' : '#D1D5DB'}`,
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: alreadyMarked ? '#1E40AF' : '#6B7280',
            cursor: markingHelpful ? 'not-allowed' : 'pointer',
            fontFamily: 'Nunito, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          👍 Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
        </button>
      </div>
    </div>
  );
}

/* REVIEW FORM */
function ReviewForm({ productId, productName, existingReview, onSuccess, onCancel }) {
  const [rating,  setRating]  = useState(existingReview?.rating || 0);
  const [hover,   setHover]   = useState(0);
  const [title,   setTitle]   = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images,  setImages]  = useState(existingReview?.images || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(f => uploadFileToR2(f, 'arunas/reviews'))
      );
      setImages([...images, ...uploaded.map(u => ({ url: u.url, publicId: u.publicId }))]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select rating'); return; }
    if (comment.trim().length < 10) { toast.error('Comment must be at least 10 characters'); return; }

    setSubmitting(true);
    try {
      const url = existingReview ? `/api/reviews/${existingReview.id}` : '/api/reviews';
      const method = existingReview ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title, comment, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(existingReview ? '✅ Review updated' : '🎉 Review posted!');
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      padding: '20px 22px',
      background: 'white',
      border: '2px solid #FFE4EC',
      borderRadius: '14px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
        {existingReview ? '✏️ Edit Your Review' : '✍️ Write Review'}
      </h3>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', display: 'block', fontFamily: 'Nunito, sans-serif' }}>
          Your Rating *
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1,2,3,4,5].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '2rem',
                color: s <= (hover || rating) ? '#FBBF24' : '#E5E7EB',
                transition: 'color 0.15s',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ★
            </button>
          ))}
          <span style={{ marginLeft: '10px', alignSelf: 'center', fontSize: '0.85rem', color: '#6B7280', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            {rating === 0 ? 'Click to rate' : `${rating}/5 stars`}
          </span>
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', display: 'block', fontFamily: 'Nunito, sans-serif' }}>
          Review Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Excellent quality!"
          maxLength={100}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '2px solid #EDD9FF',
            borderRadius: '8px',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: 'Nunito, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', display: 'block', fontFamily: 'Nunito, sans-serif' }}>
          Your Review *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          maxLength={1000}
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '2px solid #EDD9FF',
            borderRadius: '8px',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: 'Nunito, sans-serif',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'right', fontFamily: 'Nunito, sans-serif' }}>
          {comment.length}/1000 (min 10)
        </p>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', display: 'block', fontFamily: 'Nunito, sans-serif' }}>
          Add Photos (up to 5)
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={img.url} alt="" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #E5E7EB' }} />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#EF4444', color: 'white', border: 'none',
                  cursor: 'pointer', fontSize: '0.7rem', fontWeight: '900',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
          ))}
          {images.length < 5 && (
            <label style={{
              width: '70px', height: '70px',
              border: '2px dashed #FF6B9D',
              borderRadius: '8px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: '#FFF5F7',
              fontFamily: 'Nunito, sans-serif',
            }}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
              {uploading ? (
                <span style={{ fontSize: '0.7rem', color: '#FF6B9D', fontWeight: '700' }}>⏳</span>
              ) : (
                <>
                  <span style={{ fontSize: '1.2rem' }}>📷</span>
                  <span style={{ fontSize: '0.65rem', color: '#FF6B9D', fontWeight: '700' }}>Add</span>
                </>
              )}
            </label>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <button type="button" onClick={onCancel} disabled={submitting} style={{
          padding: '10px 20px',
          background: 'white',
          border: '2px solid #E5E7EB',
          borderRadius: '10px',
          color: '#6B7280',
          fontWeight: '700',
          cursor: 'pointer',
          fontFamily: 'Nunito, sans-serif',
        }}>Cancel</button>
        <button type="submit" disabled={submitting || uploading} style={{
          flex: 1,
          padding: '10px 20px',
          background: submitting ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontWeight: '800',
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'Nunito, sans-serif',
        }}>
          {submitting ? '⏳ Posting...' : existingReview ? '💾 Update Review' : '✨ Post Review'}
        </button>
      </div>
    </form>
  );
}

/* IMAGE LIGHTBOX */
function ImageLightbox({ images, currentIndex, onClose }) {
  const [idx, setIdx] = useState(currentIndex);

  const prev = () => setIdx((idx - 1 + images.length) % images.length);
  const next = () => setIdx((idx + 1) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: '20px', right: '20px',
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'white', border: 'none', fontSize: '1.4rem',
        cursor: 'pointer', fontWeight: '900',
      }}>✕</button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{
            position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
            width: '50px', height: '50px', borderRadius: '50%',
            background: 'white', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
            fontWeight: '900',
          }}>‹</button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} style={{
            position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
            width: '50px', height: '50px', borderRadius: '50%',
            background: 'white', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
            fontWeight: '900',
          }}>›</button>
        </>
      )}

      <img
        src={images[idx].url}
        alt={`Review ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
      />

      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          padding: '6px 14px', background: 'rgba(255,255,255,0.9)',
          borderRadius: '999px', fontWeight: '800', fontSize: '0.85rem',
        }}>
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}