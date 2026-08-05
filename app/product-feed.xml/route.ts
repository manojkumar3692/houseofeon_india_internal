import { products } from "@/lib/products";
import { EON20_DISCOUNTED_PRICE_INR } from "@/lib/pricing";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "House of Eon";

// Google Shopping / Merchant Center RSS 2.0 feed, generated from the same
// product data everything else on the site uses (lib/products.ts) — there
// is no separate feed to keep in sync by hand.
//
// After deploying, add this feed URL in Google Merchant Center
// (Products > Feeds > add a scheduled fetch) as:
//   https://www.houseofeon.in/product-feed.xml
//
// This is what makes products eligible to appear in Google Shopping
// results and in AI Overviews' shopping citations.
//
// This same URL is also registered as a scheduled feed on the Meta
// Commerce Manager "HOUSE_OF_EON_INTERNAL" catalog, since Meta accepts the
// same Google RSS `g:` namespace format. <g:id> intentionally matches
// lib/products.ts product.id, which is also each product's retailer_id in
// the Meta catalog — one feed, one set of IDs, kept in sync everywhere.

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const items = products
    .map((product) => {
      return `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <title>${escapeXml(`${product.name} - ${product.tagline}`)}</title>
      <description>${escapeXml(product.longDescription || product.description)}</description>
      <link>${siteUrl}/products/${product.slug}</link>
      <g:image_link>${siteUrl}${product.image}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${product.price}.00 INR</g:price>
      <g:sale_price>${EON20_DISCOUNTED_PRICE_INR}.00 INR</g:sale_price>
      <g:brand>${escapeXml(brandName)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Perfume &amp; Cologne</g:google_product_category>
      <g:product_type>Perfume &gt; ${escapeXml(product.gender)}</g:product_type>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(brandName)} Product Feed</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(brandName)} perfume product feed for Google Merchant Center</description>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
