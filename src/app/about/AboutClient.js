'use client';
import { useEffect, useRef, useState } from 'react';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './AboutClient.module.css';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = Date.now();
        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * end));
          if (progress === 1) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function AboutClient() {
  useScrollReveal();

  return (
    <div className={styles.about}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={`${styles.heroText} reveal-left`}>
              <span className={styles.tag}>Our Story</span>
              <h1>Born from a Parent's Love 💝</h1>
              <p>
                BabyBliss was founded in 2019 by parents who struggled to find quality, safe, and
                affordable products for their little ones. We understood the anxiety, the joy, and
                the overwhelming choices new parents face — and we built a solution.
              </p>
              <p>
                Today, we serve over 500,000 happy families across India, offering more than
                50,000 carefully curated products — all tested for safety, quality, and value.
              </p>
            </div>
            <div className={`${styles.heroVisual} reveal-right`}>
              <div className={styles.visualCard}>
                <span>🍼</span>
                <h3>Since 2019</h3>
                <p>Serving Indian families</p>
              </div>
              <div className={styles.visualCard} style={{ background: 'linear-gradient(135deg, #7c3aed20, #c44dff15)' }}>
                <span>🏆</span>
                <h3>#1 Baby Store</h3>
                <p>Rated by parents</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats counters */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { icon: '👨‍👩‍👧‍👦', label: 'Happy Families', end: 500000, suffix: '+' },
              { icon: '📦', label: 'Orders Delivered', end: 2000000, suffix: '+' },
              { icon: '🛍️', label: 'Products Available', end: 50000, suffix: '+' },
              { icon: '⭐', label: 'Average Rating', end: 4.8, suffix: '/5' },
              { icon: '🏙️', label: 'Cities Served', end: 19000, suffix: '+' },
              { icon: '🔄', label: 'Return Rate', end: 98, suffix: '%' },
            ].map((stat, i) => (
              <div key={stat.label} className={`${styles.statCard} reveal`} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className={styles.statIcon}>{stat.icon}</span>
                <div className={styles.statNumber}>
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                </div>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={styles.missionSection}>
        <div className="container">
          <div className={styles.missionGrid}>
            <div className={`${styles.missionCard} ${styles.missionCard1} reveal-left`}>
              <div className={styles.missionIcon}>🎯</div>
              <h2>Our Mission</h2>
              <p>
                To make parenting joyful by providing every Indian family with safe, affordable,
                and high-quality baby products — delivered with care, right to their doorstep.
                We believe every child deserves the best start in life.
              </p>
            </div>
            <div className={`${styles.missionCard} ${styles.missionCard2} reveal-right`}>
              <div className={styles.missionIcon}>🔭</div>
              <h2>Our Vision</h2>
              <p>
                To become India's most trusted parenting companion — a platform where every
                parent finds not just products, but guidance, community, and confidence.
                We envision a world where no parent feels alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={styles.whySection}>
        <div className="container">
          <div className="text-center reveal">
            <h2 className={styles.sectionTitle}>Why 5 Lakh+ Parents Choose BabyBliss</h2>
            <p className={styles.sectionSub}>We're not just a store — we're your parenting partner</p>
          </div>
          <div className={styles.whyGrid}>
            {[
              { icon: '🛡️', title: 'Safety First', desc: 'Every product passes rigorous safety testing. We verify certifications and reject products that don\'t meet our standards.', color: '#ff6b9d' },
              { icon: '💰', title: 'Best Prices', desc: 'We negotiate directly with manufacturers so you get premium quality at prices that fit a family budget.', color: '#7c3aed' },
              { icon: '🚀', title: 'Fast Delivery', desc: 'Express delivery in 24 hours for metro cities. Standard delivery across 19,000+ pin codes in India.', color: '#0ea5e9' },
              { icon: '♻️', title: 'Easy Returns', desc: '30-day no-questions-asked return policy. Because we know parenting is unpredictable.', color: '#10b981' },
              { icon: '🎓', title: 'Expert Curation', desc: 'Our team of pediatricians and parents curate every product. No guesswork — just trusted choices.', color: '#f59e0b' },
              { icon: '💬', title: 'Parent Community', desc: 'Join 5 lakh parents in our community. Share experiences, get advice, and grow together.', color: '#ef4444' },
            ].map((item, i) => (
              <div key={item.title} className={`${styles.whyCard} reveal`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.whyIcon} style={{ background: `${item.color}15`, color: item.color }}>{item.icon}</div>
                <h3 style={{ color: item.color }}>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={styles.teamSection}>
        <div className="container">
          <div className="text-center reveal">
            <h2 className={styles.sectionTitle}>Meet the Founders</h2>
            <p className={styles.sectionSub}>Parents who built BabyBliss for parents</p>
          </div>
          <div className={styles.teamGrid}>
            {[
              { name: 'Priya Sharma', role: 'CEO & Co-Founder', emoji: '👩', desc: 'Mother of two, ex-McKinsey consultant, on a mission to simplify parenting.' },
              { name: 'Rahul Mehta', role: 'CTO & Co-Founder', emoji: '👨', desc: 'Father of one, IIT Bombay alumnus, building technology that serves families.' },
              { name: 'Ananya Patel', role: 'Head of Product', emoji: '👩‍💼', desc: 'Pediatric nurse turned product lead, ensuring every item meets safety standards.' },
            ].map((member, i) => (
              <div key={member.name} className={`${styles.teamCard} reveal`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className={styles.teamAvatar}>{member.emoji}</div>
                <h3>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                <p className={styles.teamDesc}>{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
