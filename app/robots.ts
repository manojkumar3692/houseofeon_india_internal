import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/long-lasting-perfume-for-men-india",
          "/best-perfume-for-women-in-india",
          "/scent-finder",
          "/scent-swipe",
        ],
        disallow: [
          "/cart",
          "/checkout",
          "/success",
          "/track-order",
          "/admin",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}