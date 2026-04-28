'use client';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.topSection}>
        <div className="container">
          <div className={styles.grid}>
            {/* Brand */}
            <div className={styles.brand}>
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
            <div className={styles.col}>
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
            <div className={styles.col}>
              <h4>Categories</h4>
              <ul>
                <li><Link href="/products?category=clothing">Baby Clothing</Link></li>
                <li><Link href="/products?category=toys">Toys & Games</Link></li>
                <li><Link href="/products?category=gear">Baby Gear</Link></li>
                <li><Link href="/products?category=feeding">Feeding</Link></li>
                <li><Link href="/products?category=nursery">Nursery</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className={styles.col}>
              <h4>Support</h4>
              <ul>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/returns">Returns Policy</Link></li>
                <li><Link href="/shipping">Shipping Info</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className={styles.col}>
              <h4>Contact Us</h4>
              <div className={styles.contactInfo}>
                <p>📍 123 Baby Lane, Mumbai, Maharashtra 400001</p>
                <p>📞 <a href="tel:+911800123456">1800-123-456</a></p>
                <p>✉️ <a href="mailto:care@babybliss.in">care@babybliss.in</a></p>
                <p>🕐 Mon–Sat: 9am – 6pm IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services bar */}
      <div className={styles.services}>
        <div className="">
          <div className={styles.servicesGrid}>
            {[
              
            ].map((s) => (
              <div key={s.title} className={styles.serviceItem}>
                <span className={styles.serviceIcon}>{s.icon}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomContent}>
            <p>© {new Date().getFullYear()} BabyBliss. All rights reserved.</p>
            <div className={styles.payments}>
              
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
