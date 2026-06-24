import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export const metadata = { title: 'My Orders | Aruna's Baby World' };

export default function OrdersPage() {
  return (
    <MainLayout>
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: 'Nunito, sans-serif',
        padding: '40px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #FFF5EE 0%, #F3E8FF 100%)',
      }}>
        <div style={{ fontSize: '4rem' }}>📦</div>

        <h1 style={{
          fontSize: 'clamp(1.6rem,3vw,2.2rem)',
          fontWeight: '800',
          color: '#2D1A4A',
          margin: 0,
        }}>
          My Orders
        </h1>

        <p style={{
          color: '#9585B0',
          fontWeight: '600',
          margin: 0,
          fontSize: '1rem',
          maxWidth: '400px',
        }}>
          View all your orders and live tracking status in your profile page
        </p>

        <Link
          href="/profile?tab=orders"
          style={{
            padding: '14px 36px',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            color: 'white',
            borderRadius: '999px',
            textDecoration: 'none',
            fontWeight: '800',
            fontSize: '1rem',
            fontFamily: 'Nunito, sans-serif',
            boxShadow: '0 8px 24px rgba(255,107,53,0.28)',
          }}
        >
          📦 View My Orders →
        </Link>

        <Link
          href="/products"
          style={{
            color: '#9585B0',
            fontWeight: '700',
            fontSize: '0.90rem',
            textDecoration: 'none',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          🛍️ Continue Shopping
        </Link>
      </div>
    </MainLayout>
  );
}