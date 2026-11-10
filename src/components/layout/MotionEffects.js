'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Site-wide motion and small interactions for shopper pages:
 *  - content fades and slides in as it scrolls into view (no per-page code needed)
 *  - a rainbow reading-progress bar under the top of the window
 *  - a back-to-top button
 * Everything is skipped for visitors who ask their device for reduced motion.
 */

// What gets the entrance animation (inside <main> only)
const CANDIDATES = [
  'h1', 'h2', 'h3', 'article', 'form', 'table',
  '[class*="card" i]', '[class*="tile" i]', '[class*="item" i]',
  '[class*="box" i]', '[class*="panel" i]', '[class*="banner" i]',
  '[class*="summary" i]', '[class*="section" i]',
].join(',');

// Areas that already move on their own, or must never be transformed
const EXCLUDED = [
  'header', 'footer', 'nav', '[data-no-anim]',
  '.reveal', '.reveal-left', '.reveal-right', '.reveal-scale',
  '[class*="hero" i]', '[class*="swiper" i]', '[class*="slider" i]', '[class*="carousel" i]',
  '[class*="marquee" i]', '[class*="scroll" i]', '[class*="modal" i]', '[class*="drawer" i]',
  '[class*="popup" i]', '[class*="dropdown" i]', '[class*="toolbar" i]', '[class*="sidebar" i]',
  '[class*="skeleton" i]', '[class*="toast" i]', '[class*="tooltip" i]',
].join(',');

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function MotionEffects() {
  const pathname = usePathname();
  const barRef = useRef(null);
  const [showTop, setShowTop] = useState(false);
  const isAdmin = pathname?.startsWith('/admin');

  // ── Entrance animations ──────────────────────────────────────────────
  useIsoLayoutEffect(() => {
    if (isAdmin) return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const seen = new WeakSet();

    const io = new IntersectionObserver(
      (entries) => {
        // Stagger items that appear together (a row of cards, a list)
        let order = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          io.unobserve(el);
          el.style.animationDelay = `${Math.min(order, 8) * 55}ms`;
          order += 1;
          el.setAttribute('data-anim', 'in');
          const done = () => {
            el.removeAttribute('data-anim');
            el.style.animationDelay = '';
          };
          el.addEventListener('animationend', done, { once: true });
          // Safety net: never leave anything hidden
          setTimeout(done, 1600);
        });
      },
      { threshold: 0, rootMargin: '0px 0px -6% 0px' }
    );

    const consider = (el) => {
      if (!(el instanceof HTMLElement) || seen.has(el)) return;
      seen.add(el);
      if (!el.closest('main') || el.closest(EXCLUDED)) return;
      // One animation per block: skip pieces of something already animating
      if (el.parentElement?.closest('[data-anim]')) return;

      const rect = el.getBoundingClientRect();
      if (rect.width < 48 || rect.height < 24) return;
      if (rect.height > window.innerHeight * 1.2) return;   // too big: animate its parts instead
      if (rect.bottom < 0) return;                            // already scrolled past

      const cs = getComputedStyle(el);
      if (cs.display === 'inline' || cs.display === 'contents' || cs.display === 'none') return;
      if (cs.position === 'fixed' || cs.position === 'sticky' || cs.position === 'absolute') return;
      if (cs.transform !== 'none' || cs.animationName !== 'none') return;

      el.setAttribute('data-anim', 'pending');
      io.observe(el);
    };

    const scan = (root) => {
      if (!(root instanceof HTMLElement)) return;
      if (root.matches(CANDIDATES)) consider(root);
      root.querySelectorAll(CANDIDATES).forEach(consider);
    };

    document.querySelectorAll('main').forEach(scan);

    // Content that loads later (product lists, order details) animates in too
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.closest('main')) scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      document.querySelectorAll('[data-anim]').forEach((el) => el.removeAttribute('data-anim'));
    };
  }, [pathname, isAdmin]);

  // ── Scroll progress bar + back-to-top ───────────────────────────────
  useEffect(() => {
    if (isAdmin) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
      setShowTop(window.scrollY > 600);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname, isAdmin]);

  if (isAdmin) return null;

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <div ref={barRef} className="scroll-progress-bar" />
      </div>
      <button
        type="button"
        className={`back-to-top ${showTop ? 'is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
