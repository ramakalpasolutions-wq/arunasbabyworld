import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Track Your Order',
  description: 'Track your Arunas Baby World order. Enter your order number or tracking ID to see the latest delivery status.',
  path: '/track-order',
});

export default function TrackOrderLayout({ children }) {
  return children;
}
