import Link from "next/link";
export default function BrandInformationPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <main><section className="seo-hero"><div className="container"><div className="eyebrow">House of Eon</div><h1>{title}</h1></div></section><section className="section"><div className="container seo-guide-content" style={{ maxWidth: 900 }}>{children}<p><Link href="/fragrances-india">Compare our fragrances →</Link></p></div></section></main>;
}
