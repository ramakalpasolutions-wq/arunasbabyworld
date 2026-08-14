const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categories = [
  { name: 'Clothing', slug: 'clothing', description: 'Baby and kids clothing', icon: '👕', color: '#ff6b9d', order: 1 },
  { name: 'Toys & Games', slug: 'toys-games', description: 'Educational and fun toys', icon: '🧸', color: '#7c3aed', order: 2 },
  { name: 'Baby Gear', slug: 'baby-gear', description: 'Strollers, car seats and more', icon: '🍼', color: '#0ea5e9', order: 3 },
  { name: 'Feeding', slug: 'feeding', description: 'Bottles, bibs and baby food', icon: '🥛', color: '#10b981', order: 4 },
  { name: 'Health & Safety', slug: 'health-safety', description: 'Baby care products', icon: '🏥', color: '#f59e0b', order: 5 },
  { name: 'Nursery', slug: 'nursery', description: 'Cribs, bedding and decor', icon: '🛏️', color: '#ef4444', order: 6 },
  { name: 'Books', slug: 'books', description: 'Baby and kids books', icon: '📚', color: '#8b5cf6', order: 7 },
  { name: 'Outdoor', slug: 'outdoor', description: 'Outdoor and sports gear', icon: '🌿', color: '#059669', order: 8 },
];

const banners = [
  { title: 'New Arrivals for Little Stars', subtitle: 'Discover premium baby clothing', buttonText: 'Shop Now', buttonLink: '/products', bgColor: 'linear-gradient(135deg, #ff6b9d, #7c3aed)', order: 1 },
  { title: 'Toys That Spark Imagination', subtitle: 'Educational toys for every age', buttonText: 'Explore Toys', buttonLink: '/products?category=toys-games', bgColor: 'linear-gradient(135deg, #f59e0b, #ef4444)', order: 2 },
  { title: 'Safe. Stylish. Comfortable.', subtitle: 'Baby gear designed with love', buttonText: 'Shop Baby Gear', buttonLink: '/products?category=baby-gear', bgColor: 'linear-gradient(135deg, #10b981, #0ea5e9)', order: 3 },
];

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Clear existing data
    await prisma.order.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.banner.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@firstcry.com',
        password: adminPassword,
        role: 'admin',
      },
    });
    console.log('👤 Admin created: admin@firstcry.com / admin123');

    // Create categories
    const createdCats = [];
    for (const cat of categories) {
      const created = await prisma.category.create({ data: cat });
      createdCats.push(created);
    }
    console.log(`🗂️  Created ${createdCats.length} categories`);

    // Create banners
    for (const banner of banners) {
      await prisma.banner.create({ data: banner });
    }
    console.log(`🖼️  Created ${banners.length} banners`);

    // Create products
    const productSamples = [
      { name: 'Organic Cotton Onesie Set', price: 899, discountPrice: 599, stock: 50, isFeatured: true, isTrending: true },
      { name: 'Musical Stacking Rings', price: 1299, discountPrice: 899, stock: 30, isFeatured: true, isTrending: false },
      { name: 'Premium Baby Stroller', price: 15999, discountPrice: 12999, stock: 10, isFeatured: true, isTrending: true },
      { name: 'Anti-colic Feeding Bottles', price: 1599, discountPrice: 1199, stock: 45, isFeatured: false, isTrending: true },
      { name: 'Baby Monitor with Camera', price: 8999, discountPrice: 6999, stock: 15, isFeatured: true, isTrending: false },
      { name: 'Wooden Activity Cube', price: 2199, discountPrice: 1599, stock: 25, isFeatured: false, isTrending: true },
      { name: 'Newborn Gift Hamper', price: 3999, discountPrice: 2999, stock: 20, isFeatured: true, isTrending: true },
      { name: 'Baby Einstein Soft Plush', price: 799, discountPrice: 549, stock: 60, isFeatured: false, isTrending: false },
    ];

    for (let i = 0; i < productSamples.length; i++) {
      const p = productSamples[i];
      await prisma.product.create({
        data: {
          name: p.name,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now() + i,
          description: `${p.name} is a premium quality product designed for babies.`,
          shortDescription: 'Premium quality baby product',
          price: p.price,
          discountPrice: p.discountPrice,
          discountPercent: Math.round(((p.price - p.discountPrice) / p.price) * 100),
          stock: p.stock,
          sku: `FC-${Date.now()}-${i}`,
          categoryId: createdCats[i % createdCats.length].id,
          images: [{ url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400' }],
          tags: ['baby', 'kids'],
          features: ['BIS certified', 'Non-toxic', 'Easy to clean'],
          isFeatured: p.isFeatured,
          isTrending: p.isTrending,
          rating: 3.5 + Math.random() * 1.5,
          numReviews: Math.floor(Math.random() * 50) + 5,
        },
      });
    }
    console.log(`📦 Created ${productSamples.length} products`);

    console.log('\n🎉 Seeding complete!');
    console.log('🔑 Admin: admin@firstcry.com / admin123');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();