// Long-tail SEO content — genuinely useful buying/usage guides rather than
// thin keyword-stuffed pages. Each targets a specific, realistic search
// intent that a head term like "perfume for men India" can't compete for,
// and links back to the actual products so the content also does its job
// as a conversion path, not just a ranking play.

export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  excerpt: string;
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  sections: { heading: string; body: string[] }[];
  faqs: { question: string; answer: string }[];
  relatedProductIds: string[];
};

export const guides: Guide[] = [
  {
    slug: "extrait-de-parfum-vs-eau-de-parfum",
    title: "Extrait de Parfum vs Eau de Parfum: What's the Real Difference?",
    seoTitle:
      "Extrait de Parfum vs Eau de Parfum: What's the Difference? | House of Eon",
    seoDescription:
      "Extrait de Parfum and Eau de Parfum aren't just labels — they mean different fragrance oil concentration, longevity and projection. Here's what actually changes, explained simply.",
    seoKeywords: [
      "extrait de parfum vs eau de parfum",
      "difference between EDP and extrait",
      "perfume concentration explained",
      "which perfume lasts longer",
      "extrait de parfum meaning",
    ],
    excerpt:
      "Extrait de Parfum and Eau de Parfum aren't just fancy labels — the concentration behind them changes how long a scent lasts and how far it carries. Here's what the terms actually mean.",
    eyebrow: "Fragrance Basics",
    heroTitle: "Extrait de Parfum vs Eau de Parfum, explained simply.",
    heroSubtitle:
      "Every bottle you buy lists a concentration on it somewhere. Most people skip right past it — but it's the single biggest factor in how long a perfume actually lasts on your skin.",
    sections: [
      {
        heading: "It comes down to one thing: how much fragrance oil is in the bottle",
        body: [
          "Every perfume is a mix of fragrance oil and alcohol (plus a little water). The concentration terms you see on a bottle — Eau de Toilette, Eau de Parfum, Extrait de Parfum — are really just telling you what percentage of that mix is actual fragrance oil.",
          "As a rough industry guide: Eau de Toilette usually sits around 5-15% fragrance oil, Eau de Parfum around 15-20%, and Extrait de Parfum (sometimes just called Parfum) around 20-30%, occasionally higher. There's no single fixed rulebook every brand follows exactly, but that's the general order, and it's consistent enough to be a useful guide when you're comparing two bottles.",
        ],
      },
      {
        heading: "What that actually changes when you wear it",
        body: [
          "More fragrance oil generally means the scent lasts longer on skin and needs fewer reapplications through the day — which matters a lot in Indian heat, where higher temperatures make any fragrance evaporate faster than it would in a cooler climate.",
          "It also tends to change projection — how far the scent carries around you versus staying close to your skin. Extrait de Parfum concentrations often sit a little closer to the skin with strong longevity, while Eau de Parfum tends to project a bit more in the first hour or two before settling in.",
          "Cost and price aren't a reliable way to tell them apart, either — a well-made Eau de Parfum can easily outperform a poorly made Extrait. Concentration is a starting signal, not the whole story.",
        ],
      },
      {
        heading: "Which one should you actually pick?",
        body: [
          "If you want a fragrance that survives a full workday, a flight, or a long evening out with minimal reapplication, an Extrait de Parfum concentration is usually the safer bet. Desert Tonka, Arctic Wave, Zyrox and Silent Gold are all built at this concentration for exactly that reason.",
          "If you prefer something a little lighter that you're comfortable topping up once during the day, or you want a fresher, more voice-of-the-morning kind of presence, Eau de Parfum works well too — RANK and SYRA are built at this concentration and are both genuinely long-wearing in their own right, just with a slightly different character.",
          "Neither is objectively \"better\" — it's a question of how strong and long you want the fragrance to sit, not which one is higher quality.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Extrait de Parfum always stronger than Eau de Parfum?",
        answer:
          "Generally, yes, in terms of fragrance oil concentration and typical longevity — but the specific perfume oil blend matters just as much as the concentration label. A well-built Eau de Parfum can still last most of a day.",
      },
      {
        question: "Does higher concentration mean more sprays needed?",
        answer:
          "It's the opposite — higher concentration usually means fewer sprays are needed since each spray carries more fragrance oil and lasts longer.",
      },
      {
        question: "Which House of Eon perfumes are Extrait de Parfum?",
        answer:
          "Desert Tonka, Arctic Wave, Zyrox and Silent Gold are Extrait de Parfum. RANK and SYRA are Eau de Parfum.",
      },
      {
        question: "Is Extrait de Parfum better for gifting?",
        answer:
          "It's a safe choice since longevity is rarely a complaint, but a well-matched Eau de Parfum makes just as thoughtful a gift if it suits the recipient's taste better.",
      },
    ],
    relatedProductIds: [
      "desert-tonka",
      "arctic-wave",
      "zyrox",
      "silent-gold",
      "rank",
      "syra",
    ],
  },
  {
    slug: "how-to-make-perfume-last-longer",
    title: "How to Make Your Perfume Last Longer: 7 Tips That Actually Work",
    seoTitle:
      "How to Make Perfume Last Longer in Indian Weather | House of Eon",
    seoDescription:
      "Perfume fading by afternoon in Indian heat? These 7 application tips actually extend how long a fragrance lasts — no gimmicks, just how fragrance chemistry works.",
    seoKeywords: [
      "how to make perfume last longer",
      "perfume tips india",
      "perfume fading fast",
      "how to apply perfume correctly",
      "long lasting perfume tips",
    ],
    excerpt:
      "If your perfume fades by afternoon, it's usually not the perfume — it's how and where it's applied. Seven tips that actually make a measurable difference.",
    eyebrow: "Fragrance Tips",
    heroTitle: "How to make any perfume last longer.",
    heroSubtitle:
      "A lot of \"my perfume doesn't last\" complaints come down to application, not the fragrance itself — especially in Indian heat, where higher temperatures speed up evaporation no matter how good the bottle is.",
    sections: [
      {
        heading: "1. Apply to pulse points, not just wrists",
        body: [
          "Pulse points — wrists, neck, behind the ears, inner elbows — run slightly warmer than the rest of your skin, and that warmth helps the fragrance diffuse steadily through the day instead of fading all at once.",
        ],
      },
      {
        heading: "2. Don't rub your wrists together",
        body: [
          "It's an instinct, but rubbing generates friction and heat that breaks down the fragrance's top notes faster, which can make a scent fade quicker and sometimes smell slightly different than intended. Spray and let it dry naturally instead.",
        ],
      },
      {
        heading: "3. Apply on clean, slightly moisturized skin",
        body: [
          "Fragrance holds better on hydrated skin than on dry skin — dry skin absorbs and disperses fragrance oil faster, so a scent applied right after a shower on slightly damp skin, or over an unscented moisturizer, tends to last noticeably longer.",
        ],
      },
      {
        heading: "4. Spray a little on clothing too, not just skin",
        body: [
          "Fabric holds fragrance for longer than skin does, since it doesn't have the same oils, sweat and temperature affecting it. A light spray on the inside of a shirt collar or a scarf (test on an inconspicuous spot first for delicate fabric) adds hours of extra life.",
        ],
      },
      {
        heading: "5. Store your bottle away from sunlight and heat",
        body: [
          "Heat and direct light break down fragrance oils over time, which is why a bottle kept on a sunny windowsill or in a hot car will noticeably weaken faster than one stored in a cool, dark drawer or cupboard.",
        ],
      },
      {
        heading: "6. Fewer, well-placed sprays beat one heavy layer",
        body: [
          "Two or three sprays on different pulse points usually outlasts one heavy spray in a single spot, and it also avoids the fragrance feeling overwhelming up close — which matters more than most people think for how a scent is perceived by others.",
        ],
      },
      {
        heading: "7. Account for Indian heat specifically",
        body: [
          "Higher temperatures increase how fast fragrance molecules evaporate off skin — it's simple chemistry, not a flaw in the perfume. In peak summer, a light reapplication in the afternoon (rather than a heavy morning-only application) usually gives more consistent results than trying to make one application stretch the whole day.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why does my perfume not last as long in summer?",
        answer:
          "Heat speeds up how fast fragrance oils evaporate off your skin — it's a natural effect of temperature, not a sign the perfume is low quality. A lighter reapplication later in the day usually works better than one heavy morning application.",
      },
      {
        question: "Should I rub perfume into my skin after spraying?",
        answer:
          "No — rubbing creates friction and heat that can break down the top notes faster and alter how the fragrance develops. Let it dry naturally instead.",
      },
      {
        question: "Does spraying perfume on clothes help it last longer?",
        answer:
          "Yes, fabric generally holds fragrance longer than skin does. A light spray on clothing (tested on an inconspicuous area first) is a simple way to extend how long a scent lasts through the day.",
      },
    ],
    relatedProductIds: ["desert-tonka", "arctic-wave", "silent-gold"],
  },
  {
    slug: "best-perfume-gifts-under-1500-india",
    title: "Best Perfume Gifts Under ₹1500 in India",
    seoTitle: "Best Perfume Gifts Under ₹1500 in India (2026) | House of Eon",
    seoDescription:
      "Looking for a premium perfume gift under ₹1500? Here's an honest, occasion-by-occasion pick from House of Eon's full range for him, her and unisex gifting.",
    seoKeywords: [
      "best perfume gift under 1500",
      "perfume gift india",
      "premium perfume under 1500",
      "perfume gift for him",
      "perfume gift for her",
    ],
    excerpt:
      "A good perfume gift under ₹1500 doesn't have to mean a compromise on quality. Here's an honest, occasion-by-occasion pick from our full range.",
    eyebrow: "Gifting Guide",
    heroTitle: "The best perfume gifts under ₹1500, picked honestly.",
    heroSubtitle:
      "Every House of Eon perfume comes in at ₹999 with EON20 applied — under budget on its own, or paired as a 2-bottle gift set at ₹1,598. Here's which one fits which person.",
    sections: [
      {
        heading: "For him — confident and evening-ready",
        body: [
          "Desert Tonka is the safest premium pick for most men — warm, rich and smooth without being overpowering, and versatile enough for dates, celebrations and festive wear. If he prefers something bolder and more modern, RANK leans into a stronger, boardroom-to-evening masculine character instead.",
        ],
      },
      {
        heading: "For her — elegant without trying too hard",
        body: [
          "SYRA is built specifically as a women's daily-wear-to-evening fragrance — soft, floral and graceful rather than loud, which makes it a low-risk, high-impact gift for most recipients, from a colleague to a close friend.",
        ],
      },
      {
        heading: "For someone whose taste you're not 100% sure of",
        body: [
          "Silent Gold is unisex by design — a rich, golden amber character that works for both men and women, which makes it a strong pick when you're gifting someone whose exact preference you're not certain about, or want something that reads as more universally premium.",
        ],
      },
      {
        heading: "For younger, trend-forward gifting",
        body: [
          "Arctic Wave and Zyrox both lean fresher and more modern — Arctic Wave for a clean, office-to-summer everyday feel, Zyrox for a sharper, youthful, Gen-Z-leaning character. Either works well for college-age or early-career recipients.",
        ],
      },
      {
        heading: "If you want to gift two bottles instead of one",
        body: [
          "Any two House of Eon perfumes together come to ₹1,598 as a bundle — just slightly over the ₹1,500 mark, but genuinely useful if you want to gift a full set (say, one for him and one for her) rather than a single bottle.",
        ],
      },
    ],
    faqs: [
      {
        question: "What's the best perfume gift under ₹1500 in India?",
        answer:
          "It depends on the recipient — Desert Tonka or RANK for men, SYRA for women, and Silent Gold if you want a unisex option that works either way. All are ₹999 individually with EON20 applied.",
      },
      {
        question: "Is a ₹999 perfume actually good quality?",
        answer:
          "Yes — House of Eon perfumes are Eau de Parfum or Extrait de Parfum concentration, not diluted Eau de Toilette, so the price reflects a genuinely direct-to-consumer model rather than a lower-quality product.",
      },
      {
        question: "Can I gift two perfumes together as a set?",
        answer:
          "Yes, any two House of Eon perfumes together come to ₹1,598 as a bundle, which works well as a two-bottle gift set.",
      },
    ],
    relatedProductIds: [
      "desert-tonka",
      "rank",
      "syra",
      "silent-gold",
      "arctic-wave",
      "zyrox",
    ],
  },
  {
    slug: "best-unisex-perfume-in-india",
    title: "Best Unisex Perfume in India: What Actually Makes a Scent Unisex?",
    seoTitle: "Best Unisex Perfume in India | House of Eon",
    seoDescription:
      "Unisex perfume doesn't mean neutral or boring — it means a scent profile built to work on anyone. Here's what actually makes a fragrance unisex, and our pick for India.",
    seoKeywords: [
      "best unisex perfume in india",
      "unisex perfume india",
      "unisex fragrance for men and women",
      "gender neutral perfume india",
    ],
    excerpt:
      "Unisex doesn't mean neutral or boring — it means a scent profile built to work well on anyone. Here's what actually makes a fragrance unisex, and our pick for India.",
    eyebrow: "Fragrance Basics",
    heroTitle: "What actually makes a perfume unisex?",
    heroSubtitle:
      "It's not about being \"gender neutral\" in a flat, boring way — it's about a scent character built around notes that read as premium and confident regardless of who's wearing it.",
    sections: [
      {
        heading: "It's about the notes, not a marketing label",
        body: [
          "Traditionally, \"masculine\" fragrances lean into woods, spice and musk, while \"feminine\" ones lean into florals and fruit. A genuinely unisex perfume is usually built around notes that sit outside that split entirely — amber, saffron, smooth woods, warm resins — characters that read as rich and premium rather than clearly gendered.",
          "That's a deliberate choice in how a fragrance is composed, not just a label stuck on an existing men's or women's scent.",
        ],
      },
      {
        heading: "Why unisex works especially well for gifting",
        body: [
          "If you're not entirely sure of someone's fragrance preference — a colleague, a new partner, a friend you're buying for the first time — a well-built unisex scent is a safer bet than guessing between a strongly masculine or feminine profile. It's also a strong pick for couples who want to share one bottle.",
        ],
      },
      {
        heading: "Our pick: Silent Gold",
        body: [
          "Silent Gold is House of Eon's unisex fragrance — golden amber, a saffron-style touch and smooth woods, built for quiet luxury rather than a loud, clearly gendered statement. It's Extrait de Parfum concentration, so it's built to last through a full evening or festive occasion without needing reapplication.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is unisex perfume the same as gender-neutral perfume?",
        answer:
          "They're often used interchangeably. Both describe a fragrance built around notes that aren't strongly associated with either traditionally masculine or feminine profiles.",
      },
      {
        question: "Can a unisex perfume smell too strong on one gender?",
        answer:
          "Not if it's well composed — a genuinely unisex scent is built to sit well on any skin chemistry, though everyone's skin does subtly affect how any fragrance develops.",
      },
      {
        question: "Is Silent Gold a good first unisex perfume to try?",
        answer:
          "Yes — it's built around warm, rich notes (golden amber, saffron, smooth woods) that read as premium rather than clearly masculine or feminine, making it an easy entry point into unisex fragrance.",
      },
    ],
    relatedProductIds: ["silent-gold"],
  },
  {
    slug: "perfume-gift-for-girlfriend-boyfriend",
    title: "How to Choose a Perfume Gift for Your Girlfriend or Boyfriend",
    seoTitle:
      "Perfume Gift for Girlfriend or Boyfriend: How to Choose | House of Eon",
    seoDescription:
      "Choosing a perfume for your partner is more personal than picking any gift under a budget. Here's how to actually match a scent to their personality, not just their gender.",
    seoKeywords: [
      "perfume gift for girlfriend",
      "perfume gift for boyfriend",
      "perfume for partner india",
      "romantic perfume gift india",
    ],
    excerpt:
      "Choosing a perfume for your partner is more personal than picking any gift under a budget. Here's how to actually match a scent to who they are.",
    eyebrow: "Gifting Guide",
    heroTitle: "Choosing a perfume gift for someone you actually know well.",
    heroSubtitle:
      "A partner gift is different from a colleague gift — you already know their personality, so the goal is matching that, not just picking a safe, universally-liked option.",
    sections: [
      {
        heading: "For a girlfriend who's confident and understated",
        body: [
          "SYRA's soft floral musk works well for someone who prefers elegance over making a loud statement — graceful for office and daily wear, but with enough presence for evenings out.",
        ],
      },
      {
        heading: "For a girlfriend (or anyone) who prefers rich, warm scents",
        body: [
          "Silent Gold's golden amber and saffron character suits someone who leans toward warmth and richness over florals — a strong choice if you already know she prefers deeper, more timeless scents over anything sweet or fruity.",
        ],
      },
      {
        heading: "For a boyfriend with a warm, confident presence",
        body: [
          "Desert Tonka's tonka-amber depth suits someone who already has a warm, easygoing confidence — it reads as rich without being flashy, which makes it a strong fit for evenings, dates and special occasions specifically.",
        ],
      },
      {
        heading: "For a boyfriend who's bold and direct",
        body: [
          "RANK's stronger, more powerful masculine profile suits someone with a more assertive personality — it's built for presence, which makes sense as a gift for someone who already carries himself that way.",
        ],
      },
      {
        heading: "If you genuinely can't decide",
        body: [
          "Our Scent Finder quiz takes 30 seconds and matches a personality/occasion profile to one of our six perfumes — a useful shortcut if you know your partner well but aren't confident translating that into a specific scent family.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I match a perfume to my partner's personality or their existing scent preference?",
        answer:
          "Both matter, but if you have to pick one, existing preference wins — someone who already loves florals is unlikely to switch to a heavy woody scent just because it \"matches their personality\" on paper.",
      },
      {
        question: "Is it risky to gift perfume to a partner?",
        answer:
          "It's more personal than a lot of gifts, which is exactly why matching their known preferences (not just their gender) matters more than picking the most popular option.",
      },
      {
        question: "What if I'm still not sure which scent fits them?",
        answer:
          "Try the House of Eon Scent Finder quiz — it takes about 30 seconds and suggests a match based on mood and occasion rather than asking you to guess a fragrance family from scratch.",
      },
    ],
    relatedProductIds: ["syra", "silent-gold", "desert-tonka", "rank"],
  },
];

export function getGuideBySlug(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
