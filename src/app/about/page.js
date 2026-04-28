import MainLayout from '@/components/layout/MainLayout';
import AboutClient from './AboutClient';

export const metadata = { title: 'About Us', description: 'Learn about BabyBliss — our story, mission, and commitment to families.' };

export default function AboutPage() {
  return <MainLayout><AboutClient /></MainLayout>;
}
