# 🍼 BabyBliss - Full-Stack eCommerce Platform

A premium, production-ready eCommerce platform for baby & kids products built with **Next.js 14 App Router**, MongoDB, NextAuth, Razorpay, and Cloudinary.

---

## 🚀 Features

### User-Facing
- 🎠 Dynamic Hero Banner Slider (managed from admin)
- 🗂️ Category-based product browsing with mega menu
- 📦 Product listing with filters, search, sorting & pagination
- 🔍 Product detail with image gallery, 3D tilt, reviews
- 🛒 Cart with coupon system and price calculations
- 💳 Checkout with Razorpay payment integration
- ❤️ Wishlist with localStorage persistence
- 👤 User auth (login / register)
- 📱 Fully responsive design

### Admin Dashboard (`/admin/dashboard`)
- 📊 Dashboard with live stats
- 📦 Product CRUD with image upload (Cloudinary)
- 🗂️ Category management
- 🖼️ Banner management
- 🎟️ Coupon system (%, fixed, expiry, limits)
- 🛍️ Order management with status updates
- 👥 User management

### Pages
- `/` — Homepage
- `/products` — Products listing with filters
- `/products/[id]` — Product detail
- `/cart` — Shopping cart
- `/checkout` — Multi-step checkout with Razorpay
- `/about` — About page with animated counters
- `/contact` — Contact form with Google Maps
- `/wishlist` — Saved products
- `/login`, `/register` — Authentication
- `/admin/dashboard` — Admin panel

---

## ⚙️ Setup Instructions

### 1. Clone and install

\`\`\`bash
cd firstcry-clone
npm install
\`\`\`

### 2. Configure environment variables

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Fill in your values:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Random secret string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as above (public) |
| `EMAIL_USER` | Gmail address for Nodemailer |
| `EMAIL_PASS` | Gmail app password |

### 3. Seed the database (optional)

\`\`\`bash
node scripts/seed.js
\`\`\`

This creates:
- Admin user: `admin@firstcry.com` / `admin123`
- 8 categories, 3 banners, 8 sample products

### 4. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

\`\`\`
src/
├── app/
│   ├── api/              # All API routes
│   │   ├── auth/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── banners/
│   │   ├── orders/
│   │   ├── coupons/
│   │   ├── payment/
│   │   ├── contact/
│   │   └── upload/
│   ├── admin/            # Admin dashboard
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── banners/
│   │   ├── orders/
│   │   └── coupons/
│   ├── products/         # Product pages
│   ├── cart/
│   ├── checkout/
│   ├── about/
│   ├── contact/
│   ├── wishlist/
│   ├── login/
│   └── register/
├── components/
│   ├── layout/           # Header, Footer, MainLayout
│   ├── home/             # HeroBanner
│   ├── products/         # ProductCard
│   └── admin/            # AdminSidebar, AdminGuard
├── context/              # CartContext, WishlistContext
├── hooks/                # useScrollReveal
├── lib/                  # dbConnect, cloudinary, nodemailer, auth
├── models/               # User, Product, Category, Order, Banner, Coupon
└── styles/               # globals.css
\`\`\`

---

## 🎨 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework with App Router |
| **MongoDB + Mongoose** | Database |
| **NextAuth.js** | Authentication |
| **Razorpay** | Payment gateway |
| **Cloudinary** | Image storage |
| **Nodemailer** | Email sending |
| **CSS Modules** | Component-level styling |
| **React Hot Toast** | Notifications |

---

## 🔑 Default Admin Credentials

After running the seed script:
- **Email:** admin@firstcry.com
- **Password:** admin123

---

## 🚢 Deployment

### Vercel (Recommended)
\`\`\`bash
npm run build
vercel --prod
\`\`\`

Add all environment variables in Vercel dashboard.

---

## 📝 License

MIT — Built with ❤️ for the BabyBliss project.
