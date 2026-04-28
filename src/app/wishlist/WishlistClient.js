'use client';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/products/ProductCard';

export default function WishlistClient() {
  const { items, remove } = useWishlist();

  if (items.length === 0) {
    return (
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: '16px',
          padding: '40px 20px',
        }}
      >
        <span style={{ fontSize: '64px' }}>❤️</span>
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: '800',
          color: '#1a1a2e',
          margin: 0,
        }}>
          Your wishlist is empty
        </h2>
        <p style={{
          color: '#888',
          fontSize: '1rem',
          margin: 0,
          maxWidth: '400px',
        }}>
          Save items you love by clicking the heart icon on any product
        </p>
        <Link
          href="/products"
          className="btn btn-primary"
          style={{ marginTop: '8px' }}
        >
          🛍️ Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ padding: '40px 20px 60px' }}
    >
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '800',
          color: '#1a1a2e',
          margin: '0 0 6px',
        }}>
          ❤️ My Wishlist
        </h1>
        <p style={{
          color: '#888',
          fontSize: '0.95rem',
          margin: 0,
        }}>
          {items.length} item{items.length !== 1 ? 's' : ''} saved
        </p>
      </div>
      <div className="products-grid">
        {items.map(item => (
          <ProductCard
            key={item.id || item._id}
            product={item}
          />
        ))}
      </div>
    </div>
  );
}