import { getCatalogOffer } from "@/lib/catalogOffer";
import type { Metadata } from "next";
import Link from "next/link";
import { products } from "@/lib/products";
import { discoveryGuides } from "@/lib/discoveryGuides";
import { SITE_URL, jsonLd } from "@/lib/seo";
import styles from "./page.module.css";

const title = "Compare Perfumes in India: Notes, Prices & Occasions | House of Eon";
const description = "Compare House of Eon fragrances by notes, bottle size, concentration and price. Find fresh daily wear, office scents, floral perfumes and warm evening fragrances.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: `${SITE_URL}/fragrances-india` },
  openGraph: { title, description, url: `${SITE_URL}/fragrances-india`, type: "website", images: [`${SITE_URL}/products/arctic-wave.png`] },
};
export default function FragrancesIndiaPage() {
  const schema = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: title, url: `${SITE_URL}/fragrances-india`, description,
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntity: { "@type": "ItemList", itemListElement: products.map((product, i) => ({
      "@type": "ListItem", position: i + 1, name: product.name, url: `${SITE_URL}/products/${product.slug}`,
    })) },
  };
  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
    <section className="seo-hero"><div className="container">
      <div className="eyebrow">The House of Eon fragrance guide</div>
      <h1>Find your everyday. Find your evening.</h1>
      <p>Compare our perfumes for men, women and unisex wear in India. Start with the notes you enjoy, the setting you wear fragrance in, and your budget.</p>
      <p>For a fresh daily scent, explore Arctic Wave. For warm evenings, compare Desert Tonka and Silent Gold. For a floral preference, explore SYRA. Any fragrance can be worn by anyone.</p>
      <Link className="btn" href="/trial-pack">Try a discovery pack</Link>
    </div></section>
    <section className="section"><div className="container">
      <div className="eyebrow">Compare the collection</div><h2>One table. Every fragrance.</h2>
      <p>Single-bottle prices with public code EON20, automatically applied at checkout while active. These are our own products, shown in catalogue order, not an independent ranking of Indian brands.</p>
      <div className={styles.tableWrap} role="region" aria-label="Fragrance comparison" tabIndex={0}>
        <table><caption>House of Eon perfume notes, sizes and prices</caption><thead><tr><th scope="col">Fragrance</th><th scope="col">Notes</th><th scope="col">Occasions</th><th scope="col">Bottle</th><th scope="col">Price</th></tr></thead>
          <tbody>{products.map((product) => <tr key={product.id}>
            <th scope="row"><Link href={`/products/${product.slug}`}>{product.name}</Link><small>{product.gender}</small></th>
            <td>{product.notes.join(", ")}</td><td>{product.occasion.join(", ")}</td>
            <td>{product.size}<small>{product.concentration}</small></td><td>₹{getCatalogOffer(product.price).price.toLocaleString("en-IN")}{getCatalogOffer(product.price).onSale && <small>Regular ₹{product.price.toLocaleString("en-IN")} · EON20</small>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p>Wear varies with skin, weather and application. We do not claim a fixed wear time or an independently tested “best in India” ranking.</p>
    </div></section>
    <section className="section"><div className="container"><h2>Choose for your day</h2><p><Link href="/perfumes-under-1000">Explore perfumes under ₹1,000 with EON20 →</Link></p><div className={styles.cards}>
      {discoveryGuides.map((guide) => <article key={guide.slug}><h3><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h3><p>{guide.heroSubtitle}</p><Link className="text-link" href={`/guides/${guide.slug}`}>Read the guide →</Link></article>)}
      <article><h3>Explore more of the collection</h3><p>Compare choices for daily wear and learn how concentration and application affect your experience.</p><p><Link href="/long-lasting-perfume-for-men-india">Perfumes for men</Link></p><p><Link href="/best-perfume-for-women-in-india">Perfumes for women</Link></p><Link href="/guides/extrait-de-parfum-vs-eau-de-parfum">Understand fragrance concentration</Link></article>
    </div></div></section>
    <section className="section"><div className="container"><h2>Know before you order</h2><p>We ship across India with free shipping. Typical delivery is 3–4 working days; contact support for your location. Fragrance preference and change of mind are not covered by our return policy.</p><div className={styles.links}><Link href="/about">About House of Eon</Link><Link href="/shipping">Delivery information</Link><Link href="/pages/return-refund-policy">Return policy</Link><Link href="/contact">Contact support</Link></div></div></section>
  </main>;
}
