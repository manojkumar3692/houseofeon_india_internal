"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { products, type Product } from "@/lib/products";
import { useCart } from "@/components/CartContext";
import { useInventory } from "@/components/InventoryContext";
import { trackAddToCart } from "@/lib/analytics";
import { trackAddToCartClarity, trackProductViewed } from "@/lib/clarity";
import { BRAND_POLICIES } from "@/lib/brandPolicy";
import { EON20_DISCOUNTED_PRICE_INR, BUNDLE_UNIT_PRICE_INR, BUNDLE_QUANTITY } from "@/lib/pricing";
import { TRIAL_PACK_PRICE_INR, isTrialEligibleProductId } from "@/lib/trialPack";
import EonShell, { Arrow } from "./EonShell";
import DepthScene from "./DepthScene";
import BottleStudy from "./BottleStudy";
import s from "./future.module.css";

function ProductExperience({ product }: {product:Product}) {
  const router=useRouter();
  const {addItem,updateQuantity,lines}=useCart();
  const {getAvailability,loaded}=useInventory();
  const stock=getAvailability(product.id,"50ml");
  const [quantity,setQuantity]=useState(1);
  const [mode,setMode]=useState<"campaign"|"product"|"3d">(product.id==="desert-tonka"?"campaign":"product");
  const [photo,setPhoto]=useState(product.image);
  const [moment,setMoment]=useState(0);
  const [notice,setNotice]=useState("");
  const [sticky,setSticky]=useState(false);
  const purchaseRef=useRef<HTMLDivElement>(null);
  const otherQuantity=lines.filter(l=>l.productId!==product.id).reduce((sum,l)=>sum+l.quantity,0);
  const bundle=quantity+otherQuantity>=BUNDLE_QUANTITY;
  const unit=bundle?BUNDLE_UNIT_PRICE_INR:EON20_DISCOUNTED_PRICE_INR;
  const amount=unit*quantity;
  const canBuy=loaded&&stock.available&&stock.maxQuantity>=quantity;
  const verifiedReviews=(product.reviews||[]).filter(r=>r.verified);
  const rating=verifiedReviews.length?verifiedReviews.reduce((sum,r)=>sum+r.rating,0)/verifiedReviews.length:0;
  const gallery=[product.image,...(product.gallery||[])].slice(0,5);
  const moments=[{label:"First impression",name:"The opening",text:product.scentProfile?.opening||product.notes.slice(0,2).join(" and ")},{label:"Getting closer",name:"The heart",text:product.scentProfile?.heart||product.description},{label:"What remains",name:"The dry down",text:product.scentProfile?.dryDown||product.notes.slice(-2).join(" and ")}];
  const recommendations=products.filter(p=>p.id!==product.id).slice(0,3);
  useEffect(()=>{trackProductViewed(product.name);},[product.name]);
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>{const entry=entries[0];setSticky(!entry.isIntersecting&&entry.boundingClientRect.top<0);},{threshold:0});
    if(purchaseRef.current)observer.observe(purchaseRef.current);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(""),4500);return()=>clearTimeout(t);},[notice]);
  function purchase(checkout:boolean){
    if(!canBuy){setNotice("This quantity is currently unavailable. Please choose another option.");return;}
    if(lines.some(l=>l.productId===product.id))updateQuantity(product.id,quantity);else addItem(product.id,quantity);
    trackAddToCart({id:product.id,name:product.name,price:unit,quantity});trackAddToCartClarity(product.name);
    if(checkout)router.push("/checkout");else setNotice(`${quantity} × ${product.name} added to your bag.`);
  }
  return <><main id="main-content"><nav className={s.breadcrumbs} aria-label="Breadcrumb"><Link href="/">The house</Link><span>/</span><Link href="/#collection">The collection</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
    <section className={s.pdpHero}><div className={s.pdpGallery}><div className={s.pdpStage}><div className={s.galleryModes} role="group" aria-label="Bottle view">{product.id==="desert-tonka"&&<button aria-pressed={mode==="campaign"} onClick={()=>setMode("campaign")}>Campaign</button>}<button aria-pressed={mode==="product"} onClick={()=>{setMode("product");setPhoto(product.image);}}>Product</button><button aria-pressed={mode==="3d"} onClick={()=>setMode("3d")}>3D view ↗</button></div>
      {mode==="3d"?<BottleStudy product={product}/>:<DepthScene key={`${mode}-${photo}`} src={mode==="campaign"?"/campaign/desert-eclipse.webp":photo} alt={mode==="campaign"?`${product.name} cinematic campaign`:`${product.name} product photograph`} priority className={mode==="product"?s.actualPhoto:""}/>}
      {mode!=="3d"&&<div className={s.galleryTag}><span>{mode==="campaign"?"THE ECLIPSE EDIT / CAMPAIGN ART":"THE ORIGINAL / PRODUCT PHOTOGRAPHY"}</span><span>{product.size.toUpperCase()}</span></div>}
      </div><div className={s.thumbs} role="group" aria-label="Product photographs">{gallery.map((image,i)=><button key={image} aria-label={`View ${product.name} photograph ${i+1}`} aria-pressed={mode==="product"&&photo===image} onClick={()=>{setPhoto(image);setMode("product");}}><Image src={image} alt="" fill sizes="70px"/></button>)}</div></div>
      <div className={s.pdpCopy}><div className={s.pdpNumber}><span className={s.kicker}>EXPRESSION N° {String(products.findIndex(p=>p.id===product.id)+1).padStart(2,"0")}</span><span>{product.concentration.toUpperCase()}</span></div><h1 className={s.pdpTitle}>{product.name}<span style={{color:"#d1b383"}}>.</span></h1><p className={s.pdpTagline}>{product.tagline}</p>
      {verifiedReviews.length>0?<a href="#customer-reviews" className={s.ratingLink}><span aria-hidden="true">★★★★★</span><b>{rating.toFixed(1)} / 5</b><small>{verifiedReviews.length} verified {verifiedReviews.length===1?"review":"reviews"} ↗</small></a>:<span className={s.ratingLink}>Meet your next signature.</span>}
      <p className={s.pdpDescription}>{product.valueLine||product.description}</p><div className={s.notesChips} aria-label="Fragrance notes">{product.notes.map(note=><span key={note}>{note}</span>)}</div>
      <div className={s.priceLine}><strong>₹{amount.toLocaleString("en-IN")}</strong><del>₹{(product.price*quantity).toLocaleString("en-IN")}</del><span>{bundle?"AUTOMATIC BUNDLE PRICE":"20% OFF · EON20"}</span></div><p className={s.priceNote}>{bundle?`₹${unit} per bottle with 2+ bottles in your bag. No code needed.`:"With EON20, applied at checkout."} Inclusive of taxes. Free shipping.</p>
      <div className={s.purchaseOptions} role="group" aria-label="Choose bottle quantity">{[1,2].map(q=><button key={q} disabled={!stock.available||stock.maxQuantity<q} aria-pressed={quantity===q} onClick={()=>setQuantity(q)}><span>{q===1?"The signature":"The signature duo"}</span><small>{q} × {product.size} · {q===1?product.gender:`₹${BUNDLE_UNIT_PRICE_INR} per bottle`}</small><b>{quantity===q?"●":"○"}</b></button>)}</div>
      <div className={s.purchaseButtons} ref={purchaseRef}><button className={s.primary} disabled={!canBuy} onClick={()=>purchase(true)}>{!loaded?"Checking availability…":!stock.available?"Currently unavailable":stock.maxQuantity<quantity?"Choose another quantity":"Make it yours"}<Arrow/></button><button className={s.secondaryButton} disabled={!canBuy} onClick={()=>purchase(false)}>Add to bag +</button></div>
      <div className={s.shippingInfo}><span>Complimentary delivery<small>Typically 3–4 working days in India</small></span><span>Secure payment<small>UPI · Cards · Razorpay checkout</small></span></div><div className={s.payments}>ELIGIBLE ORDERS: PARTIAL COD AVAILABLE AT CHECKOUT</div>
      {isTrialEligibleProductId(product.id)&&<Link href="/trial-pack" className={s.trialLink}><span>↗</span>Curious, but not quite sure?<br/><strong>Try 3 fragrances for ₹{TRIAL_PACK_PRICE_INR}.</strong></Link>}
      </div></section>
    <section className={s.scentSection}><div><span className={s.kicker}>AN EVOLUTION, NOT A SINGLE NOTE.</span><h2>Let the story<br /><em>unfold on your skin.</em></h2><p>{product.longDescription}</p></div><div><div role="tablist" aria-label="Scent evolution" className={s.scentTabs}>{moments.map((m,i)=><button key={m.name} role="tab" id={`scent-tab-${i}`} aria-controls="scent-panel" aria-selected={moment===i} tabIndex={moment===i?0:-1} onClick={()=>setMoment(i)} onKeyDown={event=>{if(["ArrowRight","ArrowLeft","Home","End"].includes(event.key)){event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?2:(i+(event.key==="ArrowRight"?1:2))%3;setMoment(next);document.getElementById(`scent-tab-${next}`)?.focus();}}}><span>0{i+1}</span>{m.label}</button>)}</div><div role="tabpanel" id="scent-panel" aria-labelledby={`scent-tab-${moment}`} className={s.scentPanel} key={moment}><span>THE SCENT JOURNEY / 0{moment+1}</span><h3>{moments[moment].name}</h3><p>{moments[moment].text}</p><small>{product.scentProfile?.performance||"Fragrance develops differently on every skin. Longevity varies with skin, weather, and application."}</small></div></div></section>
    <section className={s.pdpDetails}><div><span className={s.kicker}>CONFIDENCE COMES FROM CLARITY.</span><h2>The details.<br /><em>Nothing hidden.</em></h2></div><div><details><summary>Delivery & payment <span>+</span></summary><p>{BRAND_POLICIES.shipping}</p><p>{BRAND_POLICIES.payments}</p></details><details><summary>Returns & replacements <span>+</span></summary><p>{BRAND_POLICIES.returns}</p><p><Link href="/pages/return-refund-policy">Read the full replacement policy ↗</Link></p></details><details><summary>How to wear your fragrance <span>+</span></summary><p>Spray onto pulse points such as the wrists and neck. Let it settle without rubbing. Store your bottle in a cool place away from direct sunlight. Performance depends on your skin, climate, and application.</p></details><details><summary>Need a little guidance? <span>+</span></summary><p>Talk to a real person about your fragrance, delivery, or order.</p><p><a href="https://wa.me/919902376600" target="_blank" rel="noopener noreferrer">Speak to House of Eon on WhatsApp ↗</a></p></details></div></section>
    {verifiedReviews.length>0&&<section id="customer-reviews" className={s.reviews}><div className={s.sectionHead}><div><span className={s.kicker}>ON THEIR SKIN. IN THEIR WORDS.</span><h2>Real people.<br /><em>Lasting impressions.</em></h2></div><span className={s.verifiedLabel}>{rating.toFixed(1)} / 5 · {verifiedReviews.length} VERIFIED {verifiedReviews.length===1?"REVIEW":"REVIEWS"}</span></div><div className={s.reviewGrid}>{verifiedReviews.map(r=><article key={r.orderNumber||r.name}><div className={s.reviewRating}><span aria-label={`${r.rating} out of 5`}>★★★★★</span><small>{r.rating.toFixed(1)} / 5</small></div><blockquote>“{r.text}”</blockquote><div className={s.reviewByline}><span>{r.name}<small>{r.city}</small></span><span className={s.verifiedLabel}>✓ VERIFIED BUYER</span></div></article>)}</div></section>}
    <section className={s.related}><div className={s.sectionHead}><div><span className={s.kicker}>THERE’S MORE THAN ONE SIDE TO YOU.</span><h2>Meet your <em>other side.</em></h2></div><Link className={s.textLink} href="/#collection">The full collection <Arrow/></Link></div><div className={s.productGrid}>{recommendations.map(p=><Link key={p.id} href={`/products/${p.slug}`} className={s.productCard}><div className={s.cardImage}><Image src={p.image} alt={p.name} fill sizes="(max-width:760px) 45vw, 30vw"/><span className={s.cardFamily}>{p.gender} · {p.size}</span></div><div className={s.cardTitle}><h3>{p.name}</h3><span>↗</span></div><p>{p.notes.slice(0,3).join(" / ")}</p><div className={s.cardPrice}><b>₹{EON20_DISCOUNTED_PRICE_INR}</b><del>₹{p.price.toLocaleString("en-IN")}</del><span>WITH EON20</span></div></Link>)}</div></section>
    </main><div className={`${s.stickyBuy} ${sticky?s.stickyVisible:""}`} aria-hidden={!sticky} inert={!sticky}><div><strong>{product.name}</strong><small>{quantity} × {product.size} · ₹{amount.toLocaleString("en-IN")}</small></div><b>₹{amount.toLocaleString("en-IN")}</b><button className={s.primary} disabled={!canBuy} onClick={()=>purchase(true)}>{canBuy?"Make it yours":"Unavailable"}<Arrow/></button></div><div role="status" aria-live="polite">{notice&&<div className={s.toast}>{notice}<Link href="/cart">View bag ↗</Link></div>}</div></>;
}
export default function ImmersiveProduct({product}:{product:Product}){return <EonShell><ProductExperience key={product.id} product={product}/><div className={s.pdpFooterPad}/></EonShell>;}
