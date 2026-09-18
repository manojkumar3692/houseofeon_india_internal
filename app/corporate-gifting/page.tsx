import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";
import { TRIAL_PICK_COUNT, TRIAL_VIAL_SIZE_ML, getTrialEligibleProducts } from "@/lib/trialPack";
import { EnquiryForm } from "./GiftingExperience";
import s from "./gifting.module.css";
import FragranceAtelier from "./FragranceAtelier";
import GiftReveal from "./GiftReveal";
import { GiftPersonalisationProvider } from "./GiftPersonalisation";

export const metadata: Metadata = {
  title: "Corporate Perfume Gift Sets & Bulk Gifting India | House of Eon",
  description: "Make employee, client and festive gifting personal with House of Eon Discovery Sets. Three 8ml fragrances, thoughtful presentation and a tailored bulk gifting quotation.",
  alternates: { canonical: `${SITE_URL}/corporate-gifting` },
  openGraph: { title: "A little box. A lasting impression. | House of Eon Corporate Gifting", description: "Discover a more personal way to say thank you. Perfume Discovery Sets for teams, clients and celebrations.", url: `${SITE_URL}/corporate-gifting`, type: "website" },
};
const faqs = [
  ["What is inside the Discovery gift set?", "Each Discovery Set contains three 8ml fragrances. We’ll help you discuss a selection from our eligible scents, with availability and final presentation confirmed in your quotation."],
  ["Can we add our company branding?", "Tell us whether you would like a company message card, a branded sleeve or other packaging. We’ll confirm the available options, any minimum quantities, costs and production time before you commit."],
  ["What is the minimum order and price?", "Share your expected quantity and budget, even if you are still planning. Bulk pricing and any minimum quantities depend on the gift format and personalisation. Your written quotation will set out the details."],
  ["Can we try the fragrances before ordering?", "You can explore the retail Discovery Set, or include a sample request in your enquiry. The team will confirm sample arrangements and any costs before proceeding."],
  ["Can you deliver to different locations in India?", "Include the cities or PIN codes and your preferred date in the form. We’ll check delivery feasibility, shipping charges and whether your order can be split across addresses."],
  ["Is this suitable for Diwali and employee welcome kits?", "Yes. A compact perfume Discovery Set is a thoughtful option for festive gifts, employee appreciation, welcome kits, client thank-yous and events. Share the occasion so we can discuss an appropriate presentation."],
];
export default function CorporateGiftingPage() {
  return <GiftPersonalisationProvider><main className={s.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Corporate gifting", item: `${SITE_URL}/corporate-gifting` }] }) }} />
    <GiftReveal />
    <section id="discovery" className={`${s.section} ${s.discovery}`}>
      <div className={s.editorial}><p className={s.eyebrow}>SMALL FORMAT. BIG FEELING.</p><h2>A gift they get<br />to <em>make their own.</em></h2><p>Fragrance is personal. That’s what makes discovering it such a lovely gift. Our Discovery Set brings three different scents into their everyday life, giving them room to find a favourite.</p><Link className={s.textLink} href="/trial-pack">Meet the original Discovery Set ↗</Link></div>
      <div className={s.features}><article><span>01 / DISCOVER</span><h3>Three scents. More possibilities.</h3><p>Fresh for the workday, warm for the evening, or something a little unexpected. Curate from our eligible fragrance collection.</p></article><article><span>02 / MAKE IT PERSONAL</span><h3>Your appreciation, beautifully expressed.</h3><p>Discuss a company message or branded presentation that makes the gesture feel like it came from you.</p></article><article><span>03 / KEEP IT CLOSE</span><h3>Made for life beyond the unboxing.</h3><p>Three compact 8ml fragrances to slip into a work bag, take on a weekend away, and enjoy day after day.</p></article></div>
    </section>
    <FragranceAtelier />
    <section className={s.scents}><div className={s.sectionHeading}><div><p className={s.eyebrow}>A COLLECTION WITH CHARACTER</p><h2>Different notes.<br /><em>Shared appreciation.</em></h2></div><p>Discover the fragrances available for your gift set. Final selections depend on stock and your brief.</p></div><div className={s.scentGrid}>{getTrialEligibleProducts().map(p => <Link href={`/products/${p.slug}`} key={p.id} className={s.scentCard}><div className={s.productImage}><Image src={p.image} alt={`${p.name} full-size bottle, shown as a fragrance reference`} width={300} height={360} /></div><h3>{p.name}</h3><p>{p.notes.slice(0, 3).join(" · ")}</p><span>Discover the scent ↗</span></Link>)}</div><p className={s.imageNote}>Full-size bottles shown for fragrance reference. Discovery gifts contain 8ml miniatures.</p></section>
    <section className={s.darkSection}><div className={s.darkInner}><p className={s.eyebrow}>BEHIND EVERY GIFT, A REASON.</p><h2>“Thank you.” “Welcome.”<br /><em>“You made a difference.”</em></h2><div className={s.useCases}>{[["01", "For your people", "Celebrate milestones, recognise a great year, or make a new teammate feel welcome."], ["02", "For your partnerships", "A personal gesture for the clients and collaborators who help your business grow."], ["03", "For your celebrations", "Bring a little discovery to Diwali, festive gatherings and memorable company events."]].map(([n, title, copy]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
    <section className={`${s.section} ${s.process}`}><div><p className={s.eyebrow}>FROM AN IDEA TO THEIR HANDS</p><h2>Thoughtful gifting.<br /><em>A simple beginning.</em></h2></div><ol>{[["Tell us your idea", "Share your quantity, occasion, budget and preferred delivery date."], ["Find the right fit", "We’ll discuss fragrances, presentation and a quotation tailored to your brief."], ["Approve the details", "Confirm the selection, costs and delivery plan before your order goes ahead."]].map(([title, copy]) => <li key={title}><h3>{title}</h3><p>{copy}</p></li>)}</ol></section>
    <section className={s.enquirySection} id="enquire"><div className={s.enquiryInner}><div className={s.enquiryCopy}><p className={s.eyebrow}>LET’S MAKE IT MEMORABLE</p><h2>Good gifting<br />starts with<br /><em>a conversation.</em></h2><p>Planning for a small team or a bigger celebration? Tell us what you have in mind. We’ll help you explore a Discovery gift that feels right.</p><div className={s.contactCard}><span>PREFER TO WRITE TO US?</span><a href="mailto:orders@houseofeon.in">orders@houseofeon.in ↗</a></div><div className={s.quoteNote}><span>✧</span><p>Every enquiry is considered individually. Your quotation will confirm pricing, packaging, quantities and delivery arrangements.</p></div></div><EnquiryForm /></div></section>
    <section className={`${s.section} ${s.faq}`}><div><p className={s.eyebrow}>THE FINER DETAILS</p><h2>A few things<br /><em>you might ask.</em></h2></div><div>{faqs.map(([q,a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
    <div className={s.closing}><span>HOUSE OF EON</span><p>Good taste. Thoughtfully given.</p><a href="#enquire">Create your gifting brief ↗</a></div>
  </main></GiftPersonalisationProvider>;
}
