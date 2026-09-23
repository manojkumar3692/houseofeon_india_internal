import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";
export const metadata: Metadata = { title: "Connect an AI Assistant | House of Eon", description: "Read-only MCP and JSON API access to House of Eon perfume details, current offers, stock snapshots and published policies.", alternates: { canonical: `${SITE_URL}/agent` } };
export default function AgentPage() {
  return <main><section className="seo-hero"><div className="container seo-hero-copy"><div className="eyebrow">For assistant developers</div><h1>Let your assistant ask House of Eon.</h1><p>Connect a compatible assistant to our public catalogue to help shoppers compare fragrances, check offers and understand our published policies.</p></div></section>
    <section className="section"><div className="container seo-guide-content" style={{ maxWidth: 900 }}>
      <h2>Connect with MCP</h2><p>Use Streamable HTTP at <code>{SITE_URL}/agent/mcp</code>. This server uses the official MCP TypeScript SDK v1, stateless requests and JSON responses. No API key is required for these public, read-only tools. Your assistant must explicitly connect; publishing this endpoint does not automatically connect third-party AI services.</p>
      <h2>Available tools</h2><ul><li><code>search_perfumes</code>: filter by scent keywords, occasion, catalogue gender label and maximum INR price.</li><li><code>get_perfume</code>: retrieve one product by ID or slug.</li><li><code>compare_perfumes</code>: compare two to four distinct perfumes.</li><li><code>get_store_policy</code>: shipping, payments, COD and returns.</li></ul>
      <h2>Use the JSON API</h2><p>Integrations that do not use MCP can POST to <code>/agent/query</code>. See the <a href="/agent/openapi.json">OpenAPI specification</a> for validated inputs and responses.</p>
      <pre style={{ overflowX: "auto", padding: 20, background: "#eee8df", borderRadius: 12 }}><code>{`curl ${SITE_URL}/agent/query \\
  -H 'Content-Type: application/json' \\
  -d '{"tool":"search_perfumes","arguments":{"occasion":"office","maxPrice":1000}}'`}</code></pre>
      <h2>What the answers mean</h2><p>Results include canonical product links, regular and current single-bottle offer prices, coupon conditions, and a stock snapshot cached for up to 30 seconds. If inventory cannot be checked, status is “unknown”. Confirm the final amount and availability on the website before purchasing.</p><p>Matches are based on our catalogue, not independent wear tests or market-wide rankings. After-workout suggestions mean fresh options to consider after showering, not sweat-control claims.</p>
      <h2>Public information only</h2><p>The interface cannot access customer records, track private orders, send messages, create orders or take payments. For order help, <Link href="/contact">contact our support team</Link>.</p><p>Requests accept up to 8 KiB of JSON. A best-effort limit of 60 requests per minute per IP applies. Browser origins require explicit configuration; server-to-server clients can connect without an Origin header.</p>
      <p><Link href="/fragrances-india">Explore the fragrance collection →</Link></p>
    </div></section>
  </main>;
}
