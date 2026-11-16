# 🍼 Arunas Baby World

Full-stack eCommerce store for baby & kids products, built with **Next.js 16 (App Router)**, **Prisma on MongoDB**, NextAuth, Razorpay, NimbusPost and Cloudflare R2.

---

## 🚀 Features

### Storefront
- Hero banners, offer popups and home sections managed from admin
- Product listing with filters, search, sorting and pagination
- Product detail with gallery, reviews and per-product OG share images
- Cart, coupons (category- and brand-aware), wishlist
- Checkout with Razorpay or Cash on Delivery (with Guntur-specific rules)
- Order history, tracking, cancellation, returns/refunds and exchanges
- Accounts with Turnstile-protected sign-up and email password reset
- SEO: sitemap, robots, structured metadata; Google Analytics

### Admin (`/admin`)
- Dashboard, visitor heatmap and GST reports
- Products (incl. bulk Excel upload), categories, brands, banners, offer popups
- Orders, failed payments, manual payment confirmation, invoices (PDF)
- Refunds (Razorpay auto-refund or manual UPI/bank), exchanges
- Coupons, Guntur food discounts, reviews, users, contact messages, store settings

---

## ⚙️ Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MongoDB connection string (used by Prisma) |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `JWT_SECRET` | Authentication |
| `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL` | Image storage |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payments |
| `NIMBUS_BASE_URL`, `NIMBUS_API_KEY`, `NIMBUS_API_SECRET`, `NIMBUS_WAREHOUSE_ID`, `NIMBUS_WAREHOUSE_NAME`, `NIMBUS_PICKUP_PINCODE` | Shipping (NimbusPost v2) |
| `NIMBUS_DEFAULT_WEIGHT`, `NIMBUS_DEFAULT_LENGTH`, `NIMBUS_DEFAULT_BREADTH`, `NIMBUS_DEFAULT_HEIGHT`, `NIMBUS_COURIER_ID`, `NIMBUS_AUTO_BOOK` | Shipping defaults (optional) |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Email (SMTP) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile captcha |
| `NEXT_PUBLIC_GA_ID` | Google Analytics (optional) |
| `NEXT_PUBLIC_SITE_URL` | Public site address used in canonical links, sitemap and feeds (default `https://www.arunasbabyworld.com`) |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | Search Console / Bing Webmaster ownership codes (optional) |

### 3. Database

```bash
npx prisma generate
node scripts/seed.js          # optional sample data
node scripts/createAdmin.js   # create/reset the admin account
node scripts/addIndexes.js    # create MongoDB indexes
```

Change the default admin password from the scripts immediately after first login.

### 4. Run

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

---

## 📁 Project Structure

```
prisma/schema.prisma   Data model (MongoDB)
scripts/               seed, createAdmin, addIndexes
src/
├── app/
│   ├── api/           Route handlers (auth, products, orders, payment, shipping,
│   │                  refunds, exchanges, coupons, reviews, upload, admin/*)
│   ├── admin/         Admin panel pages
│   ├── og/            Dynamic Open Graph images
│   └── …              Storefront pages (page.js = server, *Client.js = client)
├── components/        layout, home, products, reviews, admin, auth
├── context/           Cart, Wishlist, Location providers
├── hooks/             useScrollReveal
├── lib/               prisma, auth, razorpay, coupons, nimbuspost, r2, nodemailer,
│                      invoiceGenerator, checkoutRules, seo, turnstile, …
└── styles/            globals.css
```

---

## 🔒 Payment integrity

Order totals are always computed on the server:

- `POST /api/orders` uses catalog prices from the database, recomputes the coupon
  discount (`src/lib/coupons.js`), and always creates orders as unpaid / `Pending`.
- `POST /api/payment/create-order` takes only an `orderId` and charges that order's
  saved `totalPrice`.
- `POST /api/payment/verify` checks the Razorpay signature, that the order belongs
  to the user, and that the Razorpay order was created for this order and amount.

---

## 🚢 Deployment

Deploy on Vercel (or any Node host). Add all environment variables in the host's
dashboard; `npm run build` runs `prisma generate` automatically.
