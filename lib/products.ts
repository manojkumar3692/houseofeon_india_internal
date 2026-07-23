export type ProductReview = {
  name: string;
  city: string;
  rating: number;
  text: string;
};

export type ProductScentProfile = {
  opening: string;
  heart: string;
  dryDown: string;
  performance: string;
};

export type ProductHighlight = {
  title: string;
  text: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  gender: "Men" | "Women" | "Unisex";
  size: string;
  concentration: string;
  price: number;
  mrp?: number;
  description: string;
  longDescription: string;
  notes: string[];
  mood: string[];
  occasion: string[];
  image: string;
  gallery?: string[];

  rating?: number;
  reviewCount?: number;
  ratingText?: string;
  valueLine?: string;
  highlights?: ProductHighlight[];
  scentProfile?: ProductScentProfile;
  reviews?: ProductReview[];

  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
};

export const products: Product[] = [
  {
    id: "desert-tonka",
    slug: "desert-tonka-perfume",
    name: "Desert Tonka",
    shortName: "DESERT TONKA",
    tagline: "Warmth in Every Breath",
    gender: "Men",
    size: "50ml",
    concentration: "Extrait de Parfum",
    price: 999,
    mrp: 1499,
    description:
      "A warm, rich and magnetic perfume built around tonka-style depth, desert woods and premium masculine elegance.",
    longDescription:
      "Desert Tonka by House of Eon is made for men who prefer warmth, depth and quiet luxury. It carries a rich, smooth and confident character that works beautifully for evenings, dates, celebrations and premium daily wear.",
    notes: ["Tonka", "Amber", "Warm Woods", "Spice", "Vanilla Touch"],
    mood: ["Warm", "Rich", "Masculine", "Luxury", "Magnetic"],
    occasion: ["Evening", "Date Night", "Festive Wear", "Winter", "Gifting"],
    image: "/products/desert-tonka.png",
    gallery: ["/products/desert-tonka.png"],

    rating: 5,
    reviewCount: 0,
    ratingText: "Loved by early customers",
    valueLine:
      "A warm, rich perfume for men who prefer depth, smoothness and quiet luxury.",
    highlights: [
      {
        title: "Warm luxury",
        text: "A rich tonka-style perfume with amber warmth and smooth woody depth.",
      },
      {
        title: "Evening ready",
        text: "Made for dates, celebrations, festive wear and premium night plans.",
      },
      {
        title: "Magnetic presence",
        text: "A confident scent profile that feels rich without being too loud.",
      },
    ],
    scentProfile: {
      opening:
        "Warm spice and a smooth sweet lift that creates a rich first impression.",
      heart:
        "Tonka-style warmth with amber depth and a soft vanilla touch.",
      dryDown:
        "Warm woods and smooth masculine depth that feel premium and magnetic.",
      performance:
        "Designed for evening wear, festive moments and cooler weather. Performance can vary based on skin, weather and number of sprays.",
    },
    reviews: [],

    seoTitle:
      "Desert Tonka Perfume for Men | Warm Long Lasting Luxury Perfume India",
    seoDescription:
      "Buy Desert Tonka by House of Eon, a warm long lasting perfume for men in India with rich tonka, amber and woody luxury notes. Perfect for evenings, dates and gifting.",
    seoKeywords: [
      "desert tonka perfume",
      "tonka perfume for men",
      "warm perfume for men",
      "long lasting perfume for men in India",
      "luxury perfume for men India",
      "House of Eon Desert Tonka",
    ],
  },
  {
    id: "arctic-wave",
    slug: "arctic-wave-perfume",
    name: "Arctic Wave",
    shortName: "ARCTIC WAVE",
    tagline: "Cool Confidence. Endless Appeal.",
    gender: "Men",
    size: "50ml",
    concentration: "Extrait de Parfum",
    price: 999,
    mrp: 1499,
    description:
      "A cool, fresh and clean perfume inspired by icy waves, crisp air and effortless confidence.",
    longDescription:
      "Arctic Wave by House of Eon is a fresh modern perfume for men who like clean confidence. It feels cool, aquatic and sharp, making it ideal for office, college, summer days, gym-to-outing moments and daily wear.",
    notes: [
      "Aquatic Notes",
      "Citrus",
      "Fresh Air",
      "Marine Accord",
      "Clean Woods",
    ],
    mood: ["Fresh", "Cool", "Clean", "Confident", "Modern"],
    occasion: ["Office", "College", "Daily Wear", "Summer", "Daytime"],
    image: "/products/arctic-wave.png",
    gallery: [
      "/products/arctic-wave-lifestyle-2.png",
      "/products/arctic-wave-lifestyle-3.png",
      "/products/arctic-wave.png",
      "/products/arctic-wave-lifestyle-1.png",
      "/products/arctic-wave-lifestyle-4.png",
    ],

    rating: 5,
    reviewCount: 0,
    ratingText: "Loved by early customers",
    valueLine:
      "A fresh aquatic perfume made for Indian weather, daily wear and clean confidence.",
    highlights: [
      {
        title: "Fresh daily wear",
        text: "Clean aquatic freshness that works for office, college and everyday use.",
      },
      {
        title: "Made for heat",
        text: "A cool scent profile that feels easy to wear in Indian weather.",
      },
      {
        title: "Clean confidence",
        text: "Fresh, modern and polished without feeling heavy.",
      },
    ],
    scentProfile: {
      opening:
        "A crisp citrus and aquatic opening that feels cool and refreshing.",
      heart:
        "Marine freshness with clean air-like clarity and a modern fresh mood.",
      dryDown:
        "Clean woods that keep the fragrance smooth, wearable and confident.",
      performance:
        "Designed for daytime, office, college and warm weather. Performance can vary based on skin, weather and number of sprays.",
    },
    reviews: [],

    seoTitle:
      "Arctic Wave Perfume for Men | Fresh Long Lasting Perfume India",
    seoDescription:
      "Buy Arctic Wave by House of Eon, a fresh cool long lasting perfume for men in India with aquatic, citrus and clean woody notes. Perfect for office, college and daily wear.",
    seoKeywords: [
      "arctic wave perfume",
      "fresh perfume for men",
      "cool perfume for men",
      "aquatic perfume for men India",
      "office perfume for men",
      "long lasting fresh perfume India",
    ],
  },
  {
    id: "zyrox",
    slug: "zyrox-perfume",
    name: "Zyrox",
    shortName: "ZYROX",
    tagline: "Freeze the Moment",
    gender: "Men",
    size: "50ml",
    concentration: "Extrait de Parfum",
    price: 999,
    mrp: 1499,
    description:
      "A bold icy-modern perfume with a youthful edge, built for people who want their presence to feel sharp and unforgettable.",
    longDescription:
      "Zyrox by House of Eon is made for the new generation. It is crisp, cool and energetic with a futuristic feel. Wear it when you want a clean, bold and memorable fragrance that feels young, stylish and confident.",
    notes: [
      "Icy Freshness",
      "Citrus Spark",
      "Minty Cool",
      "Clean Musk",
      "Modern Woods",
    ],
    mood: ["Icy", "Bold", "Youthful", "Energetic", "Trendy"],
    occasion: ["College", "Parties", "Daily Wear", "Hangouts", "Summer"],
    image: "/products/zyrox.png",
    gallery: ["/products/zyrox.png"],

    rating: 5,
    reviewCount: 0,
    ratingText: "Loved by early customers",
    valueLine:
      "A cool, energetic perfume for a sharp, youthful and modern fragrance mood.",
    highlights: [
      {
        title: "Youthful energy",
        text: "A crisp and cool perfume made for modern style and daily confidence.",
      },
      {
        title: "Sharp freshness",
        text: "Icy freshness, citrus spark and clean musk for a bold fresh feel.",
      },
      {
        title: "Hangout ready",
        text: "Works for college, parties, casual plans and summer days.",
      },
    ],
    scentProfile: {
      opening:
        "Icy freshness with citrus spark for a sharp and energetic start.",
      heart:
        "Minty coolness and clean freshness that give it a youthful edge.",
      dryDown:
        "Clean musk and modern woods that keep the scent smooth and wearable.",
      performance:
        "Designed for daily wear, hangouts, parties and warm weather. Performance can vary based on skin, weather and number of sprays.",
    },
    reviews: [],

    seoTitle:
      "Zyrox Perfume for Men | Cool Gen Z Long Lasting Perfume India",
    seoDescription:
      "Buy Zyrox by House of Eon, a cool Gen Z perfume for men in India. Fresh, bold and long lasting fragrance for college, parties, daily wear and modern youth style.",
    seoKeywords: [
      "zyrox perfume",
      "Gen Z perfume for men",
      "cool perfume for men India",
      "young perfume brand India",
      "fresh long lasting perfume",
      "trendy perfume for men",
    ],
  },
  {
    id: "rank",
    slug: "rank-perfume",
    name: "RANK",
    shortName: "RANK",
    tagline: "Raw Power. Refined Edge.",
    gender: "Men",
    size: "50ml",
    concentration: "Eau de Parfum",
    price: 999,
    mrp: 1499,
    description:
      "A strong masculine perfume with raw power, refined edge and a premium boss-energy character.",
    longDescription:
      "RANK by House of Eon is built for men who want presence. It has a powerful, confident and refined personality that works for office, business meetings, evening plans and special occasions.",
    notes: ["Spice", "Leather Touch", "Amber", "Woods", "Musk"],
    mood: ["Powerful", "Masculine", "Refined", "Bold", "Premium"],
    occasion: ["Office", "Business", "Evening", "Date Night", "Gifting"],
    image: "/products/rank.png",
    gallery: ["/products/rank.png"],

    rating: 5,
    reviewCount: 0,
    ratingText: "Loved by early customers",
    valueLine:
      "A bold masculine perfume made for office confidence, evening plans and strong first impressions.",
    highlights: [
      {
        title: "Strong presence",
        text: "A powerful scent character made for men who want to be noticed.",
      },
      {
        title: "Refined edge",
        text: "Spice, amber and woods give it a premium masculine feel.",
      },
      {
        title: "Office to evening",
        text: "Works for business meetings, evening plans, dates and gifting.",
      },
    ],
    scentProfile: {
      opening:
        "A spicy masculine opening that feels bold and confident.",
      heart:
        "Leather touch and amber warmth create a refined premium character.",
      dryDown:
        "Woods and musk give the fragrance strength, depth and presence.",
      performance:
        "Designed for office, business, evenings and special occasions. Performance can vary based on skin, weather and number of sprays.",
    },
    reviews: [],

    seoTitle:
      "RANK Perfume for Men | Raw Power Long Lasting Perfume India",
    seoDescription:
      "Buy RANK by House of Eon, a powerful long lasting perfume for men in India with masculine, refined and premium notes. Ideal for office, business, dates and gifting.",
    seoKeywords: [
      "RANK perfume",
      "powerful perfume for men",
      "masculine perfume India",
      "long lasting perfume for men",
      "premium perfume for men India",
      "House of Eon RANK",
    ],
  },
  {
    id: "syra",
    slug: "syra-women-perfume",
    name: "SYRA",
    shortName: "SYRA",
    tagline: "Grace with Power",
    gender: "Women",
    size: "50ml",
    concentration: "Eau de Parfum",
    price: 999,
    mrp: 1499,
    description:
      "A graceful yet powerful perfume for women, designed for elegance, confidence and modern feminine presence.",
    longDescription:
      "SYRA by House of Eon is created for women who carry softness and strength together. It feels elegant, modern and confident, making it suitable for office, brunch, evenings, gifting and special moments.",
    notes: [
      "Floral Accord",
      "Soft Musk",
      "Vanilla",
      "Fruity Spark",
      "Elegant Woods",
    ],
    mood: ["Elegant", "Feminine", "Confident", "Soft", "Powerful"],
    occasion: ["Office", "Brunch", "Evening", "Gifting", "Daily Wear"],
    image: "/products/syra.png",
    gallery: [
      "/products/syra-lifestyle-1.png",
      "/products/syra-lifestyle-2.png",
      "/products/syra-lifestyle-3.png",
      "/products/syra-lifestyle-4.png",
      "/products/syra-lifestyle-5.png",
      "/products/syra-closeup.png",
      "/products/syra.png",
    ],

    rating: 5,
    reviewCount: 0,
    ratingText: "Loved by early customers",
    valueLine:
      "An elegant floral musk perfume for women who want a soft, graceful and memorable presence.",
    highlights: [
      {
        title: "Graceful, not loud",
        text: "A feminine scent profile that feels elegant, smooth and memorable without being overpowering.",
      },
      {
        title: "Beautiful daily wear",
        text: "Works for office, brunch, saree looks, evening plans and everyday confidence.",
      },
      {
        title: "Perfect gifting choice",
        text: "Premium bottle, soft mood and elegant character make SYRA a thoughtful gift for women.",
      },
    ],
    scentProfile: {
      opening:
        "A soft fruity sparkle that gives SYRA a graceful and feminine first impression.",
      heart:
        "Elegant floral accord with smooth vanilla warmth for a beautiful everyday mood.",
      dryDown:
        "Soft musk and elegant woods that stay clean, gentle and confident.",
      performance:
        "Designed for daily wear, office, brunch, evenings and Indian weather. Performance can vary based on skin, weather and number of sprays.",
    },
    reviews: [
      {
        name: "Priya",
        city: "Chennai",
        rating: 5,
        text: "SYRA feels soft, elegant and perfect for daily wear. It is not too loud but still noticeable.",
      },
      {
        name: "Aishwarya",
        city: "Bengaluru",
        rating: 5,
        text: "The bottle looks premium and the fragrance feels graceful. Good option for gifting.",
      },
      {
        name: "Neha",
        city: "Hyderabad",
        rating: 5,
        text: "I liked the soft feminine smell. It works well for office and evening plans.",
      },
    ],

    seoTitle:
      "SYRA Perfume for Women | Elegant Long Lasting Perfume India",
    seoDescription:
      "Buy SYRA by House of Eon, an elegant long lasting perfume for women in India with floral, soft musk and modern feminine notes. Perfect for daily wear, office and gifting.",
    seoKeywords: [
      "SYRA perfume",
      "perfume for women India",
      "long lasting perfume for women",
      "elegant perfume for women",
      "premium perfume for women India",
      "House of Eon SYRA",
    ],
  },
  {
    id: "silent-gold",
    slug: "silent-gold-unisex-perfume",
    name: "Silent Gold",
    shortName: "SILENT GOLD",
    tagline: "Legacy in Every Drop",
    gender: "Unisex",
    size: "50ml",
    concentration: "Extrait de Parfum",
    price: 1199,
    mrp: 1699,
    description:
      "A rich unisex perfume with timeless luxury, golden warmth and a legacy-style premium character.",
    longDescription:
      "Silent Gold by House of Eon is a unisex perfume for people who prefer quiet luxury. It is rich, smooth and timeless, made for special occasions, premium gifting and elegant everyday presence.",
    notes: ["Golden Amber", "Saffron Touch", "Smooth Woods", "Musk", "Resin"],
    mood: ["Timeless", "Rich", "Unisex", "Elegant", "Premium"],
    occasion: [
      "Gifting",
      "Festive Wear",
      "Evening",
      "Luxury Daily Wear",
      "Special Moments",
    ],
    image: "/products/silent-gold.png",
    gallery: ["/products/silent-gold.png"],

    rating: 5,
    reviewCount: 0,
    ratingText: "Loved by early customers",
    valueLine:
      "A rich unisex perfume with golden warmth, smooth woods and timeless premium presence.",
    highlights: [
      {
        title: "Quiet luxury",
        text: "A smooth premium scent profile made for people who prefer elegance over noise.",
      },
      {
        title: "Unisex richness",
        text: "Golden amber, saffron touch and smooth woods create a warm luxury mood.",
      },
      {
        title: "Premium gifting",
        text: "A rich and timeless fragrance choice for festive wear, special moments and gifting.",
      },
    ],
    scentProfile: {
      opening:
        "Golden amber warmth with a refined saffron-style touch.",
      heart:
        "Smooth woods and resin create a rich, elegant and timeless character.",
      dryDown:
        "Musk and warm woods leave a quiet luxury impression.",
      performance:
        "Designed for evening wear, festive moments, premium gifting and special occasions. Performance can vary based on skin, weather and number of sprays.",
    },
    reviews: [],

    seoTitle:
      "Silent Gold Unisex Perfume | Premium Long Lasting Perfume India",
    seoDescription:
      "Buy Silent Gold by House of Eon, a premium unisex long lasting perfume in India with golden amber, smooth woods and timeless luxury character. Perfect for gifting and special occasions.",
    seoKeywords: [
      "Silent Gold perfume",
      "unisex perfume India",
      "premium unisex perfume",
      "long lasting unisex perfume",
      "luxury perfume India",
      "House of Eon Silent Gold",
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}