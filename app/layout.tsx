import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import AnalyticsScripts from "@/components/AnalyticsScripts";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://houseofeon.in";
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "House of Eon";

export const metadata: Metadata = {
  title: `${brandName} - Premium Perfumes`,
  description:
    "Shop premium long-lasting perfumes from House of Eon. Luxury fragrance crafted for daily confidence.",
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
