// Single source of truth for the canonical production URL, used by every
// canonical tag, og:url, sitemap.xml, robots.txt and the product feed.
//
// This is deliberately hardcoded rather than read from NEXT_PUBLIC_SITE_URL.
// That env var previously leaked its local-dev value (http://localhost:3000,
// which is literally what .env.local sets it to for local testing) into a
// production build, which got baked into the homepage's canonical tag and
// sat there undetected — actively hurting SEO. A marketing site with one
// real domain doesn't need that value to be configurable per environment;
// hardcoding it here means a misconfigured env var can never break SEO
// metadata again.
export const SITE_URL = "https://www.houseofeon.in";
