/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ✅ ADD - Cloudflare R2
      {
        protocol: 'https',
        hostname: 'pub-5ca724d37858415daca5c5362ec47065.r2.dev',
        port: '',
        pathname: '/**',
      },
      // ⚠️ KEEP - Until all old Cloudinary images are replaced
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      // ✅ Existing ones kept
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;