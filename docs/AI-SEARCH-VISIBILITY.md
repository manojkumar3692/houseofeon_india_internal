# House of Eon: search and AI visibility

## Audit: 22 September 2026

The supplied VIALI report records an 11/100 visibility score, 16% share of voice in its selected competitive set, 10 owned citations and zero query wins. Two branded competitor comparisons show 83%; eight visible generic queries show 0%. The report says 12 queries were tracked but prints only ten; obtain the raw export before treating its summary as a complete query inventory. Scores are that vendor's measurements, not Google rankings or probabilities of recommendation. The report's 10 brand citations and domain table's eight houseofeon.in citations need reconciliation in the raw export.

Existing code already had server-rendered guides, product pages, canonical URLs, robots, sitemap, social identity links and a Merchant Center feed. “No AISO content” in VIALI should not be interpreted as no website content. Its GA4 warning concerns the vendor connection; GA4 code already existed here. The live homepage was retrievable during this audit, but live crawler/CDN access and search indexing have not been established by that single request.

## Implemented

- Explicit search-crawler access with consistent private-route exclusions; response noindex headers on transaction/admin/API routes.
- Genuine About, Contact and Shipping pages; legacy About/Contact/Shipping URLs redirect to their new equivalents.
- `/fragrances-india`: server-rendered catalogue comparison, exact catalogue prices/notes/concentrations, buying links and visible limitations.
- Five guides: everyday perfume under ₹1,500, restrained office perfume, unisex choices for humidity, first-date choices, online buying checks. Existing men's/women's and unisex pages retained rather than competing duplicates.
- Visible brand authorship and linked organization identity on guide schema; product SKU, size, notes, concentration, product image previews and shipping destination/rate.
- Product-page inventory checked on the server. Unknown inventory omits availability. Feed inventory failure returns 503 rather than publishing invented stock; no enforcement means available, matching current commerce behavior. Product pages now render dynamically; monitor server latency.
- Coupon-only EON20 price removed from feed sale_price; prices use the same catalogue as the product markup. Feed retains existing product IDs for the existing Meta catalogue.
- Sitemap no longer falsely stamps every URL as newly modified on every generation. Include actual modification dates only when editorial dates are tracked.
- GA4 `ai_referral_landing` event after analytics initializes, with `ai_source` and `landing_path`. Classifies only known referrer hosts or known source tags. It cannot identify untagged direct AI visits or distinguish Google AI Overviews from ordinary Google traffic.
- Google/Bing verification tokens can be configured via environment variables.

## Query-to-page map

| Report intent | Primary page |
| --- | --- |
| Affordable everyday / under ₹1,500 | /guides/everyday-perfume-under-1500-india |
| Unisex in hot/humid weather | /guides/unisex-perfume-hot-humid-weather-india |
| First date | /guides/first-date-perfume-india |
| Office, not too strong | /guides/office-perfume-men-india-not-too-strong |
| Long-lasting men's perfume | /long-lasting-perfume-for-men-india |
| Women's daily wear | /best-perfume-for-women-in-india |
| Buy online | /guides/buy-perfume-online-india-checklist |
| Compare catalogue / fragrance India | /fragrances-india |
| Bella Vita / Beardo comparisons | Research exact comparable SKUs before publishing; do not invent competitor prices or a winner. |

## Account and deployment work still required

