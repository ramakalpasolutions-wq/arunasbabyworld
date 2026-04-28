'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './ContactClient.module.css';

export default function ContactClient() {
  useScrollReveal();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Message sent! We'll get back to you soon. 😊", { duration: 5000 });
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.contact}>

      {/* ===== HERO WITH BABY CLOTHING IMAGE ===== */}
      <div className={styles.hero}>
        <div className={styles.heroImageGrid}>
          {/* Baby clothing images */}
          <div className={styles.heroImg} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&q=80')" }} />
          <div className={styles.heroImg} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80')" }} />
          <div className={styles.heroImg} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80')" }} />
          <div className={styles.heroImg} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1472289065668-ce650ac443d2?w=400&q=80')" }} />
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>👋 We are here for you</span>
            <h1>Get In Touch</h1>
            <p>Have a question about baby products? Need help with your order? We love hearing from parents!</p>
          </div>
        </div>
      </div>

      {/* ===== CONTACT CARDS - NEW STYLE ===== */}
      <div className="container">
        <div className={styles.contactCards}>

          {/* Card 1 - Call */}
          <div className={styles.contactCard}>
            <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, #ff6b9d, #ff8fab)' }}>
              <span>📞</span>
            </div>
            <div className={styles.cardBody}>
              <h3>Call Us</h3>
              <p>1800-123-456</p>
              <span>Mon–Sat, 9am–6pm IST</span>
            </div>
            <a href="tel:1800123456" className={styles.cardBtn} style={{ '--btn-color': '#ff6b9d' }}>
              Call Now →
            </a>
          </div>

          {/* Card 2 - Email */}
          <div className={styles.contactCard}>
            <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, #7c3aed, #9f7aea)' }}>
              <span>✉️</span>
            </div>
            <div className={styles.cardBody}>
              <h3>Email Us</h3>
              <p>care@babybliss.in</p>
              <span>Reply within 24 hours</span>
            </div>
            <a href="mailto:care@babybliss.in" className={styles.cardBtn} style={{ '--btn-color': '#7c3aed' }}>
              Send Email →
            </a>
          </div>

          {/* Card 3 - Delivery */}
          <div className={styles.contactCard}>
            <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
              <span>🚚</span>
            </div>
            <div className={styles.cardBody}>
           
              <span>fast Deliver</span>
            </div>
            <a href="/track-order" className={styles.cardBtn} style={{ '--btn-color': '#10b981' }}>
              Track Now →
            </a>
          </div>

          {/* Card 4 - Location */}
          <div className={styles.contactCard}>
            <div className={styles.cardIconWrap} style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
              <span>📍</span>
            </div>
            <div className={styles.cardBody}>
              <h3>Visit Us</h3>
              <p>Amaravathi road</p>
              <span>Guntur -522002</span>
            </div>
            <a href="#map" className={styles.cardBtn} style={{ '--btn-color': '#f59e0b' }}>
              View Map →
            </a>
          </div>

        </div>
      </div>

      {/* ===== MAIN FORM + INFO ===== */}
      <div className="container">
        <div className={styles.mainGrid}>

          {/* Contact Form */}
          <div className={styles.formSection}>
            <div className={styles.formHeader}>
              <h2>💬 Send Us a Message</h2>
              <p>Fill out the form and our team will get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    className="form-control"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    className="form-control"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  >
                    <option value="">Select a topic</option>
                    <option>Order Issue</option>
                    <option>Delivery Query</option>
                    <option>Product Question</option>
                    <option>Return / Refund</option>
                    <option>Partnership</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your query in detail..."
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? '⏳ Sending...' : '📨 Send Message'}
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div className={styles.infoSection}>

            {/* Info Card */}
            <div className={styles.infoCard}>
              <h3>📌 Contact Information</h3>
              <div className={styles.infoList}>
                {[
                  { icon: '📍', title: 'Address', lines: ['Amaravathi road'] },
                  { icon: '📞', title: 'Phone', lines: ['1800-123-456 (Toll Free)', '+91 98765 43210'] },
                  { icon: '✉️', title: 'Email', lines: ['care@babybliss.in', 'support@babybliss.in'] },
                  { icon: '🕐', title: 'Hours', lines: ['Mon – Sat: 9:00 AM – 6:00 PM', 'Sunday: Closed'] },
                ].map(item => (
                  <div key={item.title} className={styles.infoItem}>
                    <div className={styles.infoIconBox}>{item.icon}</div>
                    <div>
                      <strong>{item.title}</strong>
                      {item.lines.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Socials */}
              <div className={styles.socials}>
                <p>Follow Us</p>
                <div className={styles.socialIcons}>
                  {[
                    { icon: '📘', label: 'Facebook', href: '#', color: '#1877f2' },
                    { icon: '📸', label: 'Instagram', href: '#', color: '#e1306c' },
                    { icon: '🐦', label: 'Twitter', href: '#', color: '#1da1f2' },
                    { icon: '▶️', label: 'YouTube', href: '#', color: '#ff0000' },
                    { icon: '📌', label: 'Pinterest', href: '#', color: '#e60023' },
                  ].map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className={styles.socialIcon}
                      style={{ '--social-color': s.color }}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Card */}
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>🚚</div>
              <div>
                <strong>Free Home Delivery</strong>
                <p>Pan India — 19,000+ pin codes.<br />Free on orders above ₹499!</p>
              </div>
            </div>

            {/* Map */}
            <div className={styles.mapContainer} id="map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.0597577743715!2d72.8266654!3d19.0596099!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c947a5b1b6b5%3A0x11c8b37a1e3e1e0e!2sBandra%20West%2C%20Mumbai!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="180"
                style={{ border: 0, borderRadius: '12px', display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="BabyBliss Location"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}