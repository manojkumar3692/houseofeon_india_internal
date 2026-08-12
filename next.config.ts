import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},

  // houseofeon.in used to run a different (Shopify-style) storefront with a
  // different product lineup (Riva, Zyro, Nexi, a day-night duo combo) under
  // /collections, /products, /blog and /pages paths. That store is gone, but
  // Google Search Console shows ~20 of those old URLs are still indexed and
  // picking up real impressions — some for genuinely valuable queries (e.g.
  // /blog/riva-luxury-women-perfume sits at position 8.8 for women's-perfume
  // searches, better than our own current page for the same topic). Without
  // a redirect, that traffic/relevance just dies as a 404 instead of
  // transferring to the current equivalent page — a permanent redirect is
  // what tells Google (and anyone with an old bookmark or backlink) where
  // the content actually moved to.
  async redirects() {
    return [
      {
        source: "/scent-finder",
        destination: "/scent-fix",
        permanent: true,
      },
      { source: "/shop", destination: "/products", permanent: true },
      { source: "/shop/shopping-cart", destination: "/cart", permanent: true },
      { source: "/blog", destination: "/guides", permanent: true },
      {
        source: "/collections/women-perfume",
        destination: "/best-perfume-for-women-in-india",
        permanent: true,
      },
      {
        source: "/collections/men-perfume",
        destination: "/long-lasting-perfume-for-men-india",
        permanent: true,
      },
      {
        source: "/blog/luxury-women-perfume-best-fragrance",
        destination: "/best-perfume-for-women-in-india",
        permanent: true,
      },
      {
        source: "/blog/riva-luxury-women-perfume",
        destination: "/best-perfume-for-women-in-india",
        permanent: true,
      },
      {
        source: "/blog/riva-executive-women-perfume-luxury-fragrance",
        destination: "/products/syra-women-perfume",
        permanent: true,
      },
      {
        source: "/blog/best-women-fragrance-riva-perfume",
        destination: "/best-perfume-for-women-in-india",
        permanent: true,
      },
      {
        source: "/blog/best-luxury-perfumes-for-men-women",
        destination: "/products",
        permanent: true,
      },
      {
        source: "/blog/rank-man-perfume-long-lasting-fragrance",
        destination: "/products/rank-perfume",
        permanent: true,
      },
      {
        source: "/blog/best-long-lasting-perfume-for-men",
        destination: "/long-lasting-perfume-for-men-india",
        permanent: true,
      },
      {
        source: "/products/day-night-duo-rank-nexi-perfume-combo-men-50ml",
        destination: "/products/rank-perfume",
        permanent: true,
      },
      {
        source: "/products/zyro-summer-perfume-for-men-50ml",
        destination: "/products/zyrox-perfume",
        permanent: true,
      },
      {
        source: "/products/riva-executive-women-perfume-50ml-edp-house-of-eon",
        destination: "/products/syra-women-perfume",
        permanent: true,
      },
      {
        source: "/products/rank-man-perfume-long-lasting-fragrance",
        destination: "/products/rank-perfume",
        permanent: true,
      },
      // No dedicated About/Contact/Privacy/Terms/Shipping pages exist yet on
      // the current site, so these fall back to the homepage rather than a
      // 404 — see the note to the user about building real policy pages,
      // since that's a separate (and for an Indian e-commerce store,
      // genuinely important) gap from this redirect cleanup.
      { source: "/pages/about-us", destination: "/", permanent: true },
      { source: "/pages/contact-us", destination: "/", permanent: true },
      { source: "/pages/privacy-policy", destination: "/", permanent: true },
      { source: "/pages/tnc", destination: "/", permanent: true },
      { source: "/pages/shipping-policy", destination: "/", permanent: true },
      { source: "/auth/login", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
