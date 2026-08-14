/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,   // ✅ ADD THIS LINE
    
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev',                 port: '', pathname: '/**' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com',        port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com',       port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com',       port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;