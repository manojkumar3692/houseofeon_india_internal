import { Anton, Inter } from "next/font/google";

// Self-hosted via next/font (no runtime request to Google, no layout
// shift, subset to latin only) — this route needs to hit LCP < 2.5s on
// cold Meta-ad traffic, so the display face is loaded exactly once, here,
// scoped to this route only rather than added to the sitewide root layout.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--sf-font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--sf-font-body",
  display: "swap",
});

export default function ScentFixLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${anton.variable} ${inter.variable}`}>{children}</div>
  );
}
