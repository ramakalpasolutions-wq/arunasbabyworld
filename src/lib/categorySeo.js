// Search-engine text for category and brand landing pages.
// Plain data (no database access) so both server pages and ProductsClient can import it.
// Facts about delivery, COD and exchanges must match src/lib/policies.js.

export const STORE_FACTS = {
  freeDeliveryFrom: 800,
  deliveryCharge: 50,
  codLimit: 4000,
  exchangeDays: 3,
  dispatchDays: '1 to 2 business days',
  deliveryDays: '3 to 7 business days',
};

const F = STORE_FACTS;

// Answers that hold for every category; category FAQs come first
const commonFaqs = (thing) => [
  {
    q: `Do you deliver ${thing} all over India?`,
    a: `Yes. We ship ${thing} to every serviceable pin code in India. Orders are packed within ${F.dispatchDays} and usually arrive in ${F.deliveryDays}. Orders of ₹${F.freeDeliveryFrom} or more get free delivery.`,
  },
  {
    q: 'Is Cash on Delivery available?',
    a: `Yes, Cash on Delivery is available on eligible orders. Outside Guntur it is available up to ₹${F.codLimit.toLocaleString('en-IN')} per order; you can also pay online by UPI, card, net banking or wallet.`,
  },
  {
    q: 'Can I exchange a product?',
    a: `You can request an exchange within ${F.exchangeDays} days of delivery from your order page. Products must be unused with original tags and packaging. See our Refund & Returns Policy for details.`,
  },
];

/**
 * h1: on-page heading. title: <title> text (the site name is added by the layout).
 * description: meta description (≤ 155 characters). intro: paragraphs shown under the products.
 */
