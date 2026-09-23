# House of Eon public agent interface

## What has been built

A read-only data service for external assistants. The external assistant supplies the language understanding; this server supplies catalogue and policy facts. There is no second LLM call, token spend, agent-to-agent negotiation or autonomous purchasing. This is MCP tool interoperability, not an implementation of the separate A2A protocol.

- Integration guide: `/agent`
- MCP endpoint: `/agent/mcp`
- JSON API: POST `/agent/query`
- Generated OpenAPI 3.1 schema: `/agent/openapi.json`
- Optional informational directory: `/llms.txt`

Canonical domain: https://www.houseofeon.in . The directory does not guarantee AI discovery or search inclusion. A user, developer or approved platform integration must connect the endpoint. No ChatGPT/Claude app registration or platform listing has been performed.

## MCP compatibility

Pinned official `@modelcontextprotocol/sdk` 1.30.0, Streamable HTTP, request-local servers, stateless transport and JSON-only responses. The SDK negotiates protocol 2025-11-25 and its supported older versions; this implementation does not claim support for the newer 2026-07-28 protocol or its discovery handshake. A client must support a mutually compatible version. GET returns 405 because there is no persistent server-initiated SSE stream. No sessions, credentials or OAuth are needed for these public facts. Unsupported/private actions are not registered.

Connect a compatible client to `https://www.houseofeon.in/agent/mcp`. Send the normal MCP initialize handshake, initialized notification, tools/list and tools/call using an MCP client library. Run `node scripts/check-agent-interface.mjs https://www.houseofeon.in` after deployment to test negotiation with the official SDK client.

## Tools

| Tool | Arguments | Result |
| --- | --- | --- |
| search_perfumes | Optional query keywords, maxPrice in INR, occasion, gender | Matching products, pricing conditions, stock snapshot, matching basis |
| get_perfume | id (ID or slug) | One public product |
| compare_perfumes | ids (2–4 distinct products) | Side-by-side catalogue facts |
| get_store_policy | topic: shipping, payments, returns, cod | Published policy and canonical source |

Occasions: office, college, date, evening, wedding, summer, after_workout. These are catalogue-based filters, not independently tested recommendations. After-workout maps to summer-profile scents and explicitly means after showering. Query is an AND filter on scent/name/occasion keywords, not a general natural-language chatbot. The caller should translate “which office perfume can I buy under 1000?” into occasion=office and maxPrice=1000. An empty result is meaningful; there is no fabricated fallback.

Example JSON request:

```sh
curl https://www.houseofeon.in/agent/query \
  -H 'Content-Type: application/json' \
  -d '{"tool":"search_perfumes","arguments":{"occasion":"office","maxPrice":1000}}'
```

Results are brand-provided and include source links. They do not establish that House of Eon is better than competitors. Product output deliberately uses an explicit allowlist: no reviews with order references, customer information, API keys, internal coupon configuration, or inventory quantities.

## Pricing and stock

Effective single-bottle price uses the same EON20 coupon calculation as checkout. Returns regular price, effective price and public coupon conditions. The separate multi-bottle offer is not misrepresented as the one-bottle price. No admin/private coupon list is exposed.

Availability follows the store's inventory-enforcement setting. When enforcement is disabled, products are purchasable and reported in stock. With enforcement enabled, unavailable inventory data is unknown, not in stock. Requests share a best-effort per-process 30-second availability snapshot and a 4-second wait bound. A timeout stops waiting but does not cancel the underlying inventory read. It never reserves stock. Price/stock must be confirmed during the customer's normal checkout.

## Access and operations

- POST only; strict schemas and 8 KiB streaming body limit.
- No model calls, writes, arbitrary URL fetches, order access, payment execution or messages.
- Exact Origin validation. Default origins are the www and apex production sites. Set AGENT_ALLOWED_ORIGINS to an explicit comma-separated list for browser integrations, including local development if required. Server-to-server clients generally omit Origin.
- Best-effort per-instance 60 requests/minute/IP limiter with bounded map. This is not distributed protection. Configure CDN/WAF rate limits on `/agent/query` and `/agent/mcp` for substantial public usage. Ensure the edge overwrites forwarded IP headers; do not regard caller-supplied IP headers as authentication.
- Response bodies are no-store. No conversation history or submitted text is persisted by this implementation; hosting access logs may still record request metadata.
- The public tools are outside `/api/`, whose existing crawler exclusion remains intact. Search crawling is not the same as MCP tool invocation.
- Use hosting logs for error/429 counts, durations and endpoint traffic. Do not label incoming traffic as a verified AI identity just because of a User-Agent string.

The dependency audit also reported nine issues in packages already present in the previous lockfile, including the installed Next.js version. The added SDK was not named in the audit findings. Review and patch the existing dependency findings as a separate tested upgrade; this feature did not run a broad `npm audit fix --force`.

## Verification and deployment

Run the build with supported Node (20.9+ for the installed Next.js; tested here using bundled Node 24), `node --test tests/*.test.cjs`, and then `node scripts/check-agent-interface.mjs http://127.0.0.1:3013` against a running production build. The integration check uses the official MCP SDK client, verifies all four tools and REST parity, and checks invalid requests, body limits, origins and absence of private fields. Do not claim production connectivity until deployed and tested there.

Sources:
- https://ts.sdk.modelcontextprotocol.io/server
- https://modelcontextprotocol.io/specification/2025-11-25/basic/transports

Local verification completed: production build passed, all 29 tests passed, and the HTTP integration checker passed using the official MCP client (initialization, tool discovery, all four calls, validation errors and REST parity). Deployment has not been performed in this task.
