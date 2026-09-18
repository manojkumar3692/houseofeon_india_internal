import Link from "next/link";
import { GiftBox } from "@/app/corporate-gifting/GiftingExperience";
import { TRIAL_PICK_COUNT, TRIAL_VIAL_SIZE_ML } from "@/lib/trialPack";
import styles from "./CorporateGiftingBanner.module.css";

export default function CorporateGiftingBanner() {
  return (
    <section className={styles.section} aria-labelledby="home-corporate-gifting-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>HOUSE OF EON · CORPORATE GIFTING</p>
          <h2 id="home-corporate-gifting-title">Small gifts.<br /><em>Lasting impressions.</em></h2>
          <p className={styles.description}>A thoughtful thank-you for your people. Discover perfume gift sets for employees, clients and celebrations, built around our three-scent Discovery Set.</p>
          <p className={styles.detail}>{TRIAL_PICK_COUNT} fragrances · {TRIAL_VIAL_SIZE_ML}ml each · A personal discovery</p>
          <Link className={styles.cta} href="/corporate-gifting">Explore corporate gifting <span aria-hidden="true">↗</span></Link>
        </div>
        <div className={styles.visual}><GiftBox /></div>
      </div>
    </section>
  );
}
