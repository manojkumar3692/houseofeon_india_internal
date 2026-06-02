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
    notes: ["Aquatic Notes", "Citrus", "Fresh Air", "Marine Accord", "Clean Woods"],
    mood: ["Fresh", "Cool", "Clean", "Confident", "Modern"],
    occasion: ["Office", "College", "Daily Wear", "Summer", "Daytime"],
    image: "/products/arctic-wave.jpg",
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
    notes: ["Icy Freshness", "Citrus Spark", "Minty Cool", "Clean Musk", "Modern Woods"],
    mood: ["Icy", "Bold", "Youthful", "Energetic", "Trendy"],
    occasion: ["College", "Parties", "Daily Wear", "Hangouts", "Summer"],
    image: "/products/zyrox.jpg",
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
    image: "/products/rank.jpg",
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
    notes: ["Floral Accord", "Soft Musk", "Vanilla", "Fruity Spark", "Elegant Woods"],
    mood: ["Elegant", "Feminine", "Confident", "Soft", "Powerful"],
    occasion: ["Office", "Brunch", "Evening", "Gifting", "Daily Wear"],
    image: "/products/syra.jpg",
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
    occasion: ["Gifting", "Festive Wear", "Evening", "Luxury Daily Wear", "Special Moments"],
    image: "/products/silent-gold.jpg",
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