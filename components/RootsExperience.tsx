"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { formatINR } from "@/lib/money";
import { EON20_DISCOUNTED_PRICE_INR, BUNDLE_TOTAL_INR } from "@/lib/pricing";
import type { RootsChapter, RootsProduct } from "@/lib/roots";
import styles from "./RootsExperience.module.css";

const questions = [
  { prompt: "Your ideal evening?", water: "By the coast", heat: "Warm city night" },
  { prompt: "Your scent?", water: "Fresh and lucid", heat: "Deep and enveloping" },
  { prompt: "Your presence?", water: "Clean", heat: "Magnetic" },
] as const;

function ScentIndexPanel({ product }: { product: RootsProduct }) {
  return (
    <article className={`${styles.indexPanel} ${styles[product.element]}`}>
      <header>
        <span>{product.tamilName}</span>
        <div><small>YOUR WEAR GUIDE</small><h3>{product.name}</h3></div>
      </header>
      <div className={styles.guideRows}>
        {product.guide.feel.map((item, index) => (
          <div key={item.label}>
            <i>0{index + 1}</i>
            <span>{item.label}</span>
            <b>{item.value}</b>
            <p>{item.explanation}</p>
          </div>
        ))}
      </div>
      <dl className={styles.indexWords}>
        <div><dt>BEST TIME</dt><dd>{product.guide.dayNight}</dd></div>
        <div><dt>BEST WEATHER</dt><dd>{product.guide.weather}</dd></div>
        <div><dt>THE MOOD</dt><dd>{product.guide.mood}</dd></div>
      </dl>
    </article>
  );
}

