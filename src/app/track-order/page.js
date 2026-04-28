import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export const metadata = { title: 'Track Order' };

export default function TrackOrderPage() {
  return (
    <MainLayout>
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📦</div>
        <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>Track Your Order</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          You can track your orders from your profile page. Login to view all your orders and their live status.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" className="btn btn-primary">Login to Track</Link>
          <Link href="/contact" className="btn btn-outline">Contact Support</Link>
        </div>
      </div>
    </MainLayout>
  );
}
