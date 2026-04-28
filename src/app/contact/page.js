import MainLayout from '@/components/layout/MainLayout';
import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Us | BabyBliss',
  description: 'Get in touch with the BabyBliss team.',
};

export default function ContactPage() {
  return (
    <MainLayout>
      <ContactClient />
    </MainLayout>
  );
}