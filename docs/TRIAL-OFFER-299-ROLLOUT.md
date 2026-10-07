# Trial pack offer update — 7 October 2026

Implemented locally: trial pack INR299; new paid trial orders unlock one eligible 50ML bottle for INR749. The order number and phone must match. The existing 30-day, one-use and no-stacking conditions remain. Paid INR249 trial orders retain their original INR249 credit. No database migration is required: the server distinguishes the offers using the recorded order amount.

Updated: trial checkout amount and analytics, homepage/PDP/rescue banners, trial page, situation pages, gifting guides and Diwali campaign, confirmation emails, trial canonical/Open Graph/Twitter metadata and Product structured data, sitemap and campaign images. New image URLs avoid reusing cached old artwork; original image paths also contain the updated artwork.

## Publish and refresh

Deployment and external account changes have NOT been performed in this task.

1. Deploy this checkout to the Vercel project serving https://www.houseofeon.in. Verify live trial price INR299 and a new-trial single-bottle offer total INR749. Verify an existing paid INR249 trial still discounts INR249. Use provider test mode for payment checks.
2. In Google Search Console for the production domain, submit https://www.houseofeon.in/sitemap.xml. Inspect and test the live URLs `/trial-pack`, `/`, `/pages/diwali-perfume` and the changed guide/product pages, then request indexing. Confirm trial canonical and Product offer price 299. Google controls crawl timing; the displayed search result cannot be changed directly in Search Console.
3. If Meta means Facebook/Instagram: refresh relevant shared URLs in Sharing Debugger after deployment. Existing paid ad copy/creative and manually maintained catalog entries need updates in the connected Meta account. This repository's product feed contains full-size bottles, not the trial pack; do not change full-size public prices to the conditional trial offer price. Trial purchase tracking derives the new INR299 value from the server order.

Official Google guidance: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

## Validation

Run with Node 22 (the shell default Node 18 is too old for this Next.js version):

- `node --test tests/trial-credit.test.cjs tests/meta-conversions.test.cjs`
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`
- `node node_modules/next/dist/bin/next build`

The production build needs access to Google Fonts already used by the project.
