'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// ⬇️ Replace with your actual WhatsApp business number (country code + number)
const WHATSAPP_NUMBER = '919966543759'; 
const DEFAULT_MESSAGE = 'Hi! I need help with an order from Arunas Baby World 👶';

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Hide on admin pages
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, [isAdmin]);

  if (isAdmin || !visible) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Hover Tooltip */}
      <span
        style={{
          background: '#1F2937',
          color: '#FFFFFF',
          padding: '8px 14px',
          borderRadius: '10px',
          fontSize: '0.82rem',
          fontWeight: '800',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(8px)',
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        Need help? Chat with us! 💬
      </span>

      {/* Button */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: hovered
            ? '0 10px 28px rgba(37, 211, 102, 0.6)'
            : '0 6px 20px rgba(37, 211, 102, 0.45)',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s ease',
          textDecoration: 'none',
          position: 'relative',
        }}
      >
        {/* WhatsApp Icon */}
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.582.413 3.125 1.196 4.482L3 21l4.608-1.209a8.927 8.927 0 0 0 4.443 1.185h.004c4.947 0 8.975-4.027 8.977-8.977 0-2.398-.934-4.653-2.629-6.366zM12.053 19.467h-.003a7.444 7.444 0 0 1-3.795-1.042l-.272-.162-2.822.74.753-2.75-.177-.282a7.433 7.433 0 0 1-1.141-3.987c.002-4.108 3.345-7.45 7.456-7.45 1.989 0 3.859.775 5.264 2.181a7.402 7.402 0 0 1 2.176 5.267c-.002 4.108-3.344 7.452-7.444 7.452zm4.084-5.578c-.224-.112-1.325-.654-1.53-.728-.205-.075-.355-.112-.504.112-.15.224-.579.729-.71.878-.13.15-.262.168-.486.056-.224-.112-.947-.349-1.804-1.113-.667-.595-1.117-1.329-1.248-1.554-.13-.225-.014-.347.098-.458.101-.1.224-.262.336-.393.112-.131.15-.224.224-.374.075-.15.038-.281-.019-.393-.056-.112-.504-1.216-.69-1.664-.182-.437-.367-.378-.504-.385l-.43-.008c-.15 0-.393.056-.598.281-.205.224-.785.767-.785 1.871 0 1.104.803 2.17 0.915 2.32.112.15 1.58 2.412 3.828 3.382.535.231.953.369 1.278.472.537.17 1.026.146 1.413.088.431-.064 1.325-.542 1.512-1.066.187-.524.187-.973.13-.1066-.056-.093-.205-.15-.429-.262z"
            fill="#FFFFFF"
          />
        </svg>
      </a>
    </div>
  );
}