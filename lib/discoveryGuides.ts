import type { Guide } from "@/lib/guides";

// Brand-authored buying advice grounded in the existing catalogue. These
// recommendations are not independent rankings or laboratory wear tests.
const entries = [
  {
    slug: "everyday-perfume-under-1500-india",
    title: "How to choose an everyday perfume under ₹1,500 in India",
    answer: "For everyday wear, choose a scent you enjoy at close range, then compare bottle size, price and use case. Within House of Eon, Arctic Wave suits a fresh aquatic preference, RANK a versatile masculine profile, and SYRA a floral preference. Check the product cards below for current prices.",
    ids: ["arctic-wave", "rank", "syra"],
    sections: [
      { heading: "Compare the bottle, not just the discount", body: ["A price below ₹1,500 means little without the bottle volume. Divide the listed price by millilitres to compare like for like. A discovery size and a 50ml bottle serve different purposes: the first reduces the cost of testing; the second is useful once you know what you enjoy.", "Use the normal selling price for your budget. Coupon eligibility and temporary offers can change. The linked House of Eon product pages show the bottle size, concentration, notes and current catalogue price together."] },
      { heading: "Match your daily setting", body: ["For a commute followed by an air-conditioned office, begin with a modest application of a fresh scent such as Arctic Wave. RANK is another option if you prefer a masculine daily-wear profile. SYRA is an option for someone who prefers a floral direction.", "A fragrance that feels comfortable outside may feel stronger in a small meeting room. Test on a normal day and ask someone nearby whether the application is comfortable. The most expensive or strongest option is not automatically the best everyday choice."] },
      { heading: "Try before committing to a signature scent", body: ["Read the notes and the performance caveat on each product page, and use the trial pack where your selected fragrance is available. Assess the opening and the later dry-down, rather than deciding in the first minute.", "This is a House of Eon buying guide to our own range. It does not establish which Indian brand is best or claim that our perfumes outperform competitors."] },
    ],
    question: "Does a higher concentration guarantee all-day wear?",
    response: "No. Concentration is one factor; formula, skin, application and weather also affect wear. We do not promise a fixed number of hours for every wearer.",
  },
  {
    slug: "office-perfume-men-india-not-too-strong",
    title: "Office perfume for men in India: choosing a scent that is not too strong",
    answer: "For a restrained office scent, start with a light application of a fresh or clean fragrance and assess it indoors. Arctic Wave is House of Eon's aquatic option; RANK offers another daily-wear direction. Neither a concentration label nor a note list alone tells you how strong a perfume will feel to colleagues.",
    ids: ["arctic-wave", "rank"],
    sections: [
      { heading: "Choose for the room you work in", body: ["A shared desk, small cab or meeting room gives fragrance less space to disperse. The goal is a scent noticeable nearby, rather than one that fills the room. Follow any fragrance-free workplace policy and consider colleagues who are sensitive to scent.", "Fresh and clean descriptions are a useful starting point for your preferences, but do not prove low projection. Test a small application before wearing a new fragrance for a full office day."] },
      { heading: "Compare Arctic Wave and RANK", body: ["Arctic Wave lists aquatic notes, citrus, marine accord and clean woods. Its catalogue positioning includes office, daily wear and summer. RANK is listed as an Eau de Parfum and is another option in our men's collection.", "Choose according to the smell you prefer and test the amount. Extrait de Parfum does not automatically mean louder, and Eau de Parfum does not automatically mean weaker. The full composition and application matter."] },
      { heading: "Use a repeatable wear test", body: ["Try the same modest application on two ordinary workdays. Check the scent after your commute and later in the afternoon. Ask a trusted colleague whether they notice it at a normal conversational distance.", "If it feels overwhelming, reduce the amount next time instead of immediately changing perfumes. Avoid topping up simply because you have stopped noticing your own scent; that alone does not establish that it has disappeared."] },
    ],
    question: "Which House of Eon perfume should I shortlist for office wear?",
    response: "Shortlist Arctic Wave for an aquatic, clean profile and RANK for another daily-wear option. Start lightly and evaluate in your actual workplace; individual preferences differ.",
  },
  {
    slug: "unisex-perfume-hot-humid-weather-india",
    title: "Choosing a unisex perfume for hot and humid weather in India",
    answer: "For hot, humid days, shortlist a scent that feels comfortable to you in the heat and test a light application. Anyone can wear any fragrance. House of Eon's explicitly unisex Silent Gold has a warm amber and woody profile; it is positioned for evenings and occasions, so it is not automatically our first choice for a fresh daytime scent.",
    ids: ["silent-gold", "arctic-wave"],
    sections: [
      { heading: "Separate the gender label from the scent", body: ["Unisex is a merchandising label, not a restriction on who can wear a perfume. If you prefer aquatic or citrus notes, you can explore Arctic Wave even though it sits in our men's collection. If you prefer warmth and woods, Silent Gold may be closer to your taste.", "Choose from the notes, setting and your own wear test. A label does not tell you whether a perfume will feel refreshing on a humid afternoon."] },
      { heading: "Be honest about warm fragrances", body: ["Silent Gold lists golden amber, a saffron touch and smooth woods. Its product description favours evening wear, festive moments and special occasions. Someone who loves that profile may still wear it during the day, but it should not be described as an aquatic summer perfume.", "For a fresher direction, compare Arctic Wave's aquatic and citrus profile. These are catalogue-based suggestions, not results from a controlled humidity or longevity test."] },
      { heading: "Test across your actual day", body: ["Try a modest application during your usual commute and again on a day spent mostly indoors. Record whether you still like the dry-down and whether the scent feels too prominent at close range.", "Performance varies with the wearer, environment and application. A claim that one fragrance lasts a fixed number of hours on everyone would not be a reliable basis for choosing it."] },
    ],
    question: "Is Silent Gold a fresh aquatic summer perfume?",
    response: "No. Silent Gold is our warm amber and woody unisex option, positioned for evenings and occasions. For an aquatic profile, compare Arctic Wave regardless of its men's category label.",
  },
  {
    slug: "first-date-perfume-india",
    title: "What perfume should you choose for a first date in India?",
    answer: "Choose a familiar scent that feels comfortable at close range. For an outdoor daytime date, consider Arctic Wave's fresh profile; for a warm evening scent, compare Desert Tonka and Silent Gold. SYRA is an option if you prefer a floral direction. Your preference and the setting matter more than a promise of compliments.",
    ids: ["arctic-wave", "desert-tonka", "silent-gold", "syra"],
    sections: [
      { heading: "Start with the venue and time", body: ["A daytime walk and an evening dinner are different settings. A light fresh profile may feel more comfortable to you outdoors, while a warm amber or woody scent may suit your evening preference. These are suggestions, not rules tied to gender.", "Desert Tonka's listed notes include tonka, amber, warm woods and spice. Silent Gold offers a warm unisex direction. Compare their descriptions with the fresher Arctic Wave and the floral SYRA before deciding."] },
      { heading: "Keep the application considerate", body: ["Use an amount you have already tested. In a car or at a small restaurant table, your date is close enough that an unfamiliar heavy application can be uncomfortable. Respect a request to avoid fragrance.", "Do not layer several new products on the same day. Testing one perfume at a time makes it easier to know what you actually enjoy after the opening settles."] },
      { heading: "Avoid buying on an attraction promise", body: ["No perfume can guarantee attraction or a compliment. Choose a fragrance because you like wearing it and it fits the occasion. If you are unsure, try a sample or discovery format before committing to a full bottle.", "Our recommendations describe House of Eon's own catalogue. We have not ranked these fragrances through an independent consumer panel or a comparative wear trial."] },
    ],
    question: "Is Desert Tonka a good option for an evening date?",
    response: "It is worth considering if you enjoy warm tonka, amber and woody notes. Test it first and apply lightly; someone who prefers fresh scents may choose Arctic Wave instead.",
  },
  {
    slug: "buy-perfume-online-india-checklist",
    title: "Buying perfume online in India: what to check before ordering",
    answer: "Buy from a seller that clearly shows the bottle size, concentration, selling price, support contact, delivery information and return conditions. House of Eon sells its own range through this website with product notes, online checkout and WhatsApp support. Read the return policy before ordering: fragrance preference alone is not a reason for a return.",
    ids: ["rank", "syra", "silent-gold"],
    sections: [
      { heading: "Check the actual product details", body: ["Compare the exact fragrance and bottle size rather than a brand name alone. Look for a note description, concentration label and a clear price. A product image should identify the bottle you are buying.", "Long-lasting is a broad description, not a standardised promise. Prefer explanations of when and how a perfume was tested over an unexplained hour count. Our product pages acknowledge variation by skin, weather and application."] },
      { heading: "Read delivery and return terms", body: ["House of Eon's published policy offers free shipping across India, with delivery typically taking 3–4 working days. That is a general estimate; contact support for a location-specific estimate.", "Defective or damaged products must be reported within 3 calendar days of delivery for review. Change of mind or fragrance preference does not qualify for a return. Obtain support approval before sending anything back; return shipping is not free."] },
      { heading: "Check payment eligibility at checkout", body: ["Full prepaid payment is supported. Eligible orders may show a partial cash-on-delivery option with an online token payment and the balance due at delivery. Full cash-on-delivery is not offered.", "If you are exploring a new scent profile, consider the trial pack before a full-size purchase. Check the available scents and current terms on that page. Keep your order confirmation so support can help if there is a delivery issue."] },
    ],
    question: "Can I return a perfume because I do not like the smell?",
    response: "House of Eon does not offer returns for fragrance preference or change of mind. Defective or damaged products must be reported within 3 calendar days and are reviewed for replacement or exchange under the published policy.",
  },
];

export const discoveryGuides: Guide[] = entries.map((entry) => ({
  slug: entry.slug, title: entry.title, seoTitle: `${entry.title} | House of Eon`,
  seoDescription: entry.answer.slice(0, 158), seoKeywords: [], excerpt: entry.answer,
  eyebrow: "Perfume buying advice", heroTitle: entry.title, heroSubtitle: entry.answer,
  sections: entry.sections, faqs: [{ question: entry.question, answer: entry.response }],
  relatedProductIds: entry.ids,
}));
