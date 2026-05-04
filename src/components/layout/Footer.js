'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Footer.module.css';

export default function Footer() {
  const { data: session } = useSession();
  const footerRef = useRef(null);

  // ✅ Entrance reveal animation
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
              <div className={styles.logo}>
                <span>🍼</span>
                <span className={styles.logoText}>BabyBliss</span>
              </div>
              <p>Your one-stop destination for premium baby & kids products. Quality, safety, and joy — delivered to your door.</p>
              <div className={styles.socials}>
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Instagram">📸</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="YouTube">▶️</a>
                <a href="#" aria-label="Pinterest">📌</a>
              </div>
            </div>

            {/* Quick Links */}
            <div className={`${styles.col} ${styles.reveal}`} style={{ '--delay': '0.1s' }}>
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/products">All Products</Link></li>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/track-order">Track Order</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div className={`${styles.col} ${styles.reveal}`} style={{ '--delay': '0.2s' }}>
              <h4>Categories</h4>
              <ul>
                <li><Link href="/products?category=clothing">Baby Clothing</Link></li>
                <li><Link href="/products?category=toys-games">Toys & Games</Link></li>
                <li><Link href="/products?category=baby-gear">Baby Gear</Link></li>
                <li><Link href="/products?category=feeding">Feeding</Link></li>
                <li><Link href="/products?category=health-safety">Health & Safety</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className={`${styles.col} ${styles.reveal}`} style={{ '--delay': '0.3s' }}>
              <h4>Support</h4>
              <ul>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/returns">Returns Policy</Link></li>
                <li><Link href="/shipping">Shipping Info</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div className={`${styles.col} ${styles.reveal}`} style={{ '--delay': '0.4s' }}>
              <h4>My Account</h4>
              <ul>
                {session ? (
                  <>
                    <li><Link href="/profile">👤 My Profile</Link></li>
                    <li><Link href="/orders">📦 My Orders</Link></li>
                    <li><Link href="/wishlist">❤️ Wishlist</Link></li>
                    <li><Link href="/track-order">🔍 Track Order</Link></li>
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
                        onMouseEnter={e => e.currentTarget.style.color = '#FFD4B8'}
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
                    <li><Link href="/track-order">🔍 Track Order</Link></li>
                    <li><Link href="/wishlist">❤️ Wishlist</Link></li>
                  </>
                )}
              </ul>

              {/* ✅ User greeting if logged in */}
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
            <p>© {new Date().getFullYear()} BabyBliss. All rights reserved. Made with ❤️ for parents.</p>
            <div className={styles.bottomLinks}>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}