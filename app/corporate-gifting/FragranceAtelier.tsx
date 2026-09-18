"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import s from "./atelier.module.css";

const BottleStudio = dynamic(() => import("./BottleStudio"), { ssr: false, loading: () => <p style={{ minHeight: 550, display: "grid", placeItems: "center", color: "#d5b885" }}>Preparing the fragrance studio…</p> });

const scents = [
  { name: "Desert Tonka", image: "/gifting/desert-tonka.png", mood: "THE WARMTH OF APPRECIATION", line: "A little warmth. A lasting memory.", notes: "Tonka · Amber · Warm woods", copy: "Warm, rich and quietly magnetic. For a gesture that feels as personal as the people behind it." },
  { name: "Silent Gold", image: "/gifting/silent-gold.png", mood: "THE ART OF QUIET LUXURY", line: "Some gestures speak softly.", notes: "Golden amber · Saffron touch · Smooth woods", copy: "Golden warmth with a refined, unisex character. A thoughtful way to celebrate a valued connection." },
  { name: "Zyrox", image: "/gifting/zyrox.png", mood: "A FRESH PERSPECTIVE", line: "A cool edge. A new beginning.", notes: "Icy freshness · Citrus spark · Minty cool", copy: "Crisp, energetic and distinctly modern. A fresh expression of appreciation for the people moving things forward." },
  { name: "SYRA", image: "/gifting/syra.png", mood: "GRACE WITH PRESENCE", line: "A softer note. A strong impression.", notes: "Floral accord · Soft musk · Vanilla", copy: "Floral elegance with a confident character. Explore SYRA as a full-size fragrance; it is not currently included in the 8ml Discovery Set." },
  { name: "RANK", image: "/gifting/rank.png", mood: "RAW POWER. REFINED EDGE.", line: "For moments that deserve presence.", notes: "Spice · Leather touch · Amber", copy: "Warm spice, woods and a bold character. A distinctive fragrance for marking a milestone or celebrating a valued partnership." },
];
export default function FragranceAtelier() {
  const [selected, setSelected] = useState(0);
  const scent = scents[selected];
  const exhibit = useRef<HTMLDivElement>(null);
  const [loadStudio, setLoadStudio] = useState(false);
  useEffect(() => {
    if (!exhibit.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setLoadStudio(true); observer.disconnect(); }
    }, { rootMargin: "350px" });
    observer.observe(exhibit.current);
    return () => observer.disconnect();
  }, []);
  return <section className={s.atelier} aria-labelledby="atelier-title">
    <div className={s.inner}>
      <div className={s.copy}>
        <p className={s.kicker}>THE FRAGRANCE ATELIER / 01—05</p>
        <h2 id="atelier-title">A world inside<br /><em>every fragrance.</em></h2>
        <p className={s.intro}>Before it becomes their gift, discover the character behind the scent.</p>
        <div className={s.selector} role="group" aria-label="Choose a fragrance to explore">{scents.map((item,index)=><button key={item.name} type="button" aria-pressed={selected===index} onClick={()=>setSelected(index)}><span aria-hidden="true">0{index+1}</span>{item.name}</button>)}</div>
        <div className={s.description} aria-live="polite"><p className={s.kicker}>{scent.mood}</p><h3>{scent.line}</h3><p>{scent.copy}</p><div className={s.notes}>{scent.notes}</div></div>
        <a className={s.cta} href="#enquire">Bring this feeling to your gifts <span aria-hidden="true">↗</span></a>
      </div>
      <div className={s.exhibit} ref={exhibit}>
        {loadStudio ? <BottleStudio key={scent.name} name={scent.name} image={scent.image} /> : <div style={{ minHeight: 550 }} aria-label="Interactive fragrance studio" />}
      </div>
    </div>
  </section>;
}
