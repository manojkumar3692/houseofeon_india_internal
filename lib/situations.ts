export type SituationSection = {
  heading: string;
  body: string[];
};

export type Situation = {
  slug: string;
  searchIntent: string;
  eyebrow: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  shortAnswer: string;
  productIds: string[];
  sections: SituationSection[];
  faqs: { question: string; answer: string }[];
  reelHook: string;
  metaAngle: string;
};

// One useful answer per real-life perfume problem. These pages are deliberately
// specific: each can act as a search result, a paid-ad destination and the
// source script for a short-form video without changing the promise.
export const situations: Situation[] = [
  {
    slug: "chennai-weather",
    searchIntent: "perfume for Chennai weather",
    eyebrow: "Heat + humidity",
    title: "Perfume for Chennai weather",
    seoTitle: "Best Perfume for Chennai Weather: Fresh Picks That Wear Well | House of Eon",
    seoDescription: "Choose a perfume for Chennai's hot, humid weather. See the scent styles, spray routine and House of Eon picks that stay fresh without turning heavy.",
    summary: "Hot, humid days reward clean freshness and a lighter hand—not the loudest bottle on the shelf.",
    shortAnswer: "Start with Arctic Wave for crisp aquatic freshness. Use 3–4 sprays on clean, moisturised skin and one light spray on clothing; carry a small decant if your day runs into the evening.",
    productIds: ["arctic-wave", "zyrox", "rank"],
    sections: [
      { heading: "What Chennai heat changes", body: ["Heat makes fragrance open quickly, while humidity can make dense sweetness feel heavier than it did on a test strip. Fresh aquatic, citrus and clean-wood profiles usually feel easier through commutes and outdoor transitions."] },
      { heading: "Best match: Arctic Wave", body: ["Arctic Wave opens crisp and aquatic, then settles into clean woods. It is the easiest House of Eon starting point for daytime wear in Chennai. Zyrox is the sharper, more energetic alternative; save RANK for air-conditioned evenings or a more formal setting."] },
      { heading: "A Chennai-ready spray plan", body: ["Apply after a shower to moisturised skin: one spray on each side of the neck, one on the chest and one light spray inside the shirt. Do not overspray before stepping into a crowded cab or office. For a long day, a small afternoon reapplication is cleaner than eight sprays in the morning."] },
    ],
    faqs: [
      { question: "Which perfume type is best for Chennai weather?", answer: "Fresh aquatic, citrus and clean woody profiles are usually easiest in hot, humid conditions. Arctic Wave is House of Eon's most direct fit." },
      { question: "Does perfume last less in Chennai heat?", answer: "It can evaporate faster on hot skin. Moisturised skin, a light clothing spray and a controlled afternoon top-up can improve consistency." },
      { question: "How many sprays should I use in humid weather?", answer: "Start with 3–4 well-placed sprays. Add later only if needed; more at the start can feel heavy without guaranteeing better longevity." },
    ],
    reelHook: "Your perfume isn't weak. Chennai is just making it work overtime.",
    metaAngle: "Fresh confidence built for Chennai heat—not a heavy cloud by lunchtime.",
  },
  {
    slug: "office-ac",
    searchIntent: "perfume that survives office AC",
    eyebrow: "Workday performance",
    title: "Perfume that survives office AC",
    seoTitle: "Perfume That Survives Office AC Without Annoying the Room | House of Eon",
    seoDescription: "Find an office perfume that remains noticeable in air conditioning without becoming loud. Practical picks and an office-safe spray routine.",
    summary: "The goal is a clean scent bubble that lasts through meetings—not a fragrance that enters the room before you do.",
    shortAnswer: "Choose Arctic Wave for a clean everyday office scent or RANK for a more formal, woody presence. Spray under clothing and on the neck so the fragrance releases gradually through the workday.",
    productIds: ["arctic-wave", "rank", "silent-gold"],
    sections: [
      { heading: "Why office AC changes the brief", body: ["Cool, dry air slows diffusion, so a perfume may feel quieter than it did outside. That does not mean you should overspray: close seating and meeting rooms make projection more noticeable to everyone around you."] },
      { heading: "Clean desk or boardroom?", body: ["Arctic Wave is the easy daily choice: fresh, modern and clean. RANK adds spice, woods and a leather touch for formal meetings. Silent Gold works when you want a smoother unisex option with a more polished evening transition."] },
      { heading: "The office-safe application", body: ["Use one spray on each side of the neck and one under the shirt on the chest. If your commute is hot, apply after arriving rather than before. Keep any top-up to one spray, away from shared desks and lifts."] },
    ],
    faqs: [
      { question: "What perfume should men wear to the office?", answer: "A clean, controlled fragrance is safest. Arctic Wave suits everyday office wear; RANK suits a more formal or assertive setting." },
      { question: "How do I make perfume last in office AC?", answer: "Apply to moisturised skin and under clothing, where body warmth releases it gradually. A small midday top-up works better than overspraying." },
      { question: "Can perfume be too strong for an office?", answer: "Yes. In close rooms, even a good fragrance can distract. Start with three sprays and keep the scent within conversational distance." },
    ],
    reelHook: "If your perfume disappears the moment you enter office AC, change where you spray it.",
    metaAngle: "A workday scent people notice only when they come closer.",
  },
  {
    slug: "first-date",
    searchIntent: "best perfume for first date",
    eyebrow: "Date night",
    title: "Best perfume for a first date",
    seoTitle: "Best Perfume for a First Date: Smell Memorable, Not Loud | House of Eon",
    seoDescription: "Choose a first-date perfume that feels warm, confident and close. See the best House of Eon picks plus a simple date-night spray plan.",
    summary: "On a first date, closeness beats projection. Pick something inviting and let it be discovered.",
    shortAnswer: "Desert Tonka is the warm, smooth first-date pick; Silent Gold is the understated unisex option. Apply 3–4 sprays about 30 minutes before leaving so the opening settles before you meet.",
    productIds: ["desert-tonka", "silent-gold", "rank"],
    sections: [
      { heading: "What makes a good date scent", body: ["A first-date fragrance should feel intentional at conversational distance. Warm woods, amber, smooth spice and musk tend to create that close, polished effect without relying on room-filling projection."] },
      { heading: "Warm, quiet or bold", body: ["Choose Desert Tonka for warm amber-tonka depth, Silent Gold for quiet golden elegance, or RANK if your style is sharper and more assertive. The right choice is the one that matches how you actually dress and speak—not a character you are trying to perform."] },
      { heading: "Spray before, not at, the venue", body: ["Apply on clean skin 20–30 minutes before leaving: two around the neck, one on the chest and an optional light clothing spray. This lets the sharpest opening pass and leaves the smoother heart of the fragrance when you meet."] },
    ],
    faqs: [
      { question: "Which House of Eon perfume is best for a first date?", answer: "Desert Tonka is the warmest, most magnetic choice. Silent Gold is better if you prefer understated elegance." },
      { question: "How many sprays for a date?", answer: "Three or four is usually enough. You want the fragrance noticed within conversational distance, not across the venue." },
      { question: "Should I wear a sweet perfume on a first date?", answer: "A little warmth can feel inviting, but heavily sweet scents can become tiring. Desert Tonka balances its vanilla touch with amber, spice and woods." },
    ],
    reelHook: "The best first-date perfume shouldn't arrive before you do.",
    metaAngle: "Smell memorable at conversational distance—not from across the room.",
  },
  {
    slug: "indian-wedding-men",
    searchIntent: "perfume for Indian wedding men",
    eyebrow: "Wedding dressing",
    title: "Perfume for men at an Indian wedding",
    seoTitle: "Best Perfume for Men at an Indian Wedding | House of Eon",
    seoDescription: "Choose a men's perfume for Indian weddings, from daytime ceremonies to evening receptions. Warm, formal fragrance picks and application tips.",
    summary: "Wedding fragrance has to survive layers, movement, food, photos and a very long evening—while still matching the clothes.",
    shortAnswer: "Wear Desert Tonka with warm festive colours and evening functions; choose RANK with sharper tailoring or a reception suit. Apply to skin under your outfit, then add one light spray near the collar.",
    productIds: ["desert-tonka", "rank", "silent-gold"],
    sections: [
      { heading: "Match the function, not just the season", body: ["For a bright daytime ceremony, keep projection controlled. For a sangeet or reception, richer amber, woods and spice can hold their own beside heavier fabrics and a busier room."] },
      { heading: "Three wedding directions", body: ["Desert Tonka pairs naturally with warm festive dressing and evening celebrations. RANK fits structured tailoring and a more formal presence. Silent Gold is the elegant unisex choice for someone who wants richness without a conventionally masculine edge."] },
      { heading: "How to apply under festive wear", body: ["Spray on skin before dressing so the fragrance is not trapped entirely by layers: neck, chest and inner elbows. Add one careful collar spray only after testing the fabric. Carry a decant for a reception top-up rather than overspraying before the ceremony."] },
    ],
    faqs: [
      { question: "Which perfume is best for a wedding reception?", answer: "Desert Tonka is warm and celebratory, while RANK has a more formal, tailored character. Both work especially well for evening functions." },
      { question: "Can I spray perfume on a sherwani?", answer: "Test on an unseen area first, especially with delicate or light-coloured fabric. Applying primarily to skin is safer." },
      { question: "How many sprays for an Indian wedding?", answer: "Start with four well-placed sprays. If the event runs all day, carry a small decant and reapply lightly before the evening function." },
    ],
    reelHook: "Your wedding perfume has to compete with heat, layers and a six-hour function.",
    metaAngle: "A festive scent built for the ceremony, the photos and the reception.",
  },
  {
    slug: "smells-expensive-under-1000",
    searchIntent: "perfume that smells expensive under ₹1000",
    eyebrow: "Affordable luxury",
    title: "Perfume that smells expensive under ₹1000",
    seoTitle: "Perfume That Smells Expensive Under ₹1000 in India | House of Eon",
    seoDescription: "Shop perfumes that smell polished and premium under ₹1000 with EON20. Compare warm, fresh and unisex House of Eon fragrance styles.",
    summary: "Expensive-smelling is usually about a smooth dry-down and a clear point of view—not how loud or sweet a perfume is.",
    shortAnswer: "With EON20, every 50ml House of Eon perfume is ₹999. Start with Desert Tonka for warm richness, Silent Gold for quiet luxury or Arctic Wave for clean, polished freshness.",
    productIds: ["silent-gold", "desert-tonka", "arctic-wave"],
    sections: [
      { heading: "What 'smells expensive' actually means", body: ["A polished fragrance develops rather than staying stuck on one loud note. Look for a clear opening, a balanced middle and a smooth woody, amber or musk dry-down. Strong projection alone is not quality."] },
      { heading: "Three kinds of premium", body: ["Silent Gold gives golden amber, saffron and smooth woods; Desert Tonka gives warm, magnetic depth; Arctic Wave gives crisp cleanliness. Each feels premium in a different way, so choose the direction that matches your wardrobe and routine."] },
      { heading: "How the price gets under ₹1000", body: ["House of Eon 50ml bottles are ₹1,249 at regular price and ₹999 when the EON20 offer is applied. Check the price shown at checkout before ordering, since promotional pricing can change."] },
    ],
    faqs: [
      { question: "Which perfume smells most expensive under ₹1000?", answer: "For warm richness choose Desert Tonka; for understated unisex luxury choose Silent Gold. Both are ₹999 when the EON20 offer applies." },
      { question: "Does a stronger perfume smell more premium?", answer: "Not necessarily. Balance, texture and the dry-down matter more than raw strength." },
      { question: "Are all House of Eon perfumes under ₹1000?", answer: "Their regular 50ml price is ₹1,249. The current EON20 offer brings the price to ₹999; confirm the active price at checkout." },
    ],
    reelHook: "Want to smell expensive under ₹1000? Stop choosing only by strength.",
    metaAngle: "₹999 with EON20. Pick your version of expensive: fresh, warm or quietly rich.",
  },
  {
    slug: "men-who-hate-sweet-perfume",
    searchIntent: "perfume for men who hate sweet perfume",
    eyebrow: "Not sweet",
    title: "Perfume for men who hate sweet perfume",
    seoTitle: "Perfume for Men Who Hate Sweet Fragrances | House of Eon",
    seoDescription: "Avoid sugary fragrances with fresh aquatic, clean woody and dry spicy perfume options for men. Compare Arctic Wave, Zyrox and RANK.",
    summary: "If vanilla-heavy or syrupy scents wear you out, move toward aquatic freshness, dry woods and controlled spice.",
    shortAnswer: "Arctic Wave is the safest clean, non-sweet starting point. Zyrox feels icier and more energetic; RANK gives a drier spicy-woody direction for evenings and formal wear.",
    productIds: ["arctic-wave", "zyrox", "rank"],
    sections: [
      { heading: "Translate 'not sweet' into notes", body: ["Look for aquatic notes, citrus, marine accords, clean woods, musk, spice and leather touches. Be cautious with prominent vanilla, caramel, praline or very ripe fruit when sweetness is what bothers you."] },
      { heading: "Start fresh, then choose your edge", body: ["Arctic Wave is cool and clean. Zyrox turns that freshness sharper and younger. RANK drops the aquatic direction for spice, woods, musk and a leather touch—better if you want dry confidence rather than sporty freshness."] },
      { heading: "Always judge the dry-down", body: ["A bright opening can hide a sweeter base. Wear a sample for at least an hour before deciding; your skin and the weather can make the same fragrance feel sweeter or drier than it does on paper."] },
    ],
    faqs: [
      { question: "What fragrance notes are least sweet?", answer: "Aquatic notes, citrus, vetiver-style dryness, clean woods, herbs, spice and some musks usually read less sweet than vanilla or gourmand notes." },
      { question: "Is Arctic Wave a sweet perfume?", answer: "Its main character is fresh, aquatic and clean rather than sweet, making it the simplest House of Eon starting point for this preference." },
      { question: "Can a woody perfume still be sweet?", answer: "Yes. Woods are often blended with amber or vanilla, so test the complete dry-down rather than choosing from one listed note." },
    ],
    reelHook: "If every men's perfume smells too sweet to you, look for these six words.",
    metaAngle: "Fresh, woody, confident—and nowhere near dessert.",
  },
  {
    slug: "fresh-not-deodorant",
    searchIntent: "fresh perfume that doesn't smell like deodorant",
    eyebrow: "Fresh, not generic",
    title: "Fresh perfume that doesn't smell like deodorant",
    seoTitle: "Fresh Perfume That Doesn't Smell Like Deodorant | House of Eon",
    seoDescription: "Find a fresh perfume with aquatic lift and a real woody dry-down—not a flat aerosol smell. Compare Arctic Wave and Zyrox.",
    summary: "Good freshness evolves: a crisp opening should settle into woods, musk or texture instead of staying as one sharp blast.",
    shortAnswer: "Try Arctic Wave for aquatic freshness that settles into clean woods. Choose Zyrox if you want an icier, bolder fresh profile for college, weekends and nights out.",
    productIds: ["arctic-wave", "zyrox", "rank"],
    sections: [
      { heading: "Why some fresh scents feel generic", body: ["A flat, very sharp opening with no noticeable development can remind people of an aerosol body spray. A perfume feels more complete when citrus or marine freshness transitions into a recognisable woody or musky base."] },
      { heading: "Two fresher routes", body: ["Arctic Wave is clean, aquatic and versatile, with a woody dry-down that suits work. Zyrox is icier and more energetic, with enough edge for college and social plans. RANK is the non-aquatic alternative when you want freshness to give way to spice and woods."] },
      { heading: "Do not judge the first 30 seconds", body: ["Alcohol and bright top notes dominate immediately after spraying. Give any fresh perfume 15–20 minutes on skin before deciding whether it smells rounded or generic."] },
    ],
    faqs: [
      { question: "Why does my perfume smell like deodorant?", answer: "You may be judging only the sharp opening, or the scent may lack a developed base. Wait 15–20 minutes and look for woods or musk in the dry-down." },
      { question: "Which fresh perfume works for office?", answer: "Arctic Wave is the cleaner, more restrained option. Zyrox is brighter and more energetic." },
      { question: "Is aquatic perfume only for summer?", answer: "No. It is especially comfortable in heat, but a clean aquatic fragrance can work year-round for office and daytime wear." },
    ],
    reelHook: "Fresh perfume should smell clean—not like you emptied a deodorant can.",
    metaAngle: "Crisp at first spray. Clean woods after. Freshness with an actual dry-down.",
  },
  {
    slug: "humid-weather",
    searchIntent: "perfume for humid weather",
    eyebrow: "Humidity guide",
    title: "Perfume for humid weather",
    seoTitle: "Best Perfume for Humid Weather in India | House of Eon",
    seoDescription: "Choose perfume for humid Indian weather without making it feel heavy. Fresh scent picks, application advice and reapplication tips.",
    summary: "Humidity calls for clarity and restraint: wear a fresh structure, give it space and reapply lightly only when needed.",
    shortAnswer: "Choose Arctic Wave for clean aquatic wear or Zyrox for a brighter, bolder fresh style. Keep rich amber scents for evenings or air-conditioned settings, and start with 3–4 sprays.",
    productIds: ["arctic-wave", "zyrox", "silent-gold"],
    sections: [
      { heading: "Humidity makes density feel denser", body: ["Warm, moist air can make rich sweetness and heavy projection feel closer and more persistent. This is why a scent that feels perfect in winter can become tiring during a humid commute."] },
      { heading: "Choose clarity", body: ["Aquatic, citrus, airy and clean-wood profiles are easy starting points. Arctic Wave is the most versatile; Zyrox has more energetic bite. If you prefer richer scents, Silent Gold works better after sunset or in controlled indoor temperatures."] },
      { heading: "Use less, then reassess", body: ["Apply to clean, moisturised skin and allow ten minutes before adding more. Avoid spraying repeatedly because you have become nose-blind. Ask someone you trust whether they can smell it at conversational distance."] },
    ],
    faqs: [
      { question: "Which fragrance family is best for humidity?", answer: "Aquatic, citrus, green and clean woody profiles usually feel most comfortable. Personal taste and skin chemistry still matter." },
      { question: "Should I wear Extrait de Parfum in humid weather?", answer: "You can, but use fewer sprays. Concentration does not force a scent to be heavy; the note profile and application matter too." },
      { question: "Where should I spray in humid weather?", answer: "Use the sides of the neck and chest, plus one light clothing spray after testing the fabric. Avoid piling every spray onto one hot pulse point." },
    ],
    reelHook: "The wrong perfume in humidity feels twice as loud. Here's what to wear instead.",
    metaAngle: "Fresh enough for humidity. Polished enough for wherever the day goes.",
  },
  {
    slug: "what-to-wear-to-office",
    searchIntent: "what perfume should I wear to office",
    eyebrow: "Office scent wardrobe",
    title: "What perfume should I wear to the office?",
    seoTitle: "What Perfume Should I Wear to the Office? | House of Eon",
    seoDescription: "Choose an office perfume by dress code, commute and meeting style. Compare clean, formal and understated House of Eon fragrances.",
    summary: "Your office perfume should match the room: clean for everyday work, drier for formal meetings, softer when desks are close.",
    shortAnswer: "Wear Arctic Wave for most workdays, RANK for formal presentations and Silent Gold when you want understated polish. Keep the application to three sprays in close offices.",
    productIds: ["arctic-wave", "rank", "silent-gold"],
    sections: [
      { heading: "For an everyday workday", body: ["Arctic Wave's aquatic freshness and clean woods fit shirts, polos and business-casual dressing. It reads as well-groomed without demanding attention."] },
      { heading: "For presentations and client meetings", body: ["RANK adds spice, woods, musk and a leather touch. It feels more structured, so it works best when the clothes and occasion are equally deliberate. Use a controlled application in smaller rooms."] },
      { heading: "For understated or unisex polish", body: ["Silent Gold brings smooth woods, musk, amber and saffron-style warmth. It is richer than a standard fresh office scent, so two or three sprays are enough for an air-conditioned setting."] },
    ],
    faqs: [
      { question: "What is the safest office perfume?", answer: "A clean aquatic or woody fragrance with moderate application is safest. Arctic Wave is House of Eon's everyday office pick." },
      { question: "Can I wear a bold perfume to work?", answer: "Yes, if the environment and your application suit it. Keep RANK to two or three sprays in close or quiet offices." },
      { question: "Where should I apply perfume before work?", answer: "Use the neck and chest so it releases gradually. If you commute in heat, consider applying after you arrive." },
    ],
    reelHook: "One office perfume for normal days. A different one for the meeting that matters.",
    metaAngle: "Your 9-to-5 scent wardrobe: clean, formal or quietly polished.",
  },
  {
    slug: "noticeable-perfume-for-men",
    searchIntent: "perfume women notice on men",
    eyebrow: "Noticeable, not loud",
    title: "What makes a perfume noticeable on men?",
    seoTitle: "Perfume Women Notice on Men: What Actually Gets Noticed | House of Eon",
    seoDescription: "No perfume guarantees attention. Learn what makes a men's fragrance pleasant and noticeable, with warm, clean and confident House of Eon picks.",
    summary: "There is no universal compliment magnet. A fragrance gets noticed when it suits you, is applied well and is pleasant at the distance people actually meet you.",
    shortAnswer: "For warm presence choose Desert Tonka; for clean confidence choose Arctic Wave; for a sharper formal style choose RANK. Fit and restraint matter more than chasing a supposed universal favourite.",
    productIds: ["desert-tonka", "arctic-wave", "rank"],
    sections: [
      { heading: "No bottle can promise compliments", body: ["Attraction and taste are personal. Claims that one perfume is guaranteed to make women notice you are marketing, not evidence. What you can control is grooming, fit, application and whether the scent feels coherent with you."] },
      { heading: "Three kinds of noticeable", body: ["Desert Tonka creates warm, close-range richness. Arctic Wave signals clean, easy confidence. RANK feels bolder and more formal. Pick the impression that already matches your setting and personality."] },
      { heading: "Projection is not the same as appeal", body: ["Overspraying may make a perfume noticeable for the wrong reason. Apply 3–4 sprays and aim for a scent bubble at conversational distance. Give the fragrance time to settle before entering a shared space."] },
    ],
    faqs: [
      { question: "Which men's perfume gets the most compliments?", answer: "There is no universal winner because taste varies. Warm scents like Desert Tonka and clean scents like Arctic Wave create different impressions; wear the one that fits you." },
      { question: "Do women prefer fresh or woody perfume on men?", answer: "Preferences differ. Fresh profiles often feel easy and clean; warm woody profiles can feel richer and more intimate." },
      { question: "How can I make my perfume noticeable without overspraying?", answer: "Apply to moisturised skin at the neck and chest, add one light clothing spray and let it settle. Three or four sprays is a sensible start." },
    ],
    reelHook: "No perfume guarantees compliments—but this is what people actually notice.",
    metaAngle: "Be memorable for the scent bubble, not the scent cloud.",
  },
];

export function getSituationBySlug(slug: string) {
  return situations.find((situation) => situation.slug === slug);
}
