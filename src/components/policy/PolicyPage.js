import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { JsonLd, absoluteUrl } from '@/lib/seo';
import { POLICIES, POLICY_LINKS, POLICY_UPDATED, STORE } from '@/lib/policies';
import styles from './PolicyPage.module.css';

export default function PolicyPage({ policyKey }) {
  const policy = POLICIES[policyKey];

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: policy.title, item: absoluteUrl(policy.path) },
    ],
  };

  return (
    <MainLayout>
      <JsonLd data={breadcrumb} />
      <div className={styles.page}>
        <div className={styles.rainbow} aria-hidden="true" />

        <header className={styles.header}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">›</span>
            <span>{policy.title}</span>
          </nav>
          <h1 className={styles.title}>{policy.title}</h1>
          <p className={styles.updated}>Last updated: {POLICY_UPDATED}</p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.side}>
            <p className={styles.sideLabel}>Our policies</p>
            <ul>
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={link.href === policy.path ? styles.sideActive : undefined}
                    aria-current={link.href === policy.path ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <article className={styles.content}>
            <p className={styles.intro}>{policy.intro}</p>

            {policy.sections.map((section, i) => (
              <section key={section.heading} className={styles.section}>
                <h2>
                  <span className={styles.num}>{i + 1}</span>
                  {section.heading}
                </h2>
                {section.blocks.map((block, j) =>
                  Array.isArray(block) ? (
                    <ul key={j}>
                      {block.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j}>{block}</p>
                  )
                )}
              </section>
            ))}

            <section className={styles.contact}>
              <h2>Contact us</h2>
              <p>
                Questions about this policy? We are happy to help.
              </p>
              <ul>
                <li><strong>{STORE.name}</strong>, {STORE.address}</li>
                <li>Phone: <a href={STORE.phoneHref}>{STORE.phone}</a></li>
                <li>Email: <a href={`mailto:${STORE.email}`}>{STORE.email}</a></li>
                <li><Link href="/contact">Contact form</Link></li>
              </ul>
            </section>
          </article>
        </div>
      </div>
    </MainLayout>
  );
}
