import type { Metadata } from "next";
import Link from "next/link";
import BrandInformationPage from "@/components/BrandInformationPage";
import { SITE_URL } from "@/lib/seo";
export const metadata: Metadata = { title: "Contact House of Eon | Perfume & Order Support", description: "Contact House of Eon on WhatsApp for fragrance advice, delivery questions and order support in India.", alternates: { canonical: `${SITE_URL}/contact` } };
export default function ContactPage() {
  return <BrandInformationPage title="Contact House of Eon"><h2>WhatsApp support</h2><p>For fragrance advice, delivery questions or help with an order, message <a href="https://wa.me/919902376600">+91 99023 76600 on WhatsApp</a>. For an existing order, have your order number ready.</p><p><Link href="/track-order">Track your order</Link> or read our <Link href="/shipping">shipping information</Link>.</p><h2>Damaged or defective delivery</h2><p>Please contact support within 3 calendar days of delivery. Our team reviews replacement or exchange requests. Read the <Link href="/pages/return-refund-policy">return and replacement policy</Link> before sending a product back.</p></BrandInformationPage>;
}
