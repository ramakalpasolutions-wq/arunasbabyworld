// ✅ Load .env file FIRST - top of file!
require('dotenv').config({ path: './.env' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    console.log('📂 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Missing');

    // Delete existing wrong admin
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@firstcry.com' }
    });

    if (existing) {
      await prisma.user.delete({
        where: { email: 'admin@firstcry.com' }
      });
      console.log('🗑️  Old admin deleted!');
    }

    // Create fresh admin with bcryptjs
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Verify hash format
    console.log('🔐 Hash format:', hashedPassword.substring(0, 7));

    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@firstcry.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        avatar: '',
        wishlist: [],
      }
    });

    // Verify password works
    const verify = await bcrypt.compare('admin123', admin.password);
    console.log('✅ Password verify test:', verify ? 'PASS ✅' : 'FAIL ❌');

    console.log('\n🎉 Admin created successfully!');
    console.log('📧 Email    : admin@firstcry.com');
    console.log('🔑 Password : admin123');
    console.log('👤 Role     : admin');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected');
  }
}

createAdmin();