"use client";

import { useId, useRef, useState } from "react";
import type { ProductScentProfile } from "@/lib/products";
import styles from "@/app/products/[slug]/product-detail.module.css";

export default function RivaScentJourney({ profile }: { profile: ProductScentProfile }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const moments = [
    { id: "opening", label: "First spray", stage: "Opening", text: profile.opening },
    { id: "heart", label: "The heart", stage: "In bloom", text: profile.heart },
    { id: "dryDown", label: "Dry down", stage: "As it settles", text: profile.dryDown },
  ];
  const moment = moments[active];
  return <section className={styles.scentExperience} aria-labelledby={`${id}-title`}>
    <div className={styles.scentExperienceHead}>
      <div><span>Wear the fragrance</span><h2 id={`${id}-title`}>Watch the scent evolve.</h2></div>
      <small>Explore the stages</small>
    </div>
    <div className={styles.scentTimeline} role="tablist" aria-label="RIVA fragrance stages">
      {moments.map((item, index) => <button
        key={item.id} ref={element => { buttons.current[index] = element; }}
        type="button" role="tab" id={`${id}-${item.id}`} aria-controls={`${id}-panel`}
        aria-selected={active === index} tabIndex={active === index ? 0 : -1}
        className={active === index ? styles.scentTimelineActive : ""}
        onClick={() => setActive(index)}
        onKeyDown={event => {
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % moments.length;
          else if (event.key === "ArrowLeft") next = (index + moments.length - 1) % moments.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = moments.length - 1;
          else return;
          event.preventDefault(); setActive(next); buttons.current[next]?.focus();
        }}
      ><i>{String(index + 1).padStart(2, "0")}</i><b>{item.label}</b><small>{item.stage}</small></button>)}
    </div>
    <div className={styles.scentMoment} data-moment={moment.id} key={moment.id} role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${moment.id}`} tabIndex={0}>
      <span>{moment.label}</span><p>{moment.text}</p>
      <div aria-hidden="true"><i /><i /><i /></div>
    </div>
  </section>;
}
