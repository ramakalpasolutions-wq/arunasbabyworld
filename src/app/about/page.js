import MainLayout from '@/components/layout/MainLayout';
import AboutClient from './AboutClient';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About Us',
  description: 'Learn about Arunas Baby World: our story, our mission and our commitment to safe, quality baby and kids products for every family.',
  path: '/about',
});

export default function AboutPage() {
  return <MainLayout><AboutClient /></MainLayout>;
}
