import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Explicit search agents inherit the same exclusions as all other crawlers.
  // Training preferences are independent of search eligibility.
  return {
    rules: ["*", "OAI-SearchBot", "PerplexityBot", "Claude-SearchBot"].map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: ["/cart", "/checkout", "/success", "/track-order", "/admin", "/api/"],
    })),
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
