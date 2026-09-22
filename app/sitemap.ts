import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { guides } from "@/lib/guides";
import { situations } from "@/lib/situations";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/corporate-gifting`, changeFrequency: "monthly", priority: 0.9 },
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/pages/diwali-perfume`,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/long-lasting-perfume-for-men-india`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/best-perfume-for-women-in-india`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/scent-fix`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/scent-swipe`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/guides`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/perfume-for`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${siteUrl}/guides/${guide.slug}`,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const situationPages: MetadataRoute.Sitemap = situations.map((situation) => ({
    url: `${siteUrl}/perfume-for/${situation.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    ...["/perfumes-under-1000", "/fragrances-india", "/about", "/contact", "/shipping", "/pages/return-refund-policy"].map((path) => ({ url: `${siteUrl}${path}` })),
    ...staticPages, ...productPages, ...guidePages, ...situationPages];
}
