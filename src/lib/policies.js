// Text of the store policies. Shown by src/components/policy/PolicyPage.js.
// Each section has a heading and blocks: a string is a paragraph, an array is a bullet list.

export const POLICY_UPDATED = '10 November 2026';

export const STORE = {
  name: 'Arunas Baby World',
  address: 'Koritipadu, Guntur, Andhra Pradesh 522007, India',
  phone: '+91 90529 99659',
  phoneHref: 'tel:+919052999659',
  email: 'arunasbabyworld947@gmail.com',
  website: 'www.arunasbabyworld.com',
};

export const POLICY_LINKS = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Refund & Returns Policy' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
];

export const POLICIES = {
  terms: {
    path: '/terms',
    title: 'Terms & Conditions',
    description:
      'The terms that apply when you browse, register and shop at Arunas Baby World, including orders, pricing, payments, cancellations and use of the website.',
    intro:
      'These terms apply whenever you visit www.arunasbabyworld.com, create an account or place an order with Arunas Baby World ("we", "us", "our"). By using the website you agree to them. If you do not agree, please do not use the website.',
    sections: [
      {
        heading: 'Your account',
        blocks: [
          'You need an account to place orders and to see your order history. Please give accurate details when you register and keep them up to date.',
          [
            'You are responsible for keeping your password private and for activity that happens under your account.',
            'Tell us straight away if you think someone else has used your account.',
            'We may suspend or close an account that is used for fraud, abuse or in breach of these terms.',
          ],
        ],
      },
      {
        heading: 'Products and prices',
        blocks: [
          'We sell baby and kids products such as clothing, toys, baby gear, feeding and care products, baby food and ride-on vehicles. We try to show every product accurately, but colours can look slightly different on your screen and packaging may change.',
          [
            'Prices are in Indian Rupees (₹) and include applicable GST unless stated otherwise.',
            'Prices, offers and stock can change without notice until your order is confirmed.',
            'If a product is listed with an obvious error in price or description, we may cancel the order and refund anything you have paid.',
          ],
        ],
      },
      {
        heading: 'Orders and payment',
        blocks: [
          'Your order is confirmed when you receive an order confirmation from us. We may decline or cancel an order if the product is unavailable, the delivery address cannot be served, payment fails, or we suspect fraud.',
          [
            'Online payments are processed securely by Razorpay. We do not store your card, UPI or net-banking details.',
            'Cash on Delivery (COD) is available on eligible orders and carries an extra handling fee shown at checkout. COD may be limited by order value and delivery location.',
            'Orders containing baby food have a minimum order value, shown in your cart.',
            'Coupons and offers cannot be exchanged for cash and may have their own conditions.',
          ],
        ],
      },
      {
        heading: 'Cancellations',
        blocks: [
          'You can cancel an order from the My Orders page at any time before it is shipped. Once an order has been shipped it can no longer be cancelled; please see our Refund & Returns Policy for what you can do after delivery.',
        ],
      },
      {
        heading: 'Delivery, returns and refunds',
        blocks: [
          'Delivery times and charges are explained in our Shipping Policy. Exchanges, returns and refunds are explained in our Refund & Returns Policy. Both policies form part of these terms.',
        ],
      },
      {
        heading: 'Reviews and content you post',
        blocks: [
          'When you post a review, photo or other content you confirm that it is your own, is honest and does not break the law or the rights of others. You allow us to display it on the website and in our marketing. We may remove content that is offensive, misleading or unrelated to the product.',
        ],
      },
      {
        heading: 'Using the website',
        blocks: [
          [
            'Do not misuse the website, try to gain unauthorised access, or interfere with how it works.',
            'Do not use automated tools to copy content or place orders.',
            'The website design, logo, text and images belong to Arunas Baby World or its suppliers and may not be reused without written permission.',
          ],
        ],
      },
      {
        heading: 'Product safety and advice',
        blocks: [
          'Always follow the age guidance, safety instructions and warnings supplied with each product. Information on this website is general and is not medical advice. For questions about feeding, health or development, please speak to a doctor.',
        ],
      },
      {
        heading: 'Our liability',
        blocks: [
          'We take care to run the website well and to supply products as described. To the extent the law allows, our liability for any order is limited to the amount you paid for that order, and we are not liable for indirect losses. Nothing in these terms removes rights you have under Indian consumer law.',
        ],
      },
      {
        heading: 'Links to other websites',
        blocks: [
          'The website may link to other sites, such as payment or courier tracking pages. We do not control those sites and are not responsible for their content or policies.',
        ],
      },
      {
        heading: 'Changes to these terms',
        blocks: [
          'We may update these terms from time to time. The version on this page applies to orders placed after the date shown above.',
        ],
      },
      {
        heading: 'Governing law',
        blocks: [
          'These terms are governed by the laws of India. Any dispute will be handled by the courts at Guntur, Andhra Pradesh.',
        ],
      },
    ],
  },

  privacy: {
    path: '/privacy',
    title: 'Privacy Policy',
    description:
      'How Arunas Baby World collects, uses, shares and protects your personal information when you visit the website, create an account or place an order.',
    intro:
      'This policy explains what personal information Arunas Baby World collects when you use www.arunasbabyworld.com, why we collect it and the choices you have.',
    sections: [
      {
        heading: 'Information we collect',
        blocks: [
          [
            'Account details: your name, email address, phone number and an encrypted version of your password.',
            'Order details: delivery addresses, the products you buy, order value and payment status.',
            'Messages: anything you send us through the contact form, email, phone or WhatsApp.',
            'Reviews: ratings, text and photos you choose to post.',
            'Usage information: pages you visit, your approximate location or pincode (to show delivery options), and device and browser details.',
          ],
          'Payments are handled by Razorpay. We receive confirmation that a payment succeeded or failed, but we never see or store your full card, UPI PIN or net-banking credentials.',
        ],
      },
      {
        heading: 'How we use your information',
        blocks: [
          [
            'To create and secure your account.',
            'To process, deliver and support your orders, including exchanges and refunds.',
            'To send order updates by email, SMS or WhatsApp.',
            'To answer your questions and resolve complaints.',
            'To prevent fraud and misuse, including a human-verification check on login and registration.',
            'To understand how the website is used and improve it.',
            'To meet legal, tax and accounting requirements.',
          ],
        ],
      },
      {
        heading: 'Who we share it with',
        blocks: [
          'We do not sell your personal information. We share it only with service providers who help us run the store, and only as far as they need it:',
          [
            'Payment partner (Razorpay) to collect payments and issue refunds.',
            'Courier and logistics partners to deliver and pick up parcels.',
            'Hosting, storage, email and security providers that run the website, including Cloudflare for file storage and human verification.',
            'Analytics providers (Google Analytics and Microsoft Clarity) to understand website usage.',
            'Authorities, where the law requires it.',
          ],
        ],
      },
      {
        heading: 'Cookies and similar technologies',
        blocks: [
          'We use cookies and browser storage to keep you signed in, remember your cart, wishlist and location, and measure how the website is used. You can block or delete cookies in your browser settings, but parts of the website, such as login and checkout, may then stop working.',
        ],
      },
      {
        heading: 'How long we keep it',
        blocks: [
          'We keep account information for as long as your account is open. Order and invoice records are kept for as long as tax and accounting laws require. Other information is kept only as long as it is needed for the purposes above.',
        ],
      },
      {
        heading: 'How we protect it',
        blocks: [
          'Passwords are stored in encrypted (hashed) form, the website is served over a secure connection, and access to customer information is limited to people who need it for their work. No online service can be completely secure, so please use a strong password and keep it private.',
        ],
      },
      {
        heading: 'Your choices and rights',
        blocks: [
          [
            'You can view and update your name, phone number and addresses from your profile.',
            'You can ask us for a copy of the personal information we hold about you, or ask us to correct it.',
            'You can ask us to delete your account. We will delete or anonymise your information except where we must keep it by law, for example invoices.',
            'You can opt out of promotional messages at any time. We will still send messages about your orders.',
          ],
          'To make any of these requests, contact us using the details at the bottom of this page.',
        ],
      },
      {
        heading: 'Children',
        blocks: [
          'Our products are for children, but the website is meant for adults. We do not knowingly collect personal information from anyone under 18. Orders should be placed by a parent or guardian.',
        ],
      },
      {
        heading: 'Changes to this policy',
        blocks: [
          'We may update this policy when our practices or the law change. The date at the top of this page shows when it was last updated.',
        ],
      },
    ],
  },

  refund: {
    path: '/refund-policy',
    title: 'Refund & Returns Policy',
    description:
      'How cancellations, exchanges, returns and refunds work at Arunas Baby World, including the 3-day exchange window and refund timelines.',
    intro:
      'We want you and your little one to be happy with every purchase. This policy explains how to cancel an order, exchange a product or get a refund.',
    sections: [
      {
        heading: 'Cancelling an order',
        blocks: [
          'You can cancel an order from the My Orders page at any time before it is shipped. If you have already paid online, the full amount is refunded to your original payment method. Once the order has been shipped it can no longer be cancelled.',
        ],
      },
      {
        heading: 'Exchanges',
        blocks: [
          'You can request an exchange within 3 days of delivery from the order page in your account. Requests made after 3 days cannot be accepted.',
          'We accept exchange requests for these reasons:',
          [
            'Size issue: the product is too big or too small.',
            'The colour is different from the photo.',
            'A wrong product was delivered.',
            'The product arrived damaged or defective.',
            'A quality issue: the product is not as described.',
            'You would like a different variant of the same product.',
          ],
          'After we approve the request, our courier partner picks up the original product, usually within 2 to 3 business days, and the replacement is sent to you. If the replacement costs less, we refund the difference to your original payment method. If it costs more, you pay the difference before it is shipped.',
        ],
      },
      {
        heading: 'Condition of returned products',
        blocks: [
          [
            'The product must be unused, unwashed and in the condition you received it.',
            'Original tags, labels, accessories, free gifts and packaging must be included.',
            'Products bought as a combo or set must be returned complete.',
            'Please keep the invoice or order number handy, and share clear photos or an unboxing video if the product is damaged or wrong.',
          ],
          'We inspect every returned product. If it does not meet these conditions we may decline the exchange or refund and send the product back to you.',
        ],
      },
      {
        heading: 'Products that cannot be returned',
        blocks: [
          'For hygiene and safety reasons, the following cannot be exchanged or returned unless they arrive damaged, defective, expired or different from what you ordered:',
          [
            'Baby food, formula and other consumables.',
            'Diapers, wipes and opened skin care, bath or health care products.',
            'Feeding bottles, nipples, pacifiers, breast pumps and similar items once opened.',
            'Innerwear and products marked as non-returnable on the product page.',
          ],
        ],
      },
      {
        heading: 'Refunds',
        blocks: [
          'A refund is issued when you cancel a prepaid order before shipping, when we cannot fulfil an order, or when we approve a refund request for a product that arrived damaged, defective or different from what you ordered. You can raise a refund request from the order page in your account.',
          [
            'Online payments (card, UPI, net banking, wallet) are refunded to the original payment method. Refunds are normally started within a few hours of approval and can take 5 to 7 business days to appear, depending on your bank.',
            'Cash on Delivery orders are refunded to the bank account or UPI ID you give us, usually within 5 to 7 business days of approval.',
            'Shipping charges and the COD handling fee are refunded only when the return is due to our error, such as a wrong or damaged product.',
          ],
        ],
      },
      {
        heading: 'Late or missing refunds',
        blocks: [
          'If the refund has not reached you after 7 business days, please check with your bank or card provider first, as they sometimes take extra time to post it. If it is still missing, contact us with your order number and we will trace it for you.',
        ],
      },
      {
        heading: 'Damaged or wrong parcels',
        blocks: [
          'If the outer package looks tampered with, please do not accept it. If you find damage or a wrong product after opening, tell us within 3 days of delivery with photos or a video so we can put it right quickly.',
        ],
      },
    ],
  },

  shipping: {
    path: '/shipping-policy',
    title: 'Shipping Policy',
    description:
      'Delivery areas, shipping charges, free delivery, Cash on Delivery and delivery timelines for orders from Arunas Baby World.',
    intro:
      'We deliver across India through trusted courier partners, with faster delivery for customers in Guntur. This policy explains charges, timelines and what to expect.',
    sections: [
      {
        heading: 'Where we deliver',
        blocks: [
          'We ship to most pincodes in India. Enter your pincode on the website to check whether we can deliver to you. We do not ship outside India at present.',
        ],
      },
      {
        heading: 'Shipping charges',
        blocks: [
          'The exact charge for your order is always shown in the cart and at checkout before you pay.',
          [
            'Orders of ₹800 or more: free standard delivery.',
            'Orders below ₹800: a standard delivery charge of ₹50.',
            'Cash on Delivery: an extra handling fee of ₹20 per order.',
            'Baby food orders: free delivery within Guntur city. Outside Guntur, baby food orders ship free when you buy 2 or more food items; otherwise the standard ₹50 charge applies.',
          ],
          'Charges and thresholds may change during offers. The amount shown at checkout is the one that applies to your order.',
        ],
      },
      {
        heading: 'Cash on Delivery',
        blocks: [
          'Cash on Delivery is available on eligible orders. Outside Guntur city, COD is available for orders up to ₹4,000; larger orders need to be paid online. Please keep the exact amount ready at delivery.',
        ],
      },
      {
        heading: 'Processing and delivery time',
        blocks: [
          [
            'Orders are usually packed and handed to the courier within 1 to 2 business days.',
            'Delivery within Guntur usually takes 1 to 2 days after dispatch.',
            'Delivery to the rest of India usually takes 3 to 7 business days after dispatch, depending on your location.',
          ],
          'These are estimates, not guarantees. Deliveries can take longer during festivals, sales, bad weather, strikes or other events outside our control. Orders are not dispatched on Sundays and public holidays.',
        ],
      },
      {
        heading: 'Tracking your order',
        blocks: [
          'Once your order ships we send you the tracking details. You can also follow it at any time from the Track Order page or from My Orders in your account.',
        ],
      },
      {
        heading: 'Delivery address',
        blocks: [
          'Please check your address, pincode and phone number carefully before placing the order. If you notice a mistake, contact us immediately; we can correct it only before the order is shipped. We are not responsible for delays or non-delivery caused by an incorrect or incomplete address.',
        ],
      },
      {
        heading: 'Failed delivery and returned parcels',
        blocks: [
          'The courier will usually try to deliver more than once. If the parcel comes back to us because nobody was available, the address was wrong or the delivery was refused, we will contact you. Re-shipping may carry an additional delivery charge. For prepaid orders that you no longer want, we refund the order value less the shipping costs we incurred.',
        ],
      },
      {
        heading: 'Damaged or missing items',
        blocks: [
          'If the package looks tampered with, please do not accept it. If something is damaged or missing when you open the parcel, tell us within 3 days of delivery with photos so we can help. See our Refund & Returns Policy for details.',
        ],
      },
      {
        heading: 'Out-of-stock items',
        blocks: [
          'If an item in your order turns out to be unavailable, we will tell you and either ship the remaining items or cancel and refund the unavailable part, whichever you prefer.',
        ],
      },
    ],
  },
};
