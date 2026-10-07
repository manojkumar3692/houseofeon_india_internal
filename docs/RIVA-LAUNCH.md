# RIVA waitlist launch

RIVA lives at `/products/riva-women-perfume`. It uses the existing product page grid, typography, gallery and mobile CTA patterns, with an email waitlist in place of purchasing. Links appear on the homepage, all-perfumes catalogue, women's section and fragrance comparison page.

## Before publishing

- Supplied RIVA artwork is stored in `public/products`: `riva.png` is the main bottle image, followed by four lifestyle images and `riva-label.png` in the gallery. Paths are configured in `lib/upcomingProducts.ts`. Portrait artwork is displayed without cropping.
- Size, price and launch date remain unannounced. Notes and original scent copy use the owner-supplied J’adore Eau de Parfum reference (Dior lists ylang-ylang, rose and jasmine). This is scent-direction copy, not a verified RIVA ingredient list or wear-time test. The journey uses descriptive stages, not invented timings.
- RIVA must remain excluded from trial packs, as explicitly requested.
- Ensure the existing `RESEND_API_KEY` and verified `EMAIL_FROM` are configured in the deployment environment.
- Verify a real signup reaches `orders@houseofeon.in` after deployment. Automated tests mock Resend and never send real email.

## Waitlist operation

`POST /api/waitlist` validates the email, product, consent and honeypot, and emails the signup to `orders@houseofeon.in` with the customer address as reply-to. Success requires the provider to acknowledge the message. Retries use a stable hashed email idempotency key. The orders inbox is the signup record; there is no new database table or automatic launch campaign. The team sends launch updates and handles removal requests from that inbox.

SEO includes a canonical URL, social metadata, Product and breadcrumb structured data, sitemap entry and internal links. There are no invented offers, prices, availability claims or ratings. Product rich results are not expected until real sales details exist.

RIVA is stored separately from the purchasable catalogue, keeping it out of checkout, trial packs, coupon recommendations and shopping feeds. At launch, add the approved complete product to `lib/products.ts`, replace the waitlist route branch with the normal purchasing page, and update the waitlist placements.

Validation: `node --test tests/riva-waitlist.test.cjs tests/corporate-gifting.test.cjs`, `npx tsc --noEmit --incremental false`, and `npm run build` using Node 20.9 or later.
