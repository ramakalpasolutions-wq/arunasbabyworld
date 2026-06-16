'use client';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60}        // Refetch session every 5 min
      refetchOnWindowFocus={true}     // Refetch when tab focused
    >
      {children}
    </SessionProvider>
  );
}