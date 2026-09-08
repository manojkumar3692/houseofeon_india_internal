export type RootsElement = "water" | "heat";

export type ScentGuide = {
  feel: Array<{
    label: string;
    value: string;
    explanation: string;
  }>;
  dayNight: string;
  weather: string;
  mood: string;
};

export type RootsProduct = {
  id: string;
  slug: string;
  name: string;
  tamilName: string;
  meaning: string;
  element: RootsElement;
  originalName: string;
  originalSlug: string;
  tagline: string;
  story: string;
  image: string;
  notes: string[];
  guide: ScentGuide;
};

export type RootsChapter = {
  number: string;
  region: string;
  theme: string;
  line: string;
  products: readonly [RootsProduct, RootsProduct];
};

export const rootsChapter01: RootsChapter = {
  number: "01",
  region: "Tamil Nadu",
  theme: "The Sea. The Heat.",
  line: "Two scents. One land.",
  products: [
    {
      id: "alai",
      slug: "alai-tamil-nadu-perfume",
      name: "ALAI",
      tamilName: "அலை",
      meaning: "Wave",
      element: "water",
      originalName: "Arctic Wave",
      originalSlug: "arctic-wave-perfume",
      tagline: "Fresh Mind. Endless Horizons.",
      story:
        "The coast never stays still. Wind crosses salt air, water returns, and the horizon keeps going. ALAI holds that lucid movement close to the skin.",
      image: "/products/alai-1.png",
      notes: ["Citrus light", "Marine air", "Clean woods"],
      guide: {
        feel: [
          { label: "First impression", value: "Bright & cooling", explanation: "A crisp citrus-and-sea-air opening that feels instantly clean." },
          { label: "On your skin", value: "Airy, not heavy", explanation: "Fresh and spacious rather than sweet, dense or syrupy." },
          { label: "People notice", value: "A clear personal trail", explanation: "Noticeable when someone is near you, without filling the whole room." },
        ],
        dayNight: "Day into dusk",
        weather: "Heat · humidity · open air",
        mood: "Clear · restless · free",
      },
    },
    {
      id: "veppam",
      slug: "veppam-tamil-nadu-perfume",
      name: "VEPPAM",
      tamilName: "வெப்பம்",
      meaning: "Warmth / Heat",
      element: "heat",
      originalName: "Desert Tonka",
      originalSlug: "desert-tonka-perfume",
      tagline: "Warmth in Every Breath.",
      story:
        "Afternoon settles over red earth. Warm air slows, amber light deepens, and the ground releases the day. VEPPAM turns that held heat into quiet magnetism.",
      image: "/products/veppam-1.png",
      notes: ["Amber light", "Tonka warmth", "Dry woods"],
      guide: {
        feel: [
          { label: "First impression", value: "Warm & rich", explanation: "Amber and spice arrive with the feeling of late-afternoon sun." },
          { label: "On your skin", value: "Smooth, gently sweet", explanation: "Tonka softens into a creamy warmth rather than sugary sweetness." },
          { label: "People notice", value: "Confident presence", explanation: "Carries clearly around you and leaves a warm impression as you move." },
        ],
        dayNight: "Dusk into night",
        weather: "Warm evenings · cooler air",
        mood: "Grounded · deep · magnetic",
      },
    },
  ],
};

export function getRootsProduct(id: string) {
  return rootsChapter01.products.find((product) => product.id === id);
}
