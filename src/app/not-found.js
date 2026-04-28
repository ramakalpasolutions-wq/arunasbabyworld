import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function NotFound() {
  return (
    <MainLayout>
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '5rem' }}>🍼</div>
        <h1 style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem' }}>Oops! Page not found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
          The page you're looking for seems to have wandered off. Let's get you back on track!
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
          <Link href="/" className="btn btn-primary">🏠 Go Home</Link>
          <Link href="/products" className="btn btn-outline">🛍️ Browse Products</Link>
        </div>
      </div>
    </MainLayout>
  );
}
