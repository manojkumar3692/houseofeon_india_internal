import type { Metadata } from "next";
import Link from "next/link";
import BrandInformationPage from "@/components/BrandInformationPage";
import { SITE_URL } from "@/lib/seo";
export const metadata: Metadata = { title: "About House of Eon | Indian Perfume Brand", description: "Meet House of Eon, an Indian perfume brand with fragrances for men, women and unisex wear. Explore our catalogue, buying advice and customer support.", alternates: { canonical: `${SITE_URL}/about` } };
export default function AboutPage() {
  return <BrandInformationPage title="About House of Eon">
    <h2>Fragrance for your everyday and your occasions</h2><p>House of Eon is an Indian direct-to-consumer perfume brand. Our fragrances are made in India and sold through this website, with shipping across India.</p>
    <p>Our collection includes Desert Tonka, Arctic Wave, Zyrox, RANK, SYRA and Silent Gold. It covers fresh, warm, woody and floral preferences, with Eau de Parfum and Extrait de Parfum options. Each product page lists its own concentration, notes, bottle size and price.</p>
    <h2>How to use our buying advice</h2><p>Our guides explain the House of Eon catalogue and help you shortlist a scent for your setting. They are brand-authored recommendations, not independent rankings of competing brands. Fragrance performance varies with skin, weather and application; a concentration label alone cannot guarantee a wear time.</p>
    <p><Link href="/guides">Read our fragrance guides</Link> or <Link href="/trial-pack">explore the trial pack</Link> before choosing a full-size bottle.</p>
    <h2>Talk to us</h2><p><Link href="/contact">Contact our support team</Link> for product or order questions. You can also find House of Eon on <a href="https://www.instagram.com/houseofeon_india/">Instagram</a> and <a href="https://www.facebook.com/profile.php?id=61569101812630">Facebook</a>.</p>
  </BrandInformationPage>;
}
