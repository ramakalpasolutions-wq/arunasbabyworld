import Link from 'next/link';
import styles from './CategorySeoContent.module.css';

/**
 * Server-rendered text under a product listing: an introduction, popular brands,
 * related categories and FAQs. Gives search engines real content and internal links.
 */
export default function CategorySeoContent({ heading, headingLevel = 2, intro = [], brandLinks = [], categoryLinks = [], faqs = [] }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section className={styles.wrap} aria-labelledby="listing-about">
      <div className={styles.inner}>
        <Heading id="listing-about" className={styles.heading}>{heading}</Heading>
        {intro.map((p, i) => <p key={i} className={styles.text}>{p}</p>)}

        {brandLinks.length > 0 && (
          <>
            <h3 className={styles.sub}>Popular brands</h3>
            <ul className={styles.links}>
              {brandLinks.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </>
        )}

        {categoryLinks.length > 0 && (
          <>
            <h3 className={styles.sub}>Shop by category</h3>
            <ul className={styles.links}>
              {categoryLinks.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </>
        )}

        {faqs.length > 0 && (
          <>
            <h3 className={styles.sub}>Frequently asked questions</h3>
            <div className={styles.faqs}>
              {faqs.map((f) => (
                <details key={f.q} className={styles.faq}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