export default function RootsExperience({ chapter }: { chapter: RootsChapter }) {
  const [balance, setBalance] = useState(50);
  const [answers, setAnswers] = useState<Array<"water" | "heat" | null>>([null, null, null]);
  const [duoAdded, setDuoAdded] = useState(false);
  const { addItem, lines } = useCart();
  const router = useRouter();
  const [alai, veppam] = chapter.products;

  const result = useMemo(() => {
    const water = answers.filter((answer) => answer === "water").length;
    const heat = answers.filter((answer) => answer === "heat").length;
    if (water + heat < questions.length) return null;
    return water >= heat ? alai : veppam;
  }, [answers, alai, veppam]);

  function choose(index: number, value: "water" | "heat") {
    setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer));
  }

  function addDuo(goToCheckout = false) {
    if (!lines.some((line) => line.productId === alai.id)) addItem(alai.id);
    if (!lines.some((line) => line.productId === veppam.id)) addItem(veppam.id);
    setDuoAdded(true);
    if (goToCheckout) router.push("/checkout");
  }

  return (
    <main className={styles.roots}>
      <section className={styles.opening} aria-labelledby="roots-title">
        <div className={styles.openingTop}><span>HOUSE OF EON</span><span>CHAPTER {chapter.number}</span></div>
        <div className={styles.openingCore}>
          <p>Modern India, interpreted through fragrance.</p>
          <h1 id="roots-title">ROOTS</h1>
          <div className={styles.chapterLockup}>
            <span>ROOTS / {chapter.number}</span>
            <b>{chapter.region}</b>
          </div>
        </div>
        <div className={styles.campaignLine}>
          <h2>THE SEA.<br />THE HEAT.</h2>
          <p>{chapter.line}</p>
        </div>
        <a className={styles.scrollCue} href="#duality">Enter the chapter <span>↓</span></a>
      </section>

      <section id="duality" className={styles.duality} style={{ "--split": `${balance}%` } as React.CSSProperties}>
        <div className={`${styles.world} ${styles.waterWorld}`}>
          <div className={styles.worldCopy}>
            <span>{alai.tamilName}</span><h2>{alai.name}</h2><p>WATER / MOVEMENT / HORIZON</p>
          </div>
          <Image src="/products/alai-2.png" alt="ALAI cultural edition on the Tamil Nadu coast" width={700} height={700} sizes="(max-width: 700px) 85vw, 55vw" />
        </div>
        <div className={`${styles.world} ${styles.heatWorld}`}>
          <div className={styles.worldCopy}>
            <span>{veppam.tamilName}</span><h2>{veppam.name}</h2><p>HEAT / EARTH / AMBER</p>
          </div>
          <Image src="/products/veppam-2.png" alt="VEPPAM cultural edition in the warmth of Tamil Nadu" width={700} height={700} sizes="(max-width: 700px) 85vw, 55vw" />
        </div>
        <label className={styles.balanceControl}>
          <span className="sr-only">Move between the ALAI water world and VEPPAM heat world</span>
          <input type="range" min="15" max="85" value={balance} onChange={(event) => setBalance(Number(event.target.value))} />
          <i aria-hidden="true"><span>ALAI</span><b>↔</b><span>VEPPAM</span></i>
        </label>
      </section>

      <section className={styles.editorial}>
        {chapter.products.map((product, index) => (
          <article id={product.name.toLowerCase()} className={`${styles.fragranceStory} ${styles[product.element]}`} key={product.id}>
            <div className={styles.storyNumber}>0{index + 1}</div>
            <div className={styles.storyVisual}>
              <span className={styles.tamilGlyph} lang="ta">{product.tamilName}</span>
              <Image src={`/products/${product.id}-4.png`} alt={`${product.name} cultural edition in its ${product.element === "water" ? "Tamil coast" : "Tamil Nadu heat"} world`} width={720} height={860} sizes="(max-width: 760px) 100vw, 48vw" />
            </div>
            <div className={styles.storyCopy}>
              <span>ROOTS / {chapter.number} · {product.meaning}</span>
              <h2><small lang="ta">{product.tamilName}</small>{product.name}</h2>
              <h3>{product.tagline}</h3>
              <p>{product.story}</p>
              <div className={styles.noteRhythm} aria-label="Fragrance character">
                {product.notes.map((note, noteIndex) => <span key={note}><i>0{noteIndex + 1}</i>{note}</span>)}
              </div>
              <p className={styles.disclosure}>A cultural edition of <Link href={`/products/${product.originalSlug}`}>{product.originalName}</Link>. The original House of Eon formulation, reinterpreted through ROOTS.</p>
              <div className={styles.storyActions}>
                <Link className={styles.primaryCta} href={`/products/${product.slug}`}>Discover {product.name}</Link>
                <span>{formatINR(EON20_DISCOUNTED_PRICE_INR)} · 50ml</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.scentIndex} aria-labelledby="scent-index-title">
        <div className={styles.sectionIntro}>
          <span>FEEL THE SCENT</span>
          <h2 id="scent-index-title">What will it actually feel like?</h2>
          <p>No scores and no perfume jargon. Just a clear picture of the first spray, how it settles, and how people around you experience it.</p>
        </div>
        <div className={styles.indexGrid}>{chapter.products.map((product) => <ScentIndexPanel product={product} key={product.id} />)}</div>
      </section>

      <section className={styles.chooser} aria-labelledby="chooser-title">
        <div className={styles.sectionIntro}><span>CHOOSE YOUR ELEMENT</span><h2 id="chooser-title">What pulls you?</h2><p>Three instincts. No overthinking.</p></div>
        <div className={styles.questions}>
          {questions.map((question, index) => (
            <fieldset key={question.prompt}>
              <legend><i>0{index + 1}</i>{question.prompt}</legend>
              <button type="button" aria-pressed={answers[index] === "water"} onClick={() => choose(index, "water")}>{question.water}<small>WATER</small></button>
              <button type="button" aria-pressed={answers[index] === "heat"} onClick={() => choose(index, "heat")}>{question.heat}<small>HEAT</small></button>
            </fieldset>
          ))}
        </div>
        <div className={`${styles.result} ${result ? styles[result.element] : ""}`} aria-live="polite">
          {result ? <><span>YOU ARE</span><b lang="ta">{result.tamilName}</b><h3>{result.name}</h3><p>{result.tagline}</p><Link href={`/products/${result.slug}`}>Discover {result.name} →</Link></> : <p>Choose one answer from each line to reveal your element.</p>}
        </div>
      </section>

      <section className={styles.duo}>
        <div className={styles.duoImages}>
          <Image src="/products/alai-2.png" alt="ALAI perfume at the Tamil Nadu coast" width={600} height={600} sizes="(max-width: 760px) 50vw, 35vw" />
          <Image src="/products/veppam-2.png" alt="VEPPAM perfume in Tamil Nadu's amber heat" width={600} height={600} sizes="(max-width: 760px) 50vw, 35vw" />
        </div>
        <div className={styles.duoCopy}>
          <span>ROOTS / {chapter.number}</span><p>THE TAMIL DUO</p>
          <h2>The Sea.<br />The Heat.</h2>
          <h3>ALAI + VEPPAM</h3>
          <p>Two scents. One land. One chapter held in cool movement and amber stillness.</p>
          <div className={styles.duoPrice}><b>{formatINR(BUNDLE_TOTAL_INR)}</b><span>2 × 50ml · automatic duo pricing</span></div>
          <div className={styles.duoActions}>
            <button type="button" disabled={duoAdded} onClick={() => addDuo(false)}>{duoAdded ? "The duo is in your cart" : "Add the Tamil Duo"}</button>
            <button type="button" onClick={() => addDuo(true)}>Buy the duo now</button>
          </div>
          <small>Both bottles use the existing House of Eon cart and secure checkout.</small>
        </div>
      </section>

      <section className={styles.nextChapter}>
        <span>ROOTS / 02</span><h2>Somewhere is calling.</h2><p>Where should ROOTS go next?</p>
        <div aria-label="Possible future ROOTS destinations">{["Rajasthan", "Kashmir", "Kerala", "Karnataka", "Assam"].map((place) => <span key={place}>{place}</span>)}</div>
        <small>An exploration, not a vote. The next chapter remains unannounced.</small>
      </section>
    </main>
  );
}