const CATEGORY_SEO = {
  clothing: {
    h1: 'Baby & Kids Clothing',
    title: 'Baby & Kids Clothing Online in India - Rompers, Sets, Dresses',
    description: 'Shop soft cotton baby and kids clothing online: rompers, onesies, frocks, t-shirts, night suits and sets for newborns to 8 years. Delivery across India.',
    intro: [
      'Find comfortable, skin-friendly clothing for newborns, infants, toddlers and kids. Our range covers rompers and onesies for the first months, cotton t-shirts, shorts and pyjama sets for everyday play, frocks and party wear for girls, and smart sets for boys.',
      'Brands include Peppermint, Little Bull and Nuluv, and most pieces are made from breathable cotton that is gentle on a baby’s skin. Use the size, gender and price filters to narrow the list, and check each product page for the size chart before you order.',
    ],
    faqs: [
      { q: 'How do I choose the right size for my baby?', a: 'Each product page lists its size range by age. If your baby is between sizes, pick the larger one so the clothes last longer and fit comfortably.' },
    ],
  },
  toys: {
    h1: 'Toys for Babies & Kids',
    title: 'Toys for Babies & Kids Online in India - Learning, Soft & Musical Toys',
    description: 'Buy baby and kids toys online: rattles, soft toys, learning and educational toys, musical toys, puzzles and board games from top brands. Delivery across India.',
    intro: [
      'Play is how little ones learn. Our toy collection includes rattles and teethers for newborns, activity toys and musical toys for babies, stacking, shape-sorting and pretend-play toys for toddlers, and puzzles, board games and building sets for older kids.',
      'You will find toys from trusted brands such as Funskool, Lumo, R for Rabbit and Mirana. Filter by age-appropriate category, brand or price to find the right toy for a birthday gift or everyday play.',
    ],
    faqs: [
      { q: 'Are these toys safe for babies?', a: 'Check the age grading on each product page. Toys for babies under 3 should not have small parts; always supervise young children during play.' },
    ],
  },
  'baby-body-care': {
    h1: 'Baby Body Care & Skin Care',
    title: 'Baby Skin Care Products Online - Lotion, Wash, Oil & Cream',
    description: 'Gentle baby skin care online: baby lotion, body wash, shampoo, massage oil, diaper rash cream and powder from Sebamed, Himalaya, Cetaphil and more.',
    intro: [
      'A baby’s skin is thinner and more sensitive than an adult’s, so it needs mild, specially made products. Shop baby massage oils, lotions, body washes, shampoos, creams, diaper rash creams and powders made for delicate skin.',
      'Our range includes trusted brands such as Sebamed, Mother Sparsh, Himalaya, Cetaphil, Chicco and Mee Mee. Patch-test any new product and talk to your paediatrician if your baby has very dry or reactive skin.',
    ],
    faqs: [],
  },
  'baby-feeding': {
    h1: 'Baby Feeding Essentials',
    title: 'Baby Feeding Bottles, Sippers & Feeding Essentials Online',
    description: 'Shop baby feeding bottles, nipples, sippers, bibs, bowls, spoons, sterilisers and bottle cleaners from Pigeon, Philips Avent, LuvLap and more. Delivery across India.',
    intro: [
      'Everything you need at feeding time, from the first bottle to the first spoon. Shop BPA-free feeding bottles and teats, spill-proof sippers, weaning bowls and spoons, bibs, bottle brushes and sterilisers.',
      'Choose from trusted brands such as Pigeon, Philips Avent, LuvLap and Mee Mee. Replace teats regularly and sterilise bottles for young babies to keep feeding safe.',
    ],
    faqs: [],
  },
  diaper: {
    h1: 'Baby Diapers & Diaper Pants',
    title: 'Buy Baby Diapers & Diaper Pants Online - Pampers, MamyPoko, Huggies',
    description: 'Buy baby diapers and diaper pants online in all sizes, newborn to XXL, from Pampers, MamyPoko, Huggies and more. Value packs and delivery across India.',
    intro: [
      'Keep your baby dry and comfortable day and night. Shop taped diapers for newborns and diaper pants for active babies and toddlers in sizes from NB to XXL, including value packs that cost less per piece.',
      'Pick the size by your baby’s weight shown on the pack. If you notice red marks at the waist or legs, move up a size.',
    ],
    faqs: [
      { q: 'Which diaper size should I buy?', a: 'Diaper sizes are based on weight, which is printed on every pack. Newborn (NB) suits babies up to about 5 kg; move up a size when the diaper leaves marks or leaks.' },
    ],
  },
  'electric-vehicles': {
    h1: 'Kids Electric Cars & Bikes',
    title: 'Kids Electric Cars, Jeeps & Bikes Online - Battery Ride-Ons',
    description: 'Buy battery-operated kids electric cars, jeeps and bikes online with remote control, music and lights. Ride-ons for ages 2 to 8, delivered across India.',
    intro: [
      'Give your child the thrill of their own car. Our battery-operated ride-ons include electric cars, jeeps and bikes with rechargeable batteries, parental remote control, music, horn and LED lights.',
      'Check the recommended age, maximum weight and battery run time on each product page. Most models need a short assembly on arrival.',
    ],
    faqs: [
      { q: 'What age are kids electric cars for?', a: 'Most kids electric cars suit children from about 2 to 8 years. Each product page lists the recommended age and maximum load.' },
    ],
  },
  'ride-on-toys': {
    h1: 'Ride-On Toys for Kids',
    title: 'Ride-On Toys for Kids Online - Push Cars, Rockers & Scooters',
    description: 'Shop ride-on toys for babies and kids: push cars, swing cars, rockers and manual ride-ons that build balance and confidence. Delivery across India.',
    intro: [
      'Ride-on toys help toddlers build balance, leg strength and confidence. Choose from push cars, swing cars, rocking horses and foot-to-floor ride-ons for indoor and outdoor play.',
      'Check the age and weight limit on each product page to choose the right size.',
    ],
    faqs: [],
  },
  cycles: {
    h1: 'Kids Cycles & Tricycles',
    title: 'Kids Cycles & Tricycles Online - BSA, Hercules, All Sizes',
    description: 'Buy kids cycles and tricycles online: baby tricycles with parent handle, balance bikes and bicycles with training wheels from BSA, Hercules and more.',
    intro: [
      'From a first tricycle to a first bicycle. Shop baby tricycles with parent push handles, balance bikes and kids bicycles in 12, 14, 16 and 20 inch sizes with training wheels.',
      'Pick the wheel size by your child’s age and height; each product page lists the recommended range.',
    ],
    faqs: [
      { q: 'Which cycle size is right for my child?', a: 'As a rough guide, 12 inch suits 2 to 4 years, 14 to 16 inch suits 4 to 7 years and 20 inch suits 7 to 10 years. Check the height range on the product page.' },
    ],
  },
  stroller: {
    h1: 'Baby Strollers',
    title: 'Baby Strollers Online in India - Lightweight & Travel Strollers',
    description: 'Shop baby strollers online: lightweight, foldable and travel strollers with recline, canopy and safety harness from R for Rabbit, LuvLap and more.',
    intro: [
      'A good stroller makes every outing easier. Choose from lightweight umbrella strollers, compact travel strollers that fold with one hand, and full-size strollers with multi-position recline, large canopies and storage baskets.',
      'Compare the weight, folded size, recline positions and age range on each product page before you buy.',
    ],
    faqs: [],
  },
  prams: {
    h1: 'Baby Prams',
    title: 'Baby Prams Online - Comfortable Prams for Newborns',
    description: 'Buy baby prams online with flat recline for newborns, canopy and storage. Delivered across India by Arunas Baby World.',
    intro: [
      'Prams give newborns a flat, comfortable place to lie during walks. Browse prams with lie-flat seats, adjustable canopies and storage baskets.',
    ],
    faqs: [],
  },
  'cradles-cribs': {
    h1: 'Baby Cradles & Cribs',
    title: 'Baby Cradles & Cribs Online - Electric Swing Cradles & Wooden Cribs',
    description: 'Shop baby cradles and cribs online: automatic electric swing cradles, wooden cradles, cribs and cots with mosquito nets from Mee Mee, R for Rabbit and more.',
    intro: [
      'Help your baby sleep soundly. Our range includes automatic electric swing cradles with music and remote control, traditional wooden cradles, and cribs and cots with mosquito nets and storage.',
      'Always place your baby on their back to sleep on a firm, flat mattress, and follow the weight limit on each product page.',
    ],
    faqs: [],
  },
  'baby-beds': {
    h1: 'Baby Beds & Bedding',
    title: 'Baby Beds, Bed Sets & Bedding Online in India',
    description: 'Shop baby beds and bedding online: baby bed sets, mattresses, mosquito nets, pillows and sleeping bags for newborns and toddlers. Delivery across India.',
    intro: [
      'Create a safe, cosy sleep space. Browse baby beds and bed sets with mosquito nets, soft mattresses, pillows and sleeping bags for newborns and toddlers.',
    ],
    faqs: [],
  },
  walkers: {
    h1: 'Baby Walkers',
    title: 'Baby Walkers Online - Musical & Activity Walkers',
    description: 'Buy baby walkers online: musical and activity walkers with height adjustment and play trays, plus push walkers for toddlers. Delivery across India.',
    intro: [
      'Walkers keep babies entertained while they practise standing and stepping. Choose from activity walkers with music, lights and play trays, adjustable-height seat walkers and push walkers.',
      'Always use a walker under supervision, on a flat floor and away from stairs.',
    ],
    faqs: [],
  },
  'baby-carriers': {
    h1: 'Baby Carriers',
    title: 'Baby Carriers Online - Ergonomic Front & Hip Seat Carriers',
    description: 'Shop ergonomic baby carriers online: front carriers, hip seat carriers and wraps with padded straps for newborns and toddlers. Delivery across India.',
    intro: [
      'Keep your baby close and your hands free. Choose from ergonomic front carriers, hip seat carriers and multi-position carriers with padded shoulder straps and lumbar support.',
      'Check that the carrier supports your baby’s hips in an “M” position and follow the age and weight guidance on the product page.',
    ],
    faqs: [],
  },
  'brest-pumps': {
    h1: 'Breast Pumps',
    title: 'Breast Pumps Online - Manual & Electric Breast Pumps',
    description: 'Buy manual and electric breast pumps online, plus breast milk storage bags and nursing accessories. Delivery across India.',
    intro: [
      'Make breastfeeding easier. Shop manual breast pumps, single and double electric breast pumps, milk storage bags and nursing accessories from trusted brands.',
    ],
    faqs: [],
  },
  'high-chair': {
    h1: 'Baby High Chairs',
    title: 'Baby High Chairs & Booster Seats Online',
    description: 'Shop baby high chairs and booster seats online with safety harness, adjustable height and removable trays. Delivery across India.',
    intro: [
      'Make mealtimes easier with a sturdy high chair. Choose from adjustable high chairs, foldable high chairs and portable booster seats with safety harnesses and easy-clean trays.',
    ],
    faqs: [],
  },
  'study-table': {
    h1: 'Kids Study Tables & Chairs',
    title: 'Kids Study Table & Chair Sets Online',
    description: 'Buy kids study tables and chair sets online for drawing, homework and play, in sturdy and colourful designs. Delivery across India.',
    intro: [
      'Give your child their own spot to draw, read and do homework. Browse study table and chair sets, activity tables and foldable desks in child-friendly sizes.',
    ],
    faqs: [],
  },
  'skating-scooter': {
    h1: 'Kids Scooters & Skates',
    title: 'Kids Scooters & Skates Online - 3 Wheel Scooters, Skating Shoes',
    description: 'Shop kids scooters and skates online: 3-wheel kick scooters with LED wheels, adjustable skates and protective gear. Delivery across India.',
    intro: [
      'Outdoor fun that builds balance and coordination. Choose 3-wheel kick scooters with adjustable handles and LED wheels, and adjustable skates for beginners. Always use a helmet and pads.',
    ],
    faqs: [],
  },
  'baby-bouncers': {
    h1: 'Baby Bouncers & Rockers',
    title: 'Baby Bouncers & Rockers Online - Soothing Seats for Newborns',
    description: 'Buy baby bouncers and rockers online with vibration, music and toy bars to soothe and entertain newborns. Delivery across India.',
    intro: [
      'A bouncer gives your baby a safe, comfy seat while you get a few minutes free. Browse bouncers and rockers with soothing vibration, music, toy bars and safety harnesses.',
    ],
    faqs: [],
  },
  'bath-tubs': {
    h1: 'Baby Bath Tubs & Bath Seats',
    title: 'Baby Bath Tubs & Bath Seats Online',
    description: 'Shop baby bath tubs, bath seats and bathers online for safe, comfortable bath time from newborn to toddler. Delivery across India.',
    intro: [
      'Bath time made safer and easier. Choose from baby bath tubs, foldable tubs, bath seats and bathers that support your baby. Never leave a baby alone in the bath.',
    ],
    faqs: [],
  },
  'potty-seats': {
    h1: 'Potty Seats & Potty Training',
    title: 'Baby Potty Seats & Potty Training Chairs Online',
    description: 'Buy potty training seats and potty chairs online for toddlers, including toilet seat trainers with handles. Delivery across India.',
    intro: [
      'Make potty training easier with a comfortable potty chair or a toilet seat trainer with handles and a non-slip base.',
    ],
    faqs: [],
  },
  wipes: {
    h1: 'Baby Wipes',
    title: 'Baby Wipes Online - Water Wipes & Gentle Wet Wipes',
    description: 'Shop gentle baby wet wipes and water wipes online in single packs and value packs. Delivery across India.',
    intro: [
      'Gentle wipes for nappy changes, hands and faces. Choose water-based and fragrance-free baby wipes in single packs or value packs.',
    ],
    faqs: [],
  },
  'baby-food': {
    h1: 'Baby Food & Cereals',
    title: 'Baby Food Online - Cereals, Formula & Snacks for Babies',
    description: 'Buy baby food online: infant cereals, formula and healthy snacks from Nestlé, Similac, Aptamil and more. Free delivery in Guntur; delivery across India.',
    intro: [
      'Nutritious food for every stage after six months. Shop infant cereals, baby formula and toddler snacks from trusted brands such as Nestlé, Similac, Dexolac and Aptamil.',
      'Baby food orders get free delivery within Guntur city, and free delivery across India when you buy 2 or more food items. Always check the age guidance and talk to your paediatrician before starting solids.',
    ],
    faqs: [],
  },
  'baby-care': {
    h1: 'Baby Care Products',
    title: 'Baby Care Products Online - Grooming, Hygiene & Health',
    description: 'Shop baby care products online: nail clippers, grooming kits, nasal aspirators, thermometers and hygiene essentials. Delivery across India.',
    intro: [
      'The everyday essentials for looking after a baby: grooming kits, nail clippers, combs, nasal aspirators, thermometers and hygiene products.',
    ],
    faqs: [],
  },
  'personal-care': {
    h1: 'Mother & Baby Personal Care',
    title: 'Mother & Baby Personal Care Products Online',
    description: 'Shop personal care products for mothers and babies online, from trusted brands. Delivery across India.',
    intro: [
      'Care products for new mothers and little ones, from trusted brands.',
    ],
    faqs: [],
  },
};

