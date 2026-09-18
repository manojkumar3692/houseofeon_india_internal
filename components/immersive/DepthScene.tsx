"use client";
import Image from "next/image";
import { useRef, type PointerEvent, type CSSProperties } from "react";
import { useEonMotion } from "./EonShell";
import s from "./future.module.css";

export default function DepthScene({src,alt,priority=false,className=""}: {src:string;alt:string;priority?:boolean;className?:string}) {
  const scene = useRef<HTMLDivElement>(null);
  const motion = useEonMotion();
  function move(event:PointerEvent<HTMLDivElement>) {
    if (!motion || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty("--rx", `${-(event.clientY-rect.top-rect.height/2)/rect.height*7}deg`);
    scene.current?.style.setProperty("--ry", `${(event.clientX-rect.left-rect.width/2)/rect.width*10}deg`);
  }
  function reset(){scene.current?.style.setProperty("--rx","0deg");scene.current?.style.setProperty("--ry","0deg");}
  return <div ref={scene} className={`${s.depthScene} ${className}`} onPointerMove={move} onPointerLeave={reset} style={{"--rx":"0deg","--ry":"0deg"} as CSSProperties}>
    <div className={s.depthImage}><Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 760px) 100vw, 65vw" /></div><div className={s.sceneVignette} /><div className={s.sceneGrid} aria-hidden="true" />
  </div>;
}
