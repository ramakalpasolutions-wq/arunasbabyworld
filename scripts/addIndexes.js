const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addIndexes() {
  console.log('⏳ Connecting and creating MongoDB indexes via Prisma...');

  try {
    // 1. Order Indexes (speeds up Admin Dashboard & Orders queries)
    console.log('📦 Indexing Order collection...');
    await prisma.$runCommandRaw({
      createIndexes: 'Order',
      indexes: [
        { key: { createdAt: -1 }, name: 'Order_createdAt_desc' },
        { key: { userId: 1, createdAt: -1 }, name: 'Order_userId_createdAt' },
        { key: { orderStatus: 1 }, name: 'Order_orderStatus' },
        { key: { paymentStatus: 1 }, name: 'Order_paymentStatus' },
        { key: { orderNumber: -1 }, name: 'Order_orderNumber' },
      ],
    });
    console.log('✅ Orders indexed successfully');

    // 2. Product Indexes (speeds up catalog, filters, brand & category searches)
    console.log('🛍️ Indexing Product collection...');
    await prisma.$runCommandRaw({
      createIndexes: 'Product',
      indexes: [
        { key: { isActive: 1, categoryId: 1 }, name: 'Product_isActive_categoryId' },
        { key: { isActive: 1, brand: 1 }, name: 'Product_isActive_brand' },
        { key: { isActive: 1, isFeatured: 1 }, name: 'Product_isActive_isFeatured' },
        { key: { isActive: 1, isTrending: 1 }, name: 'Product_isActive_isTrending' },
        { key: { stock: 1 }, name: 'Product_stock' },
        { key: { createdAt: -1 }, name: 'Product_createdAt' },
      ],
    });
    console.log('✅ Products indexed successfully');

    // 3. Category Indexes
    console.log('🗂️ Indexing Category collection...');
    await prisma.$runCommandRaw({
      createIndexes: 'Category',
      indexes: [
        { key: { isActive: 1, order: 1 }, name: 'Category_isActive_order' },
      ],
    });
    console.log('✅ Categories indexed successfully');

    // 4. Coupon Indexes
    console.log('🎟️ Indexing Coupon collection...');
    await prisma.$runCommandRaw({
      createIndexes: 'Coupon',
      indexes: [
        { key: { isActive: 1, expiryDate: 1 }, name: 'Coupon_isActive_expiryDate' },
      ],
    });
    console.log('✅ Coupons indexed successfully');

    console.log('\n🚀 ALL INDEXES CREATED SUCCESSFULLY!');
    console.log('Your database queries will now run in milliseconds instead of seconds.');
  } catch (err) {
    console.error('❌ Error creating indexes:', err);
  } finally {
    await prisma.$disconnect();
    console.log('🔒 Prisma disconnected.');
  }
}

addIndexes();