import MainLayout from '@/components/layout/MainLayout';
import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Us | Arunas Baby World',
  description: 'Get in touch with the Arunas Baby World team.',
};

export default function ContactPage() {
  return (
    <MainLayout>
      <ContactClient />
    </MainLayout>
  );
}