/** Category text with a sensible fallback for categories without written copy. */
export function categorySeo(category) {
  if (!category) return null;
  const custom = CATEGORY_SEO[category.slug];
  const name = custom?.h1 || category.name;
  const lower = name.toLowerCase();
  return {
    h1: name,
    title: custom?.title || `${name} Online in India - Buy ${name} for Babies & Kids`,
    description:
      custom?.description ||
      `Shop ${lower} online at Arunas Baby World. Trusted brands, great prices and delivery across India, with free delivery on orders of ₹${F.freeDeliveryFrom} or more.`,
    intro: custom?.intro?.length
      ? custom.intro
      : [`Browse our range of ${lower} for babies and kids from trusted brands, with delivery across India.`],
    faqs: [...(custom?.faqs || []), ...commonFaqs(lower)],
  };
}

/** Brand landing text. */
export function brandSeo(brand, categoryNames = []) {
  const cats = categoryNames.slice(0, 4).map((c) => c.toLowerCase());
  const range = cats.length ? ` including ${cats.join(', ')}` : '';
  return {
    h1: `${brand} Products`,
    title: `${brand} Baby Products Online in India - Shop ${brand}`,
    description: `Shop original ${brand} products online at Arunas Baby World${range}. Delivery across India; free delivery on orders of ₹${F.freeDeliveryFrom} or more.`.slice(0, 160),
    intro: [
      `Shop the ${brand} range at Arunas Baby World${range}. Every product is sold new and genuine, with secure online payment or Cash on Delivery on eligible orders.`,
    ],
    faqs: commonFaqs(`${brand} products`),
  };
}

/** Heading used on the main products page. */
export const ALL_PRODUCTS_SEO = {
  h1: 'All Baby & Kids Products',
  intro: [
    'Arunas Baby World is an online baby store based in Guntur, Andhra Pradesh, delivering across India. Shop baby clothing, toys, diapers, feeding essentials, skin care, strollers, cradles, walkers, cycles and kids electric cars from brands such as R for Rabbit, Baybee, LuvLap, Mee Mee, Pigeon, Sebamed, Funskool and Pampers.',
    `Orders of ₹${F.freeDeliveryFrom} or more get free delivery, Cash on Delivery is available on eligible orders, and you can request an exchange within ${F.exchangeDays} days of delivery.`,
  ],
};

// Placeholder brand values that should never get a brand page or link
const PLACEHOLDER_BRANDS = /^(brands?|generic|others?|n\/?a|none|unbranded|no brand|local|-+)$/i;
export const isRealBrand = (label) => Boolean(label) && !PLACEHOLDER_BRANDS.test(String(label).trim());
