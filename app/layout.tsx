import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "House of Eon";
const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";

export const metadata: Metadata = {
  title: `${brandName} - Premium Perfumes`,
  description:
    "Shop premium long-lasting perfumes from House of Eon. Luxury fragrance crafted for daily confidence.",
  metadataBase: new URL(siteUrl),
};

// Sitewide brand entity signal for Google (helps establish House of Eon as
// a real, recognizable business rather than an anonymous storefront).
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: brandName,
  url: siteUrl,
  sameAs: [
    "https://www.instagram.com/houseofeon_india/",
    "https://www.facebook.com/profile.php?id=61569101812630",
  ],
  ...(supportWhatsapp
    ? {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: `+${supportWhatsapp}`,
          areaServed: "IN",
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <MicrosoftClarity />
        <AnalyticsScripts />

        <CartProvider>
          <Header />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
