import { Product, products } from "@/lib/products";

export type GenderAnswer = "Men" | "Women" | "Any";

export type QuizOption = {
  id: string;
  label: string;
  emoji: string;
};

export type GenderQuestion = {
  id: "gender";
  question: string;
  options: (QuizOption & { value: GenderAnswer })[];
};

export type TagQuestion = {
  id: "occasion" | "mood";
  question: string;
  options: (QuizOption & { tags: string[] })[];
};

export type QuizQuestion = GenderQuestion | TagQuestion;

// Every option below maps to real mood/occasion tags already present on
// products in lib/products.ts — no separate "quiz taxonomy" to keep in
// sync, the matching is scored directly against existing product data.
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "gender",
    question: "Who are we finding a scent for?",
    options: [
      { id: "men", label: "Him", emoji: "🧔", value: "Men" },
      { id: "women", label: "Her", emoji: "💃", value: "Women" },
      { id: "any", label: "Surprise me", emoji: "✨", value: "Any" },
    ],
  },
  {
    id: "occasion",
    question: "When will you wear it the most?",
    options: [
      {
        id: "daily",
        label: "Daily & Office",
        emoji: "💼",
        tags: ["Office", "Daily Wear", "College", "Daytime", "Business"],
      },
      {
        id: "evening",
        label: "Evenings & Dates",
        emoji: "🌆",
        tags: ["Evening", "Date Night"],
      },
      {
        id: "party",
        label: "Parties & Hangouts",
        emoji: "🎉",
        tags: ["Parties", "Hangouts", "Summer"],
      },
      {
        id: "festive",
        label: "Festive & Gifting",
        emoji: "🎁",
        tags: [
          "Gifting",
          "Festive Wear",
          "Special Moments",
          "Luxury Daily Wear",
          "Brunch",
        ],
      },
    ],
  },
  {
    id: "mood",
    question: "Pick your vibe.",
    options: [
      {
        id: "warm",
        label: "Warm & Rich",
        emoji: "🔥",
        tags: ["Warm", "Rich", "Magnetic", "Luxury"],
      },
      {
        id: "fresh",
        label: "Fresh & Cool",
        emoji: "❄️",
        tags: ["Fresh", "Cool", "Clean", "Icy"],
      },
      {
        id: "bold",
        label: "Bold & Energetic",
        emoji: "⚡",
        tags: ["Bold", "Youthful", "Energetic", "Trendy", "Powerful"],
      },
      {
        id: "elegant",
        label: "Elegant & Soft",
        emoji: "🌸",
        tags: ["Elegant", "Feminine", "Soft", "Confident"],
      },
      {
        id: "premium",
        label: "Premium & Timeless",
        emoji: "👑",
        tags: ["Premium", "Timeless", "Refined", "Unisex"],
      },
    ],
  },
];

export type QuizAnswers = {
  gender: GenderAnswer;
  genderLabel: string;
  occasionTags: string[];
  occasionLabel: string;
  moodTags: string[];
  moodLabel: string;
};

export function getQuizMatches(answers: QuizAnswers): Product[] {
  const pool =
    answers.gender === "Any"
      ? products
      : products.filter(
          (product) =>
            product.gender === answers.gender || product.gender === "Unisex"
        );

  const wantedTags = new Set([...answers.occasionTags, ...answers.moodTags]);

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
