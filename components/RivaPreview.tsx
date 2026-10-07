import Link from "next/link";
import Image from "next/image";
import { riva, rivaPath } from "@/lib/upcomingProducts";
import styles from "./RivaWaitlist.module.css";

export function RivaVisual() {
  return riva.image ? <Image src={riva.image} alt="RIVA perfume by House of Eon" width={700} height={700} className="product-card-image" sizes="(max-width: 700px) 94vw, 520px" /> : (
    <div className={styles.visual}>
      <span>HOUSE OF EON</span><strong>RIVA</strong>
      <span>A new chapter for her</span><small>Coming soon · Product imagery to be revealed</small>
    </div>
  );
}

export function RivaCard() {
  return <article className="card product-card">
    <Link href={rivaPath} className="product-image-wrap" aria-label="Discover RIVA — join the waitlist"><RivaVisual /></Link>
    <div className="product-card-content">
      <span className="pill">Women · Coming soon</span><h3>RIVA</h3>
      <p className="muted product-card-description">{riva.description}</p>
      <div className="product-actions product-card-actions"><Link className="btn" href={rivaPath}>Join the waitlist</Link></div>
    </div>
  </article>;
}

export default function RivaPreview() {
  return <section className="section" aria-label="Introducing RIVA">
    <div className="container"><div className={styles.banner}>
      <Link href={rivaPath} aria-label="Discover RIVA"><RivaVisual /></Link>
      <div><div className="eyebrow">New for women · Coming soon</div>
        <h2 className="section-title">Meet RIVA.</h2><p>{riva.description} Join the waitlist to hear when it launches.</p>
        <Link className="btn" href={rivaPath}>Discover RIVA & join the waitlist →</Link>
      </div>
    </div></div>
  </section>;
}
