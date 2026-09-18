"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/products";
import { EON20_DISCOUNTED_PRICE_INR, BUNDLE_UNIT_PRICE_INR } from "@/lib/pricing";
import { TRIAL_PACK_PRICE_INR, TRIAL_PICK_COUNT, TRIAL_VIAL_SIZE_ML, TRIAL_CREDIT_EXPIRY_DAYS } from "@/lib/trialPack";
import EonShell, { Arrow } from "./EonShell";
import DepthScene from "./DepthScene";
import s from "./future.module.css";

const families: Record<string,string>={"desert-tonka":"Warm & woody","arctic-wave":"Fresh & aquatic",zyrox:"Fresh & aquatic",rank:"Warm & woody",syra:"Soft & floral","silent-gold":"Warm & woody"};
const moods=[{name:"After dark",id:"desert-tonka",phrase:"Warm. Magnetic. Unmistakable.",color:"#d1ad74"},{name:"Into the blue",id:"arctic-wave",phrase:"Fresh. Fearless. Wide open.",color:"#98cbd8"},{name:"Soft power",id:"syra",phrase:"Floral. Intimate. Unforgettable.",color:"#d7a7b5"}];
const reviews=products.flatMap(product=>(product.reviews||[]).filter(r=>r.verified).slice(0,1).map(review=>({...review,product:product.name,slug:product.slug}))).slice(0,3);