1. Deploy this change using the normal release process. Check live HTTP status, canonical domain redirects, mobile rendering, robots and sitemap. Request the same public pages with OAI-SearchBot, Googlebot and Bingbot user agents and inspect CDN logs; user-agent spoofing alone does not verify official crawler access. For actual crawlers validate provider IPs/reverse DNS according to provider guidance. Do not disable broad security protections.
2. Google Search Console: verify the production domain, submit `/sitemap.xml`, inspect the hub, five new guides and representative products. Review Google-selected canonicals, indexing exclusions and Core Web Vitals. Use Rich Results Test for representative product pages. No guarantee of indexing or ranking follows from submission.
3. Bing Webmaster Tools: verify and submit the same sitemap. Use indexing diagnostics. IndexNow is optional future work once an ownership key and an actual publishing trigger exist; it is not a ChatGPT submission endpoint.
4. Merchant Center: fetch `/product-feed.xml`, target India/INR, confirm domain ownership, shipping and returns, resolve diagnostics. Check whether real GTIN/MPN identifiers exist: the inherited feed currently declares identifier_exists=false; do not invent identifiers. Verify price/availability against the checkout and visible page. Registering the feed or approving products has not been done here.
5. GA4: confirm the production measurement ID and avoid duplicate GA tags in GTM. Verify `ai_referral_landing` in DebugView, register event-scoped `ai_source` and `landing_path` dimensions, and report session source/medium, landing pages, purchases and revenue. Compare referral sessions with organic sessions; this is not proof of causal lift. Connect the existing GA4 property to VIALI using the owner's account; website code cannot grant that OAuth connection.
6. VIALI: run Website Intelligence against the deployed hub and product/guide pages. Export all 12 queries and raw answers, including citations, model, search mode, region and timestamp. Rerun an unchanged India-focused query set weekly for 4–8 weeks. Record mention share, linked citations, recommendation order and conversion traffic separately; do not promise weekly improvements.

## Authority and evidence needed beyond code

- Prioritize specific queries such as “office perfume under ₹1,500” before the broad national “perfume” term. Use Search Console evidence to choose the next content update; do not generate dozens of near-identical pages or per-model copies.
- Collect real, consented customer reviews with provenance. Audit existing hardcoded review ratings against original reviews: an order proves purchase, not that a customer wrote the displayed text or rating. No new reviews or ratings were fabricated in this change.
- Conduct documented wear tests with application amount, conditions, participants, timings and limitations before publishing fixed-hour performance or superiority claims. Publish original photographs and test observations.
- Seek legitimate independent reviews, retailer listings and editorial coverage. Disclose gifted products and sponsorship; do not purchase fake reviews or post disguised recommendations on Reddit. No outreach was sent.
- Confirm legal entity, business address, product ingredient information, support hours and product identifiers before adding them. Existing privacy/terms legacy routes still redirect home; approved policy text is needed rather than guessed legal terms.
- Competitor pages should compare named products using dated, linked primary evidence for volume, price, notes, shipping and return terms. Avoid claiming House of Eon is objectively best without supporting comparative evidence.

## Why this approach

OpenAI distinguishes OAI-SearchBot (search) from GPTBot (training). Search access is an eligibility step, not guaranteed citation. Google states normal SEO remains relevant to AI features; extra AI files or special schema are not required. An on-site assistant helps visitors already on the site; it does not place the brand into external AI answers. This change therefore prioritizes crawlable facts, useful content, accurate commerce data and measurable referrals rather than hidden AI instructions or keyword stuffing.

Sources checked:
- https://developers.openai.com/api/docs/bots
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing

## Release checks

Run `npm run build`, `node --test tests/*.test.cjs`, and `node scripts/check-discovery.mjs http://localhost:3000` against a running build. After deployment run the same discovery check with `https://www.houseofeon.in`. A passing local check verifies implementation, not external indexing or visibility gains.

Validation completed locally on 22 September 2026: production build passed using bundled Node 24 (the shell default Node 18 is too old for this project's installed Next.js); all 22 tests passed; the discovery HTTP checker passed all ten target pages, schema parsing, feed, crawler endpoints, private-route headers and legacy redirects. Desktop and 390px mobile browser checks passed with no document-width overflow; the inspected guide produced no browser errors. Removed deprecated TypeScript baseUrl while retaining equivalent relative path aliases so the installed TypeScript 6 compiler can validate the project. Production deployment and external-account checks remain outstanding.
