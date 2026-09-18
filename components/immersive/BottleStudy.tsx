"use client";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Product } from "@/lib/products";
import s from "./future.module.css";

export default function BottleStudy({ product }: {product:Product}) {
  const [rotation,setRotation] = useState(-24);
  const drag = useRef<{x:number;rotation:number}|null>(null);
  function start(e:PointerEvent<HTMLDivElement>) { if(e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return; drag.current={x:e.clientX,rotation}; e.currentTarget.setPointerCapture(e.pointerId); }
  function move(e:PointerEvent<HTMLDivElement>) { if(!drag.current)return; setRotation(Math.max(-180,Math.min(180,drag.current.rotation+(e.clientX-drag.current.x)*.7))); }
  return <div className={s.study} onPointerDown={start} onPointerMove={move} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
    <div className={s.studyHalo} aria-hidden="true"/><div className={s.studyPerspective} aria-hidden="true"><div className={s.studyBottle} style={{"--rotation":`${rotation}deg`} as CSSProperties}>
      <div className={`${s.bottleFace} ${s.bottleFront}`}><div className={s.bottleLabel}><small>HOUSE OF EON</small><span>TIMELESS SCENT. LASTING IMPRESSION.</span><strong>{product.name}</strong><i>✳</i><span>{product.size} · {product.concentration}</span></div></div>
      <div className={`${s.bottleFace} ${s.bottleBack}`}><small>HOUSE OF EON<br />{product.name}<br />MADE IN INDIA</small></div><div className={`${s.bottleFace} ${s.bottleLeft}`}/><div className={`${s.bottleFace} ${s.bottleRight}`}/><div className={`${s.bottleFace} ${s.bottleTop}`}/><div className={`${s.bottleFace} ${s.bottleBottom}`}/><div className={s.bottleNeck}/><div className={s.bottleCap}>{Array.from({length:16},(_,i)=><span key={i} style={{transform:`rotateY(${i*22.5}deg) translateZ(42px)`}} />)}</div>
    </div></div><div className={s.studyControls}><span>DRAG TO ROTATE · 3D FORM STUDY</span><label><span className={s.srOnly}>Bottle rotation</span><input type="range" min="-180" max="180" value={rotation} onChange={e=>setRotation(Number(e.target.value))} /></label><button onClick={()=>setRotation(-24)}>Reset view ↺</button><small>Illustrative form. See Product view for the actual bottle.</small></div>
  </div>;
}
