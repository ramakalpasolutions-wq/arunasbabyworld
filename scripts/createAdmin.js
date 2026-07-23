// scripts/createAdmin.js

// ✅ Load .env file FIRST - top of file!
require('dotenv').config({ path: './.env' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ✅ Single source of truth — ALL LOWERCASE EMAIL
const ADMIN_EMAIL    = 'arunasbabyworld@gmail.com';  // ← all lowercase!
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME     = 'Admin User';

async function createAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    console.log('📂 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Missing');

    // ✅ Delete BOTH lowercase and capital versions (cleanup)
    const deleted = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'arunasbabyworld@gmail.com' },
          { email: 'Arunasbabyworld@gmail.com' },
        ],
      },
    });

    if (deleted.count > 0) {
      console.log(`🗑️  Deleted ${deleted.count} existing admin user(s)`);
    } else {
      console.log('ℹ️  No existing admin found — creating fresh');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    console.log('🔐 Hash format:', hashedPassword.substring(0, 7));

    const admin = await prisma.user.create({
      data: {
        name:     ADMIN_NAME,
        email:    ADMIN_EMAIL,         // ✅ stored as lowercase
        password: hashedPassword,
        role:     'admin',
        isActive: true,
        avatar:   '',
        wishlist: [],
      },
    });

    // Verify password works
    const verify = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
    console.log('✅ Password verify test:', verify ? 'PASS ✅' : 'FAIL ❌');

    console.log('\n🎉 Admin created successfully!');
    console.log('📧 Email    :', ADMIN_EMAIL);
    console.log('🔑 Password :', ADMIN_PASSWORD);
    console.log('👤 Role     : admin');
    console.log('🆔 ID       :', admin.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected');
  }
}

createAdmin();