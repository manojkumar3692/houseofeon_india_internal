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
  campaignLink?: { href: string; label: string; text: string };
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
  {
    slug: "best-diwali-gifts-for-men-under-1000-2026",
    title: "Best Diwali Gifts for Men Under ₹1000 in 2026",
    seoTitle: "Best Diwali Gifts for Men Under ₹1000 (2026) | House of Eon",
    seoDescription: "Looking for a Diwali gift for men under ₹1000? Compare useful, personal ideas and see why a try-first perfume Discovery Set removes the guesswork.",
    seoKeywords: ["Diwali gifts for men under 1000", "Diwali gift for husband", "Diwali gift for boyfriend", "affordable Diwali gifts for men"],
    excerpt: "Useful, personal Diwali gifts for men under ₹1000—including a fragrance option that does not force you to guess his taste.",
    eyebrow: "Diwali Gifting 2026",
    heroTitle: "Diwali gifts for men under ₹1000 that won’t be forgotten in a drawer.",
    heroSubtitle: "A tighter budget can still produce a personal gift. The best choice is something he can use, enjoy and make his own.",
    sections: [
      { heading: "Start with how he actually spends his day", body: ["The most useful Diwali gifts reflect the recipient rather than the festival. Think about whether he spends more time at the office, travelling, training, dressing for evenings out or building a quiet daily routine. A compact grooming or fragrance gift fits into real life long after Diwali."] },
      { heading: "Perfume is personal—so make discovery the gift", body: ["Fresh, warm and spicy fragrances can feel completely different on skin. Arctic Wave suits someone who prefers clean daily wear, Desert Tonka leans warm and rich, while RANK has a bolder evening character. If you cannot confidently choose between them, a Discovery Set is more thoughtful than a blind buy."] },
      { heading: "A premium option well below ₹1000", body: ["The House of Eon Discovery Set costs ₹249 and lets him select three 8ml fragrances. He can wear each one properly, choose a favourite and redeem the full ₹249 toward an eligible 50ml purchase within 30 days."] },
      { heading: "Other useful ideas under ₹1000", body: ["A slim wallet, travel organiser, insulated mug, grooming tool or well-made notebook can all work when they match his habits. Avoid adding random filler just to make a box look bigger; one considered item generally feels more premium than several disposable ones."] },
    ],
    faqs: [
      { question: "What is a unique Diwali gift for men under ₹1000?", answer: "A choose-your-own perfume Discovery Set is unusual, personal and useful without requiring you to guess one full bottle." },
      { question: "Which perfume style is safest for men?", answer: "Fresh profiles are often easy to wear, but no fragrance is universal. Letting him try fresh, warm and bold options is safer than assuming." },
      { question: "Can the ₹249 Discovery Set be redeemed?", answer: "Yes. The order number can be used once with the same phone number for ₹249 off an eligible full-size order within 30 days." },
    ],
    relatedProductIds: ["arctic-wave", "desert-tonka", "rank"],
    campaignLink: { href: "/pages/diwali-perfume", label: "Explore the Diwali Discovery Set", text: "Don’t guess his perfume. Let him try three and choose the one he genuinely wants to wear." },
  },
  {
    slug: "best-diwali-gifts-for-women-under-1000-2026",
    title: "Best Diwali Gifts for Women Under ₹1000 in 2026",
    seoTitle: "Best Diwali Gifts for Women Under ₹1000 (2026) | House of Eon",
    seoDescription: "Find thoughtful Diwali gifts for women under ₹1000, from personal everyday luxuries to a try-first perfume Discovery Set for uncertain tastes.",
    seoKeywords: ["Diwali gifts for women under 1000", "Diwali gift for wife", "Diwali gift for girlfriend", "affordable Diwali gifts for women"],
    excerpt: "Thoughtful Diwali gifts for women under ₹1000, chosen for usefulness, personality and life beyond the festive week.",
    eyebrow: "Diwali Gifting 2026",
    heroTitle: "Diwali gifts for women under ₹1000 that still feel personal.",
    heroSubtitle: "The price does not create thoughtfulness. Paying attention to her style, routines and preferences does.",
    sections: [
      { heading: "Choose an everyday luxury, not festive filler", body: ["A small gift can feel premium when it improves an ordinary day: a fragrance, a quality candle, a compact jewellery organiser, a hand-care ritual or a book chosen for her. Start with what she already enjoys rather than defaulting to a generic women’s hamper."] },
      { heading: "If she loves fragrance", body: ["SYRA is House of Eon’s graceful floral women’s fragrance, while Silent Gold offers a richer unisex direction. Those are distinct preferences, which is why fragrance gifting works best when you know her taste—or invite her into the choice."] },
      { heading: "When you do not know her perfume taste", body: ["Use the Scent Finder to narrow the mood, or gift the ₹249 Discovery Set so she can wear three fragrances on skin. The point is not merely sampling; it is giving her enough time to notice which scent feels like her."] },
      { heading: "Make the presentation intentional", body: ["A short handwritten note explaining why you chose the gift adds more meaning than elaborate disposable packaging. Mention the routine, memory or quality you had in mind. That context is what makes an affordable gift feel specific."] },
    ],
    faqs: [
      { question: "What is a thoughtful Diwali gift for women under ₹1000?", answer: "Choose a useful everyday luxury tied to her preferences. If she likes fragrance but you do not know her exact taste, a Discovery Set lets her choose." },
      { question: "Is perfume suitable as a Diwali gift for a wife or girlfriend?", answer: "Yes, especially when you know the styles she already wears. If not, a try-first set is less risky than selecting a full bottle from appearance alone." },
      { question: "Which House of Eon fragrance is for women?", answer: "SYRA is the dedicated women’s fragrance. Silent Gold is a richer unisex option." },
    ],
    relatedProductIds: ["syra", "silent-gold"],
    campaignLink: { href: "/pages/diwali-perfume", label: "Discover Diwali perfume gifts", text: "Give her the pleasure of finding her own match instead of deciding from a bottle description." },
  },
  {
    slug: "why-perfume-makes-a-great-diwali-gift",
    title: "Why Perfume Makes a Great Diwali Gift",
    seoTitle: "Why Perfume Makes a Great Diwali Gift | House of Eon",
    seoDescription: "Perfume can be personal, useful and memorable at Diwali—but only when chosen thoughtfully. Here is how to avoid the usual gifting mistakes.",
    seoKeywords: ["perfume Diwali gift", "perfume gift set for Diwali", "is perfume a good Diwali gift", "unique Diwali gifts"],
    excerpt: "Perfume is personal, useful and tied to memory—three reasons it works beautifully for Diwali when the choice is handled well.",
    eyebrow: "Diwali Gifting 2026",
    heroTitle: "Why perfume can be the rare Diwali gift they keep using.",
    heroSubtitle: "It is personal without being disposable, and every wear can bring the giver and occasion back to mind.",
    sections: [
      { heading: "Fragrance becomes part of a person’s routine", body: ["Unlike a decorative object used once for the festival, perfume can become part of getting ready for work, dinner, celebrations or travel. That repeated use is what gives the gift a life beyond Diwali."] },
      { heading: "Scent connects strongly with memory", body: ["People often remember where they wore a fragrance and who gave it to them. A perfume associated with festive evenings can carry that memory into completely ordinary days, making a relatively small gift feel emotionally durable."] },
      { heading: "The risk is choosing by packaging or discount", body: ["A beautiful bottle and a large discount do not tell you how a fragrance develops on someone’s skin. The wrong scent becomes cupboard clutter. Choose from known preferences, use a Scent Finder, or make trying several options part of the gift itself."] },
      { heading: "A Discovery Set solves the taste problem", body: ["House of Eon’s ₹249 set lets the recipient select three 8ml fragrances and redeem ₹249 toward a later full-size purchase. The gift still feels complete, while the final choice belongs to the person who will wear it."] },
    ],
    faqs: [
      { question: "Is perfume considered a good Diwali gift?", answer: "Yes. It is personal, useful and memorable, provided you respect that fragrance taste varies from person to person." },
      { question: "How do I choose perfume when gifting?", answer: "Look at fragrances they already use, ask whether they prefer fresh, warm, floral or woody styles, or choose a Discovery Set instead of blind buying." },
      { question: "Is a perfume Discovery Set a complete gift?", answer: "Yes. It provides multiple wearable fragrances immediately and lets the recipient carry its ₹249 value toward a preferred full-size bottle." },
    ],
    relatedProductIds: ["silent-gold", "desert-tonka", "syra"],
    campaignLink: { href: "/pages/diwali-perfume", label: "See the Diwali fragrance experience", text: "Start with discovery, then let the fragrance they love become the full-size gift." },
  },
  {
    slug: "how-to-choose-perfume-gift-without-knowing-their-taste",
    title: "How to Choose a Perfume Gift When You Don’t Know Their Taste",
    seoTitle: "How to Choose Perfume as a Gift Without Knowing Their Taste",
    seoDescription: "Do not know which perfume they like? Use these practical signals to narrow the choice—or remove the risk with a try-first Discovery Set.",
    seoKeywords: ["how to choose perfume as a gift", "perfume gift without knowing taste", "safe perfume gift", "perfume gift set for men and women"],
    excerpt: "A practical way to choose fragrance from their habits, wardrobe and existing products—without pretending there is one universally safe perfume.",
    eyebrow: "Fragrance Gifting",
    heroTitle: "Don’t know their perfume taste? Don’t pretend you do.",
    heroSubtitle: "Use the clues already in their routine, then give them room to make the final choice.",
    sections: [
      { heading: "Look at what they already wear", body: ["If possible, check the names or descriptions on their current bottles, deodorants or body products. Repeated words such as fresh, aquatic, floral, amber, vanilla, wood or spice are more useful than gender labels."] },
      { heading: "Use lifestyle clues carefully", body: ["Someone seeking a clean office scent may enjoy Arctic Wave; a person who dresses for warm evening occasions may prefer Desert Tonka; someone drawn to floral elegance may suit SYRA. These are informed starting points, not guarantees—skin chemistry and memory still shape preference."] },
      { heading: "Avoid the ‘most popular must be safe’ trap", body: ["Popularity reflects many people’s taste, not this person’s taste. A bestseller can still feel too sweet, sharp or heavy to the recipient. Reviews help with quality and performance questions, but cannot choose a personal scent for them."] },
      { heading: "Let them discover it themselves", body: ["When confidence is low, a Discovery Set is the honest solution. They choose three, wear them in real settings, then redeem the ₹249 value on the full-size fragrance that wins. The uncertainty becomes part of the experience instead of a gifting failure."] },
    ],
    faqs: [
      { question: "What is the safest perfume to give as a gift?", answer: "There is no universally safe perfume. Fresh styles can be approachable and unisex styles can reduce assumptions, but trying several is safer than guessing." },
      { question: "Should I choose perfume by gender?", answer: "Use gender labels only as a broad filter. Their existing scent preferences, daily setting and reaction on skin are more useful." },
      { question: "How many perfumes should be in a discovery gift set?", answer: "Three provides enough contrast to compare different moods without making the choice overwhelming." },
    ],
    relatedProductIds: ["arctic-wave", "desert-tonka", "syra", "silent-gold"],
    campaignLink: { href: "/pages/diwali-perfume", label: "Gift without guessing", text: "The Diwali Discovery Set turns an uncertain fragrance choice into a thoughtful try-first experience." },
  },
  {
    slug: "diwali-gift-ideas-beyond-sweets-and-dry-fruits-2026",
    title: "Diwali Gift Ideas Beyond Sweets and Dry Fruits in 2026",
    seoTitle: "Diwali Gift Ideas Beyond Sweets & Dry Fruits (2026)",
    seoDescription: "Looking beyond mithai and dry-fruit boxes? Explore useful, personal Diwali gift ideas for family, partners, friends and colleagues in 2026.",
    seoKeywords: ["Diwali gift ideas 2026", "Diwali gifts beyond sweets", "unique Diwali gifts", "alternative Diwali gifts"],
    excerpt: "Useful, personal alternatives to the familiar sweet and dry-fruit box—for gifts that last beyond the festive week.",
    eyebrow: "Diwali Gifting 2026",
    heroTitle: "Diwali gifts beyond sweets and dry fruits.",
    heroSubtitle: "Tradition has its place. But when you want the gift to last, choose something connected to their everyday life.",
    sections: [
      { heading: "Give an experience with a decision built in", body: ["A tasting flight, workshop, bookstore credit or perfume Discovery Set gives the recipient something to do as well as something to keep. This works especially well when you know their interests but not the exact item they would choose."] },
      { heading: "Upgrade something they use every day", body: ["A better travel mug, desk object, grooming essential, notebook or compact organiser can feel thoughtful when it solves a real inconvenience. Choose quality and usefulness over the number of items in the package."] },
      { heading: "Choose gifts that create a ritual", body: ["Tea, coffee, candles, fragrance and self-care products create repeatable moments. A scent worn before work or festive dinners can become a small personal ritual—and a strong memory of the occasion."] },
      { heading: "For fragrance, do not turn uncertainty into waste", body: ["If you know their scent family, a full bottle is direct. If you do not, gift three wearable trials for ₹249 and let them choose. The full ₹249 can then be redeemed on an eligible 50ml fragrance within 30 days."] },
    ],
    faqs: [
      { question: "What can I give for Diwali instead of sweets?", answer: "Consider an everyday upgrade, a personal care ritual, a learning or tasting experience, a book, a useful desk object or a fragrance Discovery Set." },
      { question: "What is a unique but affordable Diwali gift?", answer: "An experience-led gift can feel distinctive without being expensive. House of Eon’s ₹249 Discovery Set combines three wearable fragrances with redeemable value." },
      { question: "What is suitable for both men and women?", answer: "Useful everyday objects, experiences and try-first fragrance sets avoid many gender assumptions. Silent Gold is also a unisex full-size fragrance option." },
    ],
    relatedProductIds: ["silent-gold", "arctic-wave", "syra"],
    campaignLink: { href: "/pages/diwali-perfume", label: "Explore a different kind of Diwali gift", text: "Three fragrances, real time to choose, and ₹249 carried into the final bottle." },
  },
];

export function getGuideBySlug(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
