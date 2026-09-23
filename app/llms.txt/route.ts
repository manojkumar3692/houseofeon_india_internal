import { SITE_URL } from "@/lib/seo";
export function GET() {
  return new Response(`# House of Eon

> Indian perfume brand. Public catalogue information is brand-provided, not an independent ranking. Prices and availability can change.

## Public information
- [Compare fragrances](${SITE_URL}/fragrances-india): Notes, concentrations, sizes and offer conditions.
- [Products](${SITE_URL}/products): Canonical product pages and purchase links.
- [Shipping](${SITE_URL}/shipping): Published delivery and payment policies.
- [Returns](${SITE_URL}/pages/return-refund-policy): Return and replacement conditions.
- [Support](${SITE_URL}/contact): Human support.

## Optional agent connections
- [Agent integration guide](${SITE_URL}/agent): Read-only tools and usage examples.
- [OpenAPI specification](${SITE_URL}/agent/openapi.json): JSON API at POST /agent/query.
- MCP endpoint: ${SITE_URL}/agent/mcp (Streamable HTTP, JSON response mode).

These endpoints require explicit connection by a compatible client. This file is an informational directory, not a guarantee of automatic discovery, indexing or recommendations.
`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
