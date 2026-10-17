# RIVA launch

RIVA now belongs to the purchasable catalogue at `/products/riva-women-perfume`, using the standard product page, cart, checkout, tracking, shopping feed and sitemap.

- 50ml Eau de Parfum: ₹999 selling price / ₹1,249 MRP, matching the other bottles. Existing manual EON20 and bundle pricing apply.
- Eligible for the pick-three 8ml trial pack at the unchanged ₹299 pack price, and corporate Discovery Set selections.
- Homepage and fragrance banners now link to shopping. The catalogue and women’s collection show one standard RIVA product card each.
- Existing artwork and floral copy are retained. No customer ratings or reviews have been invented; portrait gallery artwork remains uncropped.
- The legacy waitlist API is retained for compatibility; the storefront no longer presents a signup form.

Deploy the store code to publish these changes. Apply `supabase/migration-riva-launch.sql` to synchronize the store pricing table where that table is used. If live inventory enforcement is enabled, configure RIVA’s 50ml and 8ml stock in the inventory system with actual quantities before launch; this change does not invent stock counts.
