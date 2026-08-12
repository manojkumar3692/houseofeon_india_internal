import { products, Product } from "@/lib/products";
import { getProductTaxonomy } from "@/lib/productTaxonomy";
import { getBrandPolicy } from "@/lib/brandPolicy";
import { coupons } from "@/lib/coupons";
import { EON20_DISCOUNTED_PRICE_INR, BASE_PRICE_INR } from "@/lib/pricing";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// ---------------------------------------------------------------------------
// The concierge never gets the full catalog dumped into its prompt — it
// calls these tools on demand, and every tool here is backed by the real
// product/coupon/order data already used elsewhere on the site. The model
// decides WHEN to call a tool; what comes back is always the source of
// truth, never something the model can override or embellish factually.
//
// Two kinds of side effects come out of a tool call:
// - `toolResultForModel`: compact JSON fed back into the chat loop so the
//   model can write a natural-language reply grounded in real data.
// - contributions to `display` (products/comparison/offer/orderStatus/
//   clientActions): structured data the WIDGET renders directly as UI
//   (product cards, comparison cards, a cart-add confirmation) rather than
//   parsing out of prose.
// ---------------------------------------------------------------------------

export type ProductCardData = {
  productId: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  mrp?: number;
  image: string;
  productUrl: string;
  gender: string;
  fragranceFamily: string;
  keySellingPoint: string;
};

export type ComparisonEntry = {
  productId: string;
  name: string;
  character: string;
  bestFor: string;
  feel: string;
};

export type OfferData = {
  enabled: boolean;
  code?: string;
  label?: string;
};

export type OrderStatusData = {
  found: boolean;
  orderNumber?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  trackingUrl?: string | null;
};

export type ClientAction =
  | { type: "add_to_cart"; productId: string; quantity: number; productName: string };

export type ToolDisplayAccumulator = {
  products: ProductCardData[];
  comparison: ComparisonEntry[] | null;
  offer: OfferData | null;
  orderStatus: OrderStatusData | null;
  clientActions: ClientAction[];
};

export function createDisplayAccumulator(): ToolDisplayAccumulator {
  return { products: [], comparison: null, offer: null, orderStatus: null, clientActions: [] };
}

export type CartSummaryLine = { productId: string; quantity: number };

export type ToolContext = {
  cartSummary?: CartSummaryLine[];
};

function toProductCard(product: Product): ProductCardData {
  const taxonomy = getProductTaxonomy(product);
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    price: EON20_DISCOUNTED_PRICE_INR,
    mrp: BASE_PRICE_INR,
    image: product.image,
    productUrl: `/products/${product.slug}`,
    gender: product.gender,
    fragranceFamily: taxonomy.fragranceFamily,
    keySellingPoint: taxonomy.keySellingPoints[0] || product.tagline,
  };
}

function findProduct(idOrSlugOrName: string): Product | undefined {
  const needle = idOrSlugOrName.trim().toLowerCase();
  return products.find(
    (p) =>
      p.id.toLowerCase() === needle ||
      p.slug.toLowerCase() === needle ||
      p.name.toLowerCase() === needle ||
      p.name.toLowerCase().includes(needle)
  );
}

function fullProductDetail(product: Product) {
  const taxonomy = getProductTaxonomy(product);
  return {
    productId: product.id,
    name: product.name,
    gender: product.gender,
    size: product.size,
    concentration: product.concentration,
    price: EON20_DISCOUNTED_PRICE_INR,
    mrp: BASE_PRICE_INR,
    tagline: product.tagline,
    description: product.description,
    notes: product.notes,
    mood: product.mood,
    occasion: product.occasion,
    fragranceFamily: taxonomy.fragranceFamily,
    recommendedWeather: taxonomy.recommendedWeather,
    recommendedTime: taxonomy.recommendedTime,
    stockStatus: taxonomy.stockStatus,
    keySellingPoints: taxonomy.keySellingPoints,
    scentProfile: product.scentProfile,
    rating: product.rating,
    reviewCount: product.reviewCount,
  };
}

