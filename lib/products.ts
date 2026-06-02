export type Product = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  gender: "Men" | "Women" | "Unisex";
  size: string;
  price: number;
  mrp?: number;
  description: string;
  notes: string[];
  seoTitle: string;
  seoDescription: string;
};

export const products: Product[] = [
  {
    id: "rank-men-50ml",
    slug: "rank-perfume-for-men",
    name: "RANK Men Perfume EDP",
    shortName: "RANK",
    gender: "Men",
    size: "50ml",
    price: 999,
    mrp: 1499,
    description: "A bold premium fragrance made for office, evening, and special occasions.",
    notes: ["Citrus opening", "Warm spices", "Woody base"],
    seoTitle: "RANK Perfume for Men - Long Lasting Luxury Perfume",
    seoDescription: "Buy RANK perfume for men from House of Eon. Long lasting premium fragrance for Indian weather.",
  },
  {
    id: "syra-women-50ml",
    slug: "syra-perfume-for-women",
    name: "SYRA Women Perfume EDP",
    shortName: "SYRA",
    gender: "Women",
    size: "50ml",
    price: 999,
    mrp: 1499,
    description: "Elegant, clean, feminine fragrance for daily luxury and gifting.",
    notes: ["Soft floral", "Fresh musk", "Elegant amber"],
    seoTitle: "SYRA Perfume for Women - Premium Long Lasting Perfume",
    seoDescription: "Shop SYRA women perfume from House of Eon. Premium EDP fragrance for gifting and daily wear.",
  },
  {
    id: "riva-women-50ml",
    slug: "riva-executive-women-perfume",
    name: "RIVA Executive Women Perfume",
    shortName: "RIVA",
    gender: "Women",
    size: "50ml",
    price: 1099,
    mrp: 1599,
    description: "A polished executive perfume for women who prefer a refined signature.",
    notes: ["Pear", "White florals", "Soft vanilla"],
    seoTitle: "RIVA Executive Women Perfume - House of Eon",
    seoDescription: "Buy RIVA Executive Women Perfume. A refined premium perfume for women by House of Eon.",
  },
  {
    id: "eon-oud-50ml",
    slug: "eon-oud-perfume",
    name: "EON Oud Perfume EDP",
    shortName: "EON OUD",
    gender: "Unisex",
    size: "50ml",
    price: 1199,
    mrp: 1699,
    description: "Rich oud-inspired fragrance for people who like strong premium scents.",
    notes: ["Oud accord", "Saffron", "Amber woods"],
    seoTitle: "EON Oud Perfume - Premium Unisex Oud Fragrance",
    seoDescription: "Shop EON Oud perfume, a strong premium unisex fragrance with oud, saffron and amber woods.",
  },
  {
    id: "eon-aqua-50ml",
    slug: "aqua-fresh-perfume-for-men",
    name: "EON Aqua Fresh Perfume",
    shortName: "AQUA",
    gender: "Men",
    size: "50ml",
    price: 899,
    mrp: 1299,
    description: "Fresh daily perfume for office, college, gym, and casual wear.",
    notes: ["Marine fresh", "Mint", "Clean musk"],
    seoTitle: "Aqua Fresh Perfume for Men - Daily Long Lasting Perfume",
    seoDescription: "Buy Aqua Fresh perfume for men. A fresh long lasting daily wear perfume by House of Eon.",
  },
  {
    id: "eon-gift-set",
    slug: "perfume-gift-set-for-couples",
    name: "House of Eon Gift Set",
    shortName: "GIFT SET",
    gender: "Unisex",
    size: "2 x 50ml",
    price: 1799,
    mrp: 2499,
    description: "A curated perfume gift set for couples, birthdays, anniversaries, and festivals.",
    notes: ["Men + Women", "Gift-ready", "Premium EDP"],
    seoTitle: "Perfume Gift Set for Couples - House of Eon",
    seoDescription: "Buy premium perfume gift set for couples. Perfect for birthdays, anniversaries and gifting.",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}
