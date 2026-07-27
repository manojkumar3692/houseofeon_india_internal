import { Product, products } from "@/lib/products";
import { GenderAnswer } from "@/lib/scentQuiz";

export type SwipeCard = {
  id: string;
  scenario: string;
  sub: string;
  emoji: string;
  gradient: string; // CSS gradient string used as the card background
  tags: string[]; // matched against product.mood + product.occasion
};

// Every scenario is deliberately gender-neutral (works for "Him", "Her" or
// "Surprise me") — the gender picked on the intro screen decides which pool
// of products we score against, same pattern as the Scent Finder quiz.
export const SWIPE_CARDS: SwipeCard[] = [
  {
    id: "presentation",
    scenario: "Big presentation at work tomorrow.",
    sub: "You need to walk in and own the room.",
    emoji: "💼",
    gradient: "linear-gradient(160deg, #2b2118 0%, #55402a 100%)",
    tags: ["Office", "Business", "Bold", "Powerful", "Confident"],
  },
  {
    id: "date-night",
    scenario: "Last-minute date night plans.",
    sub: "Something warm, rich and hard to forget.",
    emoji: "🌆",
    gradient: "linear-gradient(160deg, #3a1f1a 0%, #7a3b26 100%)",
    tags: ["Evening", "Date Night", "Warm", "Rich", "Magnetic"],
  },
  {
    id: "beach-trip",
    scenario: "Beach trip with friends this weekend.",
    sub: "Fresh, cool and easy to wear all day.",
    emoji: "🏖️",
    gradient: "linear-gradient(160deg, #123138 0%, #2c6e7a 100%)",
    tags: ["Summer", "Fresh", "Cool", "Clean"],
  },
  {
    id: "wedding-season",
    scenario: "Wedding season. Dressing to impress.",
    sub: "Premium, elegant, a little unforgettable.",
    emoji: "🎉",
    gradient: "linear-gradient(160deg, #2a1e10 0%, #8a6a2f 100%)",
    tags: ["Festive Wear", "Gifting", "Luxury", "Premium", "Elegant"],
  },
  {
    id: "night-drive",
    scenario: "Late night city drive, windows down.",
    sub: "Sharp, youthful, a bit of an edge.",
    emoji: "🌃",
    gradient: "linear-gradient(160deg, #101820 0%, #2a3f52 100%)",
    tags: ["Bold", "Youthful", "Energetic", "Trendy", "Icy"],
  },
  {
    id: "brunch",
    scenario: "Sunday brunch with the girls.",
    sub: "Soft, graceful, quietly confident.",
    emoji: "🥂",
    gradient: "linear-gradient(160deg, #2c1a24 0%, #6b3a52 100%)",
    tags: ["Brunch", "Soft", "Feminine", "Elegant", "Confident"],
  },
  {
    id: "gym-to-meetings",
    scenario: "Gym in the morning, meetings by noon.",
    sub: "Clean, daily, zero fuss.",
    emoji: "⚡",
    gradient: "linear-gradient(160deg, #14201c 0%, #2f5c48 100%)",
    tags: ["Daily Wear", "Fresh", "Cool", "Clean", "Daytime"],
  },
  {
    id: "quiet-luxury",
    scenario: "Quiet luxury. No logos needed.",
    sub: "Timeless, refined, unmistakably premium.",
    emoji: "👑",
    gradient: "linear-gradient(160deg, #201509 0%, #7a5a1f 100%)",
    tags: ["Premium", "Timeless", "Refined", "Unisex"],
  },
];

export function getSwipeMatches(
  gender: GenderAnswer,
  likedTags: string[]
): Product[] {
  const pool =
    gender === "Any"
      ? products
      : products.filter(
          (product) => product.gender === gender || product.gender === "Unisex"
        );

  const wantedTags = new Set(likedTags);

  const scored = pool.map((product) => {
    const productTags = new Set([
      ...(product.mood || []),
      ...(product.occasion || []),
    ]);

    let score = 0;
    wantedTags.forEach((tag) => {
      if (productTags.has(tag)) score += 1;
    });

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.length ? scored.map((s) => s.product) : products;
}
