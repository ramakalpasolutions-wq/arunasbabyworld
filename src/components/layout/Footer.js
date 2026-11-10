'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import styles from './Footer.module.css';

export default function Footer() {
  const { data: session } = useSession();
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1 }
    );
    const revealEls = footerRef.current?.querySelectorAll(`.${styles.reveal}`);
    revealEls?.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <footer className={styles.footer} ref={footerRef}>
      <div className={styles.topSection}>
        <div className="container">
          <div className={styles.grid}>

            {/* Brand */}
            <div className={`${styles.brand} ${styles.reveal}`}>
              {/* ✅ LOGO IMAGE WITH CREAM BACKGROUND REMOVED */}
              <Link href="/" className={styles.logo}>
                <Image
                  src="/logo.png"
                  alt="Arunas Baby World"
                  width={220}
                  height={90}
                  className={styles.logoImg}
                  style={{ mixBlendMode: 'multiply', objectFit: 'contain' }}
                />
              </Link>

              <p>Your one-stop destination for premium baby & kids products. Quality, safety, and joy — delivered to your door.</p>
         <div className={styles.socials}>
  <a
    href="https://www.facebook.com/arunasbabyworld"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Facebook"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  </a>
  <a
    href="https://www.instagram.com/arunasbabyworld"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  </a>
  {/* <a
    href="https://twitter.com/arunasbabyworld"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="X (Twitter)"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  </a> */}
  <a
    href="https://www.youtube.com/@arunasbabyworld"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="YouTube"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  </a>
  {/* <a
    href="https://in.pinterest.com/arunasbabyworld"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Pinterest"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/>
    </svg>
  </a> */}
</div>
            </div>

            {/* Quick Links */}
            <div className={`${styles.col} ${styles.reveal}`} style={{ '--delay': '0.1s' }}>
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/products">All Products</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/track-order">Track Order</Link></li>
                <li><Link href="/shipping-policy">Shipping Policy</Link></li>
                <li><Link href="/refund-policy">Refund &amp; Returns</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div className={`${styles.col} ${styles.reveal}`} style={{ '--delay': '0.2s' }}>
              <h4>Categories</h4>
              <ul>
                <li><Link href="/products?category=clothing">Baby Clothing</Link></li>
                <li><Link href="/products?category=toys">Toys & Games</Link></li>
                <li><Link href="/products?category=baby-gear">Baby Gear</Link></li>
                <li><Link href="/products?category=baby-feeding">Feeding</Link></li>
                <li><Link href="/products?category=health-care">Health Care</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div className={`${styles.col} ${styles.reveal}`} style={{ '--delay': '0.4s' }}>
              <h4>My Account</h4>
              <ul>
                {session ? (
                  <>
                    <li><Link href="/profile">👤 My Profile</Link></li>
                    <li><Link href="/profile?tab=orders">📦 My Orders</Link></li>
                    <li><Link href="/wishlist">❤️ Wishlist</Link></li>
                    {session.user.role === 'admin' && (
                      <li><Link href="/admin/dashboard">⚙️ Admin Panel</Link></li>
                    )}
                    <li>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        style={{
                          background: 'none', border: 'none',
                          color: 'rgba(255,255,255,0.58)',
                          cursor: 'pointer', padding: 0,
                          fontSize: '0.90rem', fontWeight: '500',
                          fontFamily: 'Nunito, sans-serif',
                          display: 'inline-flex', alignItems: 'center',
                          gap: '4px', transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#F6D28B'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.58)'}
                      >
                        🚪 Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login">🔑 Login</Link></li>
                    <li><Link href="/register">✨ Create Account</Link></li>
                    <li><Link href="/wishlist">❤️ Wishlist</Link></li>
                  </>
                )}
              </ul>

              {session && (
                <div className={styles.footerUserCard}>
                  <div className={styles.footerUserAvatar}>
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className={styles.footerUserName}>
                      {session.user.name?.split(' ')[0]}
                    </p>
                    <p className={styles.footerUserRole}>
                      {session.user.role === 'admin' ? '🛡️ Admin' : '👤 Customer'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className={`${styles.bottom} ${styles.reveal}`}>
        <div className="container">
          <div className={styles.bottomContent}>
            <p>© 2026 Arunas Baby World.</p>
            <div className={styles.bottomLinks}>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/refund-policy">Refund &amp; Returns</Link>
              <Link href="/shipping-policy">Shipping Policy</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}