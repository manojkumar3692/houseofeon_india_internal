// Upcoming fragrances are kept outside the purchasable catalogue so checkout,
// discounts, trial packs and shopping feeds cannot accidentally sell them.
export const riva = {
  id: "riva",
  slug: "riva-women-perfume",
  name: "RIVA",
  tagline: "A new chapter for her.",
  gender: "Women",
  status: "waitlist",
  // Scent direction supplied by the owner: J’adore Eau de Parfum.
  // Original editorial copy based on its floral reference, not an ingredient list
  // or a measured claim about RIVA's longevity.
  description: "A radiant floral perfume for women, bringing together sunny ylang-ylang, soft rose and a graceful jasmine bouquet.",
  seoDescription: "Discover RIVA, House of Eon's upcoming floral perfume for women with ylang-ylang, rose and jasmine notes. Join the launch waitlist.",
  notes: ["Ylang-ylang", "Rose", "Jasmine", "White Florals", "Fruity Nuance"],
  longDescription: "RIVA is for those who love a full floral scent with a gentle, feminine feel. Bright at first, then softer and rounder, its bouquet moves from a sunny introduction to an intimate floral finish.",
  scentProfile: {
    opening: "A bright, lightly fruity lift meets sunny ylang-ylang for a fresh floral introduction.",
    heart: "Rose and jasmine come forward together, giving the bouquet a soft, rounded fullness.",
    dryDown: "The floral character softens into a smooth, close-wearing finish with a lingering impression of petals.",
    performance: "Wear and projection vary with skin, weather and application. RIVA's measured wear time will be shared after testing.",
  },
  highlights: [
    { title: "A floral signature", text: "Ylang-ylang, rose and jasmine shape an expressive, feminine bouquet." },
    { title: "Brightness with softness", text: "A fresh introduction gives way to a gentler floral feel." },
    { title: "Your next discovery", text: "Join the waitlist to hear when RIVA is available." },
  ],
  image: "/products/riva.png",
  gallery: [
    "/products/riva.png",
    "/products/riva-lifestyle-2.png",
    "/products/riva-lifestyle-3.png",
    "/products/riva-lifestyle-4.png",
    "/products/riva-lifestyle-5.png",
    "/products/riva-label.png",
  ] as string[],
  seoTitle: "RIVA Perfume for Women | Join the Waitlist | House of Eon",
} as const;
export const rivaPath = `/products/${riva.slug}`;
