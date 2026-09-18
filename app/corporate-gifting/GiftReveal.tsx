"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { giftScents, useGiftPersonalisation } from "./GiftPersonalisation";
import s from "./reveal.module.css";
const Scene=dynamic(()=>import("./GiftRevealScene"),{ssr:false,loading:()=> <div className={s.loading}>Preparing something extraordinary…</div>});
export default function GiftReveal(){
  const gift=useGiftPersonalisation();
  const section=useRef<HTMLElement>(null);
  const [progress,setProgress]=useState(0);
  const [manual,setManual]=useState(false);
  const [load,setLoad]=useState(false);
  useEffect(()=>{
    const element=section.current;if(!element)return;
    const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){setLoad(true);observer.disconnect();}},{rootMargin:"300px"});observer.observe(element);
    const update=()=>{if(manual||matchMedia("(max-width: 850px), (prefers-reduced-motion: reduce)").matches)return;const rect=element.getBoundingClientRect();setProgress(Math.min(1,Math.max(0,(72-rect.top)/(element.offsetHeight-innerHeight+72))));};
    window.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);update();
    return()=>{observer.disconnect();window.removeEventListener("scroll",update);window.removeEventListener("resize",update);};
  },[manual]);
  const phase=progress<.24?0:progress<.6?1:2;
  return <>
    <section ref={section} className={s.journey} aria-label="Unwrap your corporate gift">
      <div className={s.sticky}>
        <div className={s.heroCopy}><p className={s.eyebrow}>HOUSE OF EON · THE ART OF CORPORATE GIFTING</p><h1>The gift that<br />opens <em>a world.</em></h1><p className={s.intro}>Three fragrances. A message from you. An extraordinary little thank-you for the people who make a difference.</p>
          <ol className={s.chapters} aria-label="Gift reveal stages">{["A thoughtful beginning","A little discovery","A personal connection"].map((label,i)=><li key={label} className={phase===i?s.current:""}><span>0{i+1}</span>{label}</li>)}</ol>
          <a href="#personalise" className={s.primary}>Make it your company’s gift <span>↗</span></a><a href="#discovery" className={s.skip}>Skip to gifting details ↓</a>
        </div>
        <div className={s.experience}>
          <div className={s.canvasWrap}>{load&&<Scene progress={progress} company={gift.company} message={gift.giftMessage} fragrances={gift.fragrances} />}</div>
          <div className={s.experienceControls}><button type="button" onClick={()=>{setManual(true);setProgress(progress<.95?1:0);}}>{progress<.95?"Unwrap the extraordinary":"Wrap it again"}<span aria-hidden="true">↗</span></button><label>YOUR REVEAL<input type="range" min={0} max={100} value={Math.round(progress*100)} aria-label="Gift opening progress" onChange={e=>{setManual(true);setProgress(Number(e.target.value)/100);}} /></label></div>
          <p className={s.scrollHint}>{manual?"Slide to explore each moment.":"Scroll to unwrap · or use the controls above"}</p><p className={s.concept}>Gift presentation concept. Packaging and customisation are confirmed with your quote.</p>
        </div>
      </div>
    </section>
    <section className={s.personalise} id="personalise" aria-labelledby="personalise-title">
      <div className={s.personaliseInner}>
        <div><p className={s.eyebrow}>THE MOST IMPORTANT NAME HERE? YOURS.</p><h2 id="personalise-title">Their gift.<br /><em>Your thoughtful touch.</em></h2><p className={s.intro}>Picture the moment they open it. Add your company name, write a few words, and choose the three fragrances you’d like us to include in your proposal.</p>
          <div className={s.cardPreview} aria-label="Personalised gift card preview"><span>WITH APPRECIATION</span><p>{gift.giftMessage||"Your message goes here."}</p><strong>{gift.company||"YOUR COMPANY"}</strong><small>HOUSE OF EON · THE DISCOVERY COLLECTION</small></div>
        </div>
        <div className={s.personalFields}>
          <label>Your company name<input maxLength={100} value={gift.company} onChange={e=>gift.setCompany(e.target.value)} placeholder="Your company, beautifully remembered" autoComplete="organization" /></label>
          <label>Your message card<textarea maxLength={140} rows={3} value={gift.giftMessage} onChange={e=>gift.setGiftMessage(e.target.value)} /><small>{gift.giftMessage.length}/140 characters</small></label>
          <fieldset><legend>Your three discoveries</legend><div className={s.scentChoices}>{gift.fragrances.map((fragrance,index)=><label key={index}>SCENT 0{index+1}<select value={fragrance} onChange={e=>{const next=[...gift.fragrances];next[index]=e.target.value;gift.setFragrances(next);}}>{giftScents.filter(name=>name===fragrance||!gift.fragrances.includes(name)).map(name=><option key={name}>{name}</option>)}</select></label>)}</div></fieldset>
          <p className={s.notes}>Three 8ml miniatures. Fragrance availability, message cards and packaging are subject to confirmation.</p>
          <a href="#enquire" className={s.primary} onClick={()=>gift.setApplied(true)}>Request this gift <span>↗</span></a>
          <p className={s.notes}>Your company, message and scent choices will travel with your enquiry. No payment or commitment.</p>
        </div>
      </div>
    </section>
  </>;
}
