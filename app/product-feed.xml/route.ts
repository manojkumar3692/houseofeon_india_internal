import { products } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://houseofeon.in";
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
