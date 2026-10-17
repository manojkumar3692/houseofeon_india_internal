import Link from "next/link";
import Image from "next/image";
import { getProductById } from "@/lib/products";
import { formatINR } from "@/lib/money";
import styles from "./RivaWaitlist.module.css";

const riva = getProductById("riva")!;
const rivaPath = `/products/${riva.slug}`;

export function RivaVisual() {
  return riva.image ? <Image src={riva.image} alt="RIVA perfume by House of Eon" width={700} height={700} className="product-card-image" sizes="(max-width: 700px) 94vw, 520px" /> : (
    <div className={styles.visual}>
      <span>HOUSE OF EON</span><strong>RIVA</strong>
      <span>A new chapter for her</span><small>Radiant floral perfume</small>
    </div>
  );
}

export default function RivaPreview() {
  return <section className="section" aria-label="Introducing RIVA">
    <div className="container"><div className={styles.banner}>
      <Link href={rivaPath} aria-label="Discover RIVA"><RivaVisual /></Link>
      <div><div className="eyebrow">New for women · Now available</div>
        <h2 className="section-title">Meet RIVA.</h2><p>{riva.description} {riva.size} · {formatINR(riva.price)}. Also available in your trial pack.</p>
        <Link className="btn" href={rivaPath}>Shop RIVA →</Link>
      </div>
    </div></div>
  </section>;
}
