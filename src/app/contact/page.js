import MainLayout from '@/components/layout/MainLayout';
import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Us | Aruna's Baby World',
  description: 'Get in touch with the Aruna's Baby World team.',
};

export default function ContactPage() {
  return (
    <MainLayout>
      <ContactClient />
    </MainLayout>
  );
}