import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";
import { getCatalogOffer } from "@/lib/catalogOffer";
import { SITE_URL, jsonLd } from "@/lib/seo";

const eligible = products.filter((product) => getCatalogOffer(product.price).price < 1000);
const title = "Perfumes Under ₹1,000 in India with EON20 | House of Eon";
const description = "Explore House of Eon 50ml perfumes under ₹1,000 with the public EON20 offer. Compare fresh, floral and warm scents for men, women and unisex wear.";
export const metadata: Metadata = { title, description, alternates: { canonical: `${SITE_URL}/perfumes-under-1000` }, openGraph: { title, description, url: `${SITE_URL}/perfumes-under-1000`, type: "website" } };
export default function BudgetPerfumesPage() {
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      "@context": "https://schema.org", "@type": "CollectionPage", name: title,
      url: `${SITE_URL}/perfumes-under-1000`, description,
      mainEntity: { "@type": "ItemList", itemListElement: eligible.map((product, index) => ({
        "@type": "ListItem", position: index + 1, name: product.name, url: `${SITE_URL}/products/${product.slug}`,
      })) },
    }) }} />
    <section className="seo-hero"><div className="container seo-hero-copy">
      <div className="eyebrow">Your scent. Your budget.</div>
      <h1>Perfumes under ₹1,000 in India</h1>
      <p>Explore our 50ml fragrances at the current EON20 offer price. The public code is automatically applied to eligible single-bottle carts; no membership is required. Regular and offer prices are shown below. Free shipping across India.</p>
      <p>For a fresh aquatic profile, shortlist Arctic Wave. For floral notes, consider SYRA. For warm evenings, compare Desert Tonka and the unisex Silent Gold.</p>
      <Link className="text-link" href="/fragrances-india">Compare every fragrance by notes and occasion →</Link>
    </div></section>
    <section className="section"><div className="container">
      <h2>Find your fragrance under ₹1,000</h2>
      {eligible.length ? <div className="grid products-grid">{eligible.map((product) => <div key={product.id}><ProductCard product={product} /><p>Single bottle: ₹{getCatalogOffer(product.price).price} with EON20 · Regular ₹{product.price}</p></div>)}</div> : <p>No full-size fragrances currently meet this budget. <Link href="/products">See current prices</Link>.</p>}
    </div></section>
    <section className="section"><div className="container seo-guide-content">
      <h2>What does the offer include?</h2><p>Each listed fragrance is a 50ml bottle. Concentration varies by fragrance: check its product page for Eau de Parfum or Extrait de Parfum, notes and current availability. The regular price is the amount before EON20. The under-₹1,000 price depends on this offer remaining active.</p>
      <h2>Which should I choose for daily wear?</h2><p>Arctic Wave offers an aquatic and citrus direction for a fresh preference. SYRA has a floral, soft musk and vanilla profile. RANK combines spice, amber, woods and a leather touch. Pick the notes you enjoy and begin with a light application in shared spaces.</p>
      <h2>Can I combine EON20 with the multi-bottle offer?</h2><p>No. Buying two or more full-size perfumes uses the separate bundle pricing shown in the cart. EON20 does not stack with that offer. Confirm the final total before paying.</p>
      <h2>Will every perfume last the same amount of time?</h2><p>No. Wear depends on the formula, skin, application and weather. These are choices from our own collection, not an independent ranking. If you are unsure of the scent, explore the <Link href="/trial-pack">trial pack</Link> and read the <Link href="/pages/return-refund-policy">return policy</Link> before ordering.</p>
    </div></section>
  </main>;
}
