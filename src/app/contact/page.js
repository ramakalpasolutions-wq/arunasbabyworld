import MainLayout from '@/components/layout/MainLayout';
import ContactClient from './ContactClient';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with Arunas Baby World for product questions, order help, returns and store information. We are happy to help you choose the right baby products.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <MainLayout>
      <ContactClient />
    </MainLayout>
  );
}