function HomeExperience(){
  const [filter,setFilter]=useState("All expressions");
  const [mood,setMood]=useState(0);
  const match=products.find(p=>p.id===moods[mood].id)!;
  const visible=products.filter(p=>filter==="All expressions"||families[p.id]===filter);
  return <><main id="main-content">
    <section className={s.hero} aria-labelledby="future-hero-title">
      <DepthScene src="/campaign/desert-eclipse.webp" alt="Desert Tonka suspended in amber light in a cinematic eclipse campaign" priority className={s.heroScene}/>
      <div className={s.heroOverline}><span><i className={s.liveDot}/> THE NEXT EXPRESSION OF YOU</span><span>COLLECTION 01 — SIX SIGNATURES</span></div>
      <div className={s.heroContent}><h1 id="future-hero-title"><span>BEYOND</span><span>THE <em>ordinary.</em></span></h1><p>A scent you wear.<br />A presence they remember.</p><div className={s.heroActions}><a href="#collection" className={s.primary}>Find your signature <Arrow/></a><Link href="/products/desert-tonka-perfume" className={s.textLink}>Discover Desert Tonka <Arrow/></Link></div><div className={s.heroAssurance}><span>MADE IN INDIA</span><span>SECURE CHECKOUT</span><span>FREE SHIPPING</span></div></div>
      <div className={s.heroCaption}><span>01 / DESERT TONKA</span><p>Tonka. Amber. Warm woods.</p><Link href="/products/desert-tonka-perfume" aria-label="Explore Desert Tonka">↗</Link></div>
      <div className={s.heroBottom}><span>SCROLL TO FEEL SOMETHING ↓</span><span>EXTRAIT DE PARFUM · 50 ML</span></div>
    </section>
    <div className={s.trustBand}><span><b>01</b> Formulated in India</span><span><b>02</b> Complimentary shipping</span><span><b>03</b> Secure Razorpay payments</span><span><b>04</b> Real people. Real support.</span></div>
    <section id="collection" className={s.collection}><div className={s.sectionHead}><div><span className={s.kicker}>THE COLLECTION / 001—006</span><h2>Different energies.<br /><em>Same lasting impression.</em></h2></div><p>Your mood. Your moment. Your signature.<br />Find the fragrance that feels like you.</p></div>
      <div className={s.filters} role="group" aria-label="Filter scent family">{["All expressions","Warm & woody","Fresh & aquatic","Soft & floral"].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)} className={filter===f?s.filterActive:""}>{f}{f==="All expressions"&&<sup>06</sup>}</button>)}<span>{String(visible.length).padStart(2,"0")} SIGNATURES</span></div>
      <div className={s.productGrid}>{visible.map(p=><Link href={`/products/${p.slug}`} className={s.productCard} key={p.id}><div className={s.cardImage}><Image src={p.image} alt={`${p.name} perfume bottle`} fill sizes="(max-width:600px) 46vw, (max-width:1000px) 46vw, 30vw"/><span className={s.cardIndex}>N° {String(products.indexOf(p)+1).padStart(2,"0")}</span><span className={s.cardFamily}>{families[p.id]}</span><span className={s.cardDiscover}>EXPLORE SCENT ↗</span></div><div className={s.cardMeta}><span>{p.concentration} · {p.size}</span><span>{p.gender}</span></div><div className={s.cardTitle}><h3>{p.name}</h3><span>↗</span></div><p>{p.notes.slice(0,3).join(" / ")}</p><div className={s.cardPrice}><b>₹{EON20_DISCOUNTED_PRICE_INR.toLocaleString("en-IN")}</b><del>₹{p.price.toLocaleString("en-IN")}</del><span>WITH EON20</span></div></Link>)}</div>
      <div className={s.bundleStrip}><span>BETTER TOGETHER</span><p>Two signatures. More possibilities. <strong>₹{BUNDLE_UNIT_PRICE_INR} per bottle when you choose 2+.</strong></p><Link href="/cart">Your bag <Arrow/></Link></div>
    </section>
    <section className={s.kinetic} aria-label="You are the impression"><div aria-hidden="true"><span>YOU ARE THE <em>IMPRESSION.</em> </span><span>YOU ARE THE <em>IMPRESSION.</em> </span></div></section>
    <section id="experience" className={s.moodSection}><div className={s.moodCopy}><span className={s.kicker}>A FRAGRANCE IS A FEELING</span><h2>What’s your<br /><em>afterglow?</em></h2><p>Choose an energy. Meet your signature.</p><div className={s.moodButtons} role="group" aria-label="Choose your mood">{moods.map((m,i)=><button key={m.id} aria-pressed={mood===i} onClick={()=>setMood(i)}><span>0{i+1}</span>{m.name}<b>{mood===i?"●":"↗"}</b></button>)}</div><Link href="/scent-fix" className={s.textLink}>Go deeper with the scent finder <Arrow/></Link></div><div className={s.moodVisual} key={match.id}><Image src={match.image} alt={`${match.name}, matched to ${moods[mood].name}`} fill sizes="(max-width:760px) 100vw, 50vw"/><div className={s.moodResult}><span>YOUR ENERGY, BOTTLED.</span><h3>{match.name}</h3><p>{moods[mood].phrase}</p><Link href={`/products/${match.slug}`} className={s.primary}>Meet your match <Arrow/></Link></div></div></section>
    <section className={s.craft}><div className={s.craftTitle}><span className={s.kicker}>LESS NOISE. MORE SUBSTANCE.</span><h2>It’s what’s <em>inside</em><br />that stays with you.</h2></div><div className={s.craftGrid}><article><span>01 / THE FORMULA</span><h3>Depth, by design.</h3><p>Extrait de Parfum and Eau de Parfum expressions. Layered notes that unfold as you wear them.</p></article><article><span>02 / THE ORIGIN</span><h3>Indian soul.</h3><p>Independent perfumery made in India. Six distinct scents for the many versions of you.</p></article><article><span>03 / THE EXPERIENCE</span><h3>Nothing to hide.</h3><p>Real customer reviews, clear prices, and a human on WhatsApp when you need a little guidance.</p></article></div></section>
    <section className={s.reviews}><div className={s.sectionHead}><div><span className={s.kicker}>WORDS FROM THE PEOPLE WHO WEAR US</span><h2>The feeling is <em>mutual.</em></h2></div><span className={s.verifiedLabel}>✓ REVIEWS FROM VERIFIED ORDERS</span></div><div className={s.reviewGrid}>{reviews.map(r=><article key={r.orderNumber}><div className={s.reviewRating}><span aria-label={`${r.rating} out of 5`}>★★★★★</span><small>{r.rating.toFixed(1)} / 5</small></div><blockquote>“{r.text}”</blockquote><div className={s.reviewByline}><span>{r.name}<small>{r.city} · Verified buyer</small></span><Link href={`/products/${r.slug}`}>{r.product} ↗</Link></div></article>)}</div></section>
    <section className={s.discovery}><div className={s.discoveryArt}><Image src="/discovery-set-campaign.png" alt="House of Eon three-fragrance discovery set" fill sizes="(max-width:760px) 100vw, 50vw"/></div><div className={s.discoveryCopy}><span className={s.kicker}>CHEMISTRY TAKES A LITTLE TIME.</span><h2>Don’t guess.<br /><em>Feel it first.</em></h2><p>{TRIAL_PICK_COUNT} fragrances. {TRIAL_VIAL_SIZE_ML}ml each. Your own time, your own skin.<br />Discover your signature for ₹{TRIAL_PACK_PRICE_INR}.</p><Link href="/trial-pack" className={s.primary}>Build your discovery set <Arrow/></Link><small>Redeem ₹{TRIAL_PACK_PRICE_INR} on a 50ml bottle within {TRIAL_CREDIT_EXPIRY_DAYS} days.<br />Choose from eligible scents. Full terms on the discovery page.</small></div></section>
  </main></>;
}
export default function ImmersiveHome(){return <EonShell><HomeExperience/></EonShell>;}
