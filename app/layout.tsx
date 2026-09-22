import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { InventoryProvider } from "@/components/InventoryContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import VisitorAttributionTracker from "@/components/VisitorAttributionTracker";
import ConciergeLoader from "@/components/ConciergeLoader";
import { SITE_URL, jsonLd } from "@/lib/seo";

const siteUrl = SITE_URL;
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "House of Eon";
const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";

export const metadata: Metadata = {
  title: `${brandName} - Premium Perfumes`,
  description:
    "Shop premium long-lasting perfumes from House of Eon. Luxury fragrance crafted for daily confidence.",
  metadataBase: new URL(siteUrl),
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

// Sitewide brand entity signal for Google (helps establish House of Eon as
// a real, recognizable business rather than an anonymous storefront).
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  description: "House of Eon is an Indian perfume brand selling fragrances for men, women and unisex wear online in India.",
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
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
        "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteUrl}/#website`,
        url: siteUrl, name: "House of Eon", publisher: { "@id": `${siteUrl}/#organization` }, inLanguage: "en-IN",
      }) }} />
      <MicrosoftClarity />
        <AnalyticsScripts />
        <VisitorAttributionTracker />

        <InventoryProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
          {/* EON Concierge — self-gates by pathname inside the component
              (hidden on /checkout and /admin); lazy-loaded via
              ConciergeLoader so its bundle isn't part of the critical
              initial page render. See components/PerfumeAssistant.tsx */}
            <ConciergeLoader />
          </CartProvider>
        </InventoryProvider>
      </body>
    </html>
  );
}