// ---------------------------------------------------------------------------
// Tool schemas (OpenAI function-calling format)
// ---------------------------------------------------------------------------
export const ASSISTANT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_product",
      description:
        "Look up full real details for one House of Eon fragrance by name, slug, or id. Use this before answering any specific question about a named product's notes, price, occasion fit, etc.",
      parameters: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name, slug, or id, e.g. 'Zyrox' or 'RANK'." },
        },
        required: ["product"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description:
        "Find House of Eon fragrances matching a customer's stated preference. Use for 'find my scent' style requests instead of guessing from memory.",
      parameters: {
        type: "object",
        properties: {
          mood: { type: "string", description: "Desired mood/character, e.g. fresh, warm, elegant, bold, sweet, woody." },
          occasion: { type: "string", description: "Where they'll wear it, e.g. office, date night, gifting, college, festive." },
          gender: { type: "string", enum: ["Men", "Women", "Unisex"] },
          limit: { type: "number", description: "Max results, default 2. Never exceed 3." },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "compare_products",
      description: "Compare 2 (max 3) named House of Eon fragrances side by side.",
      parameters: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: { type: "string" },
            description: "2-3 product names/slugs/ids to compare, e.g. ['RANK', 'Zyrox'].",
          },
        },
        required: ["products"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_current_offer",
      description: "Get the real, currently-active coupon/offer, if any. Never mention a discount without calling this first.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_brand_policy",
      description:
        "Get House of Eon's real policy text for a topic. Topics: about, made_in_india, concentration, shipping, payments, returns, cod, offers.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: ["about", "made_in_india", "concentration", "shipping", "payments", "returns", "cod", "offers"],
          },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_order_status",
      description:
        "Look up a real order's status by order number and the phone number used at checkout. Only call this if the customer has provided BOTH. Never guess or invent an order status.",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string" },
          phone: { type: "string" },
        },
        required: ["orderNumber", "phone"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description: "Add a real House of Eon product to the customer's cart. Only call this after the customer clearly asks to add or buy a specific product.",
      parameters: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name, slug, or id." },
          quantity: { type: "number", description: "Defaults to 1." },
        },
        required: ["product"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_cart",
      description: "Get what's currently in the customer's cart (as reported by the site).",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ---------------------------------------------------------------------------
// Executors — each takes parsed args + the shared display accumulator (for
// side effects the UI renders) + tool context, returns the JSON to feed
// back to the model.
// ---------------------------------------------------------------------------
export async function executeAssistantTool(
  name: string,
  args: Record<string, any>,
  display: ToolDisplayAccumulator,
  context: ToolContext
): Promise<unknown> {
  switch (name) {
    case "get_product": {
      const product = findProduct(String(args.product || ""));
      if (!product) return { found: false, error: "No House of Eon product matches that name." };

      if (!display.products.find((p) => p.productId === product.id)) {
        display.products.push(toProductCard(product));
      }
      return { found: true, product: fullProductDetail(product) };
    }

    case "search_products": {
      const mood = String(args.mood || "").toLowerCase();
      const occasion = String(args.occasion || "").toLowerCase();
      const gender = args.gender ? String(args.gender) : undefined;
      const limit = Math.min(Math.max(Number(args.limit) || 2, 1), 3);

      const scored = products
        .map((product) => {
          let score = 0;
          const moodText = product.mood.join(" ").toLowerCase();
          const occasionText = product.occasion.join(" ").toLowerCase();

          if (mood && moodText.includes(mood)) score += 2;
          if (occasion && occasionText.includes(occasion)) score += 2;
          if (gender && product.gender === gender) score += 1;
          if (gender && product.gender === "Unisex") score += 0.5;

          return { product, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const results = scored.length > 0 ? scored : products.slice(0, limit).map((product) => ({ product, score: 0 }));

      for (const { product } of results) {
        if (!display.products.find((p) => p.productId === product.id)) {
          display.products.push(toProductCard(product));
        }
      }

      return {
        results: results.map(({ product }) => fullProductDetail(product)),
      };
    }

    case "compare_products": {
      const names: string[] = Array.isArray(args.products) ? args.products : [];
      const matched = names.map((n) => findProduct(String(n))).filter((p): p is Product => Boolean(p)).slice(0, 3);

      if (matched.length < 2) {
        return { error: "Need at least 2 valid House of Eon products to compare." };
      }

      const entries: ComparisonEntry[] = matched.map((product) => ({
        productId: product.id,
        name: product.name,
        character: product.mood.slice(0, 2).join(" / "),
        bestFor: product.occasion.slice(0, 2).join(", "),
        feel: product.mood[2] || product.mood[0],
      }));

      display.comparison = entries;
      for (const product of matched) {
        if (!display.products.find((p) => p.productId === product.id)) {
          display.products.push(toProductCard(product));
        }
      }

      return { comparison: matched.map(fullProductDetail) };
    }

    case "get_current_offer": {
      const active = coupons.find((c) => c.active && c.code !== "ONLYADMIN");
      const offer: OfferData = active
        ? { enabled: true, code: active.code, label: active.label }
        : { enabled: false };
      display.offer = offer;
      return offer;
    }

    case "get_brand_policy": {
      const policy = getBrandPolicy(String(args.topic || ""));
      return policy ? { found: true, policy } : { found: false };
    }

    case "get_order_status": {
      const orderNumber = String(args.orderNumber || "").trim();
      const phone = String(args.phone || "").trim();
      if (!orderNumber || !phone) return { found: false, error: "Need both order number and phone." };

      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from("orders")
          .select("order_number,payment_status,shipping_status,tracking_url")
          .eq("order_number", orderNumber)
          .eq("customer_phone", phone)
          .single();

        if (error || !data) {
          const result: OrderStatusData = { found: false };
          display.orderStatus = result;
          return result;
        }

        const result: OrderStatusData = {
          found: true,
          orderNumber: data.order_number,
          paymentStatus: data.payment_status,
          shippingStatus: data.shipping_status,
          trackingUrl: data.tracking_url,
        };
        display.orderStatus = result;
        return result;
      } catch (err) {
        console.error("get_order_status tool error:", err);
        return { found: false, error: "Order lookup is temporarily unavailable." };
      }
    }

    case "add_to_cart": {
      const product = findProduct(String(args.product || ""));
      if (!product) return { success: false, error: "That product isn't in the House of Eon catalogue." };

      const quantity = Math.max(1, Math.min(20, Math.floor(Number(args.quantity) || 1)));
      display.clientActions.push({
        type: "add_to_cart",
        productId: product.id,
        quantity,
        productName: product.name,
      });
      if (!display.products.find((p) => p.productId === product.id)) {
        display.products.push(toProductCard(product));
      }

      return { success: true, productId: product.id, productName: product.name, quantity };
    }

    case "get_cart": {
      const lines = context.cartSummary || [];
      if (lines.length === 0) return { empty: true, items: [] };

      const items = lines
        .map((line) => {
          const product = products.find((p) => p.id === line.productId);
          if (!product) return null;
          return { productId: product.id, name: product.name, quantity: line.quantity, price: EON20_DISCOUNTED_PRICE_INR };
        })
        .filter(Boolean);

      return { empty: items.length === 0, items };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
