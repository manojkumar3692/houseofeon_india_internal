import type { Metadata } from "next";
import Link from "next/link";
import BrandInformationPage from "@/components/BrandInformationPage";
import { BRAND_POLICIES } from "@/lib/brandPolicy";
import { SITE_URL } from "@/lib/seo";
export const metadata: Metadata = { title: "Shipping & Delivery in India | House of Eon", description: "House of Eon shipping information: free delivery across India, typical delivery estimates, payment options and order support.", alternates: { canonical: `${SITE_URL}/shipping` } };
export default function ShippingPage() {
  return <BrandInformationPage title="Shipping & delivery"><h2>Delivery across India</h2><p>{BRAND_POLICIES.shipping}</p><p>Tracking is shared after dispatch. Use <Link href="/track-order">Track order</Link> for your order or <Link href="/contact">contact support</Link> for delivery questions.</p><h2>Payment options</h2><p>{BRAND_POLICIES.payments}</p><p>{BRAND_POLICIES.cod}</p><h2>Problems with a delivery</h2><p>{BRAND_POLICIES.returns}</p><p><Link href="/pages/return-refund-policy">Read the return and replacement policy</Link>.</p></BrandInformationPage>;
}
