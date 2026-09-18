"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import s from "./studio.module.css";

type Props = { name: string; image: string };
// Normalised label bounds in each supplied photograph, used as the front material.
const appearances: Record<string, { crop: [number, number, number, number]; glass: number; liquid: number; light: number; glow: string }> = {
  "Desert Tonka": { crop: [.321,.367,.341,.385], glass: 0xffedc9, liquid: 0xe8bd73, light: 0xffe7ba, glow: "#b78a4540" },
  "Silent Gold": { crop: [.353,.369,.31,.369], glass: 0xffedc9, liquid: 0xdcae54, light: 0xffe7ba, glow: "#b78a4540" },
  "Zyrox": { crop: [.36,.4,.292,.331], glass: 0xe2f2ff, liquid: 0xb6d5ec, light: 0xcce8ff, glow: "#579cbd45" },
  "SYRA": { crop: [.318,.38,.372,.403], glass: 0xffecdc, liquid: 0xf0cfad, light: 0xffe1cb, glow: "#d2a38c40" },
  "RANK": { crop: [.333,.377,.333,.391], glass: 0xece5d5, liquid: 0xb7a486, light: 0xeadac0, glow: "#8e755640" },
};
type Controls = { open: (value: boolean) => void; spray: () => void; rotate: (amount: number) => void; reset: () => void; play: () => void };

export default function BottleStudio({ name, image }: Props) {
  const appearance = appearances[name] || appearances["Desert Tonka"];
  const mount = useRef<HTMLDivElement>(null);
  const controls = useRef<Controls | null>(null);
  const [opened, setOpened] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [spraying, setSpraying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    setReady(false); setFailed(false); setOpened(false); setPlaying(false); setSpraying(false);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .95;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 60);
    camera.position.set(0, 2.35, 10.8); camera.lookAt(0, 1.9, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffefd5, 0x382417, .8));
    const key = new THREE.DirectionalLight(appearance.light, 2); key.position.set(-3, 5, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 3); rim.position.set(3, 4, -2); scene.add(rim);
    const front = new THREE.DirectionalLight(0xffffff, .8); front.position.set(0, 2, 5); scene.add(front);
    const bottle = new THREE.Group(); scene.add(bottle);
    bottle.rotation.y = -.18;
    const gold = new THREE.MeshStandardMaterial({ color: 0xd4a74f, metalness: 1, roughness: .22 });
    const darkGold = new THREE.MeshStandardMaterial({ color: 0x967132, metalness: .95, roughness: .3 });
    const glass = new THREE.MeshPhysicalMaterial({ color: appearance.glass, metalness: 0, roughness: .06, transmission: .82, thickness: .35, ior: 1.45, transparent: true, opacity: .7, clearcoat: 1, envMapIntensity: 1.5 });
    const liquid = new THREE.MeshPhysicalMaterial({ color: appearance.liquid, roughness: .13, metalness: .05, transparent: true, opacity: .58, transmission: .3, thickness: 1 });
    function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, y: number) { const item = new THREE.Mesh(geometry, material); item.position.y = y; parent.add(item); return item; }
    mesh(new RoundedBoxGeometry(2.12, 2.62, .86, 5, .14), glass, bottle, 1.7);
    mesh(new RoundedBoxGeometry(1.86, 2.18, .62, 4, .12), liquid, bottle, 1.62);
    mesh(new RoundedBoxGeometry(2.0, .16, .8, 3, .06), glass, bottle, .43);
    mesh(new THREE.CylinderGeometry(.3, .36, .23, 48), glass, bottle, 3.04);
    mesh(new THREE.CylinderGeometry(.29, .29, .3, 48), gold, bottle, 3.21);
    const atomizer = new THREE.Group(); atomizer.position.y = 3.42; bottle.add(atomizer);
    mesh(new THREE.CylinderGeometry(.2, .2, .2, 40), gold, atomizer, 0);
    const nozzle = mesh(new THREE.CylinderGeometry(.055, .055, .025, 24), new THREE.MeshStandardMaterial({ color: 0x211a12, metalness: .6, roughness: .3 }), atomizer, .02);
    nozzle.rotation.x = Math.PI/2; nozzle.position.z = .203;
    const tube = mesh(new THREE.CylinderGeometry(.022, .022, 2.1, 12), new THREE.MeshStandardMaterial({color:0xf3dfb5,transparent:true,opacity:.45}), bottle, 1.91); tube.position.z = -.18;
    const cap = new THREE.Group(); cap.position.y = 3.48; bottle.add(cap);
    mesh(new THREE.CylinderGeometry(.49, .49, .68, 64), gold, cap, .03);
    mesh(new THREE.CylinderGeometry(.5, .5, .055, 64), gold, cap, .395);
    mesh(new THREE.CylinderGeometry(.5, .5, .045, 64), darkGold, cap, -.335);
    // A diamond bump texture wraps the cylindrical cap without distorting its silhouette.
    const knurlCanvas=document.createElement("canvas");knurlCanvas.width=128;knurlCanvas.height=128;
    const kctx=knurlCanvas.getContext("2d")!;kctx.fillStyle="#888";kctx.fillRect(0,0,128,128);kctx.strokeStyle="#eee";kctx.lineWidth=3;
    for(let i=-128;i<256;i+=16){kctx.beginPath();kctx.moveTo(i,0);kctx.lineTo(i+128,128);kctx.stroke();kctx.beginPath();kctx.moveTo(i,0);kctx.lineTo(i-128,128);kctx.stroke();}
    const knurlTexture=new THREE.CanvasTexture(knurlCanvas);knurlTexture.wrapS=knurlTexture.wrapT=THREE.RepeatWrapping;knurlTexture.repeat.set(4,1);
    const knurledGold=gold.clone();knurledGold.bumpMap=knurlTexture;knurledGold.bumpScale=.018;knurledGold.roughness=.3;
    (cap.children[0] as THREE.Mesh).material=knurledGold;
    const labelCanvas = document.createElement("canvas"); labelCanvas.width=768;labelCanvas.height=880;
    const ctx = labelCanvas.getContext("2d")!;
    ctx.fillStyle="#f2e2be";ctx.fillRect(0,0,768,880);
    ctx.strokeStyle="#b58a40";ctx.lineWidth=5;ctx.strokeRect(18,18,732,844);
    ctx.fillStyle="#352317";ctx.textAlign="center";ctx.font="28px Georgia";ctx.fillText("HOUSE OF EON",384,150);ctx.font="52px Georgia";ctx.fillText(name,384,410);ctx.font="20px Georgia";ctx.fillText("50ML · EXTRAIT DE PARFUM",384,790);
    const texture = new THREE.CanvasTexture(labelCanvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    const label = mesh(new THREE.PlaneGeometry(1.77,2.01),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),bottle,1.73);label.position.z=.437;
    let disposed=false;
    const reference = new window.Image(); reference.onload=()=>{if(disposed)return;const w=reference.naturalWidth,h=reference.naturalHeight; const crop=appearance.crop;ctx.drawImage(reference,w*crop[0],h*crop[1],w*crop[2],h*crop[3],0,0,768,880);texture.needsUpdate=true;};reference.src=image;
    const backCanvas=document.createElement("canvas");backCanvas.width=512;backCanvas.height=512;const bctx=backCanvas.getContext("2d")!;bctx.fillStyle="#e9d9b7";bctx.fillRect(0,0,512,512);bctx.fillStyle="#5b4527";bctx.textAlign="center";bctx.font="25px Georgia";bctx.fillText("HOUSE OF EON",256,175);bctx.font="18px Georgia";bctx.fillText("TIMELESS SCENT.",256,245);bctx.fillText("LASTING IMPRESSION.",256,280);bctx.font="14px Georgia";bctx.fillText("50 ML",256,360);
    const backTexture=new THREE.CanvasTexture(backCanvas);backTexture.colorSpace=THREE.SRGBColorSpace;
    const back=mesh(new THREE.PlaneGeometry(1.13,1.13),new THREE.MeshStandardMaterial({map:backTexture,roughness:.9}),bottle,1.6);back.position.z=-.438;back.rotation.y=Math.PI;
    mesh(new THREE.CylinderGeometry(1.8,2,.28,96),new THREE.MeshStandardMaterial({color:0x17130f,metalness:.1,roughness:.8,envMapIntensity:.2}),scene,.18);
    const ring=mesh(new THREE.TorusGeometry(1.82,.016,8,100),gold,scene,.3);ring.rotation.x=Math.PI/2;
    const particleCount=140;const positions=new Float32Array(particleCount*3);const seeds=Array.from({length:particleCount},()=>({x:(Math.random()-.5),y:(Math.random()-.5),speed:.8+Math.random()*1.1}));
    const particlesGeometry=new THREE.BufferGeometry();particlesGeometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
    const dotCanvas=document.createElement("canvas");dotCanvas.width=64;dotCanvas.height=64;const dctx=dotCanvas.getContext("2d")!;const gradient=dctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,"rgba(255,247,226,.65)");gradient.addColorStop(.35,"rgba(255,241,201,.25)");gradient.addColorStop(1,"rgba(255,241,201,0)");dctx.fillStyle=gradient;dctx.fillRect(0,0,64,64);const mistTexture=new THREE.CanvasTexture(dotCanvas);
    const mistMaterial=new THREE.PointsMaterial({map:mistTexture,size:.15,transparent:true,opacity:0,depthWrite:false,color:0xfff1d0,blending:THREE.AdditiveBlending});
    const mist=new THREE.Points(particlesGeometry,mistMaterial);mist.frustumCulled=false;bottle.add(mist);
    let targetRotation=-.18, targetCap=0, capProgress=0, sprayAge=99, demoAge=-1, dragging=false, lastX=0, lastY=0, tilt=0, visible=true;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const spray=()=>{if(targetCap===0)return;sprayAge=0;setSpraying(true);};
    controls.current={open(value){demoAge=-1;setPlaying(false);targetCap=value?1:0;},spray,rotate(amount){demoAge=-1;setPlaying(false);targetRotation+=amount;},reset(){demoAge=-1;targetRotation=-.18;tilt=0;targetCap=0;setOpened(false);setPlaying(false);},play(){demoAge=0;targetRotation=-.18;targetCap=0;setOpened(false);setPlaying(true);}};
    const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:"100px"});observer.observe(host);
    const down=(event:PointerEvent)=>{if(event.pointerType==="mouse"&&event.button!==0)return;dragging=true;lastX=event.clientX;lastY=event.clientY;renderer.domElement.setPointerCapture(event.pointerId);demoAge=-1;setPlaying(false);};
    const move=(event:PointerEvent)=>{if(!dragging)return;targetRotation+=(event.clientX-lastX)*.012;tilt=Math.max(-.17,Math.min(.17,tilt+(event.clientY-lastY)*.003));lastX=event.clientX;lastY=event.clientY;};
    const up=()=>{dragging=false;};
    const lost=(event:Event)=>{event.preventDefault();renderer.setAnimationLoop(null);setFailed(true);};
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("pointercancel",up);renderer.domElement.addEventListener("webglcontextlost",lost);
    let previous=performance.now();
    renderer.setAnimationLoop((now)=>{
      const dt=Math.min((now-previous)/1000,.05);previous=now;if(!visible||document.hidden)return;
      if(demoAge>=0){const old=demoAge;demoAge+=dt;if(demoAge<2.7)targetRotation=-.18+Math.min(demoAge/2.7,1)*Math.PI*2;if(old<2.7&&demoAge>=2.7){targetCap=1;setOpened(true);}if(old<4.2&&demoAge>=4.2)spray();if(demoAge>6){demoAge=-1;setPlaying(false);}}
      const ease=reduced.matches?1:1-Math.exp(-dt*8);
      bottle.rotation.y+=(targetRotation-bottle.rotation.y)*ease;bottle.rotation.x+=(tilt-bottle.rotation.x)*ease;
      capProgress+=(targetCap-capProgress)*ease;cap.position.y=3.48+capProgress*1.04;cap.position.x=capProgress*.62;cap.rotation.z=-capProgress*.25;
      if(sprayAge<1.8){sprayAge+=dt;const t=sprayAge;for(let i=0;i<particleCount;i++){const p=seeds[i];positions[i*3]=p.x*t*.9;positions[i*3+1]=3.45+p.y*t*.55+t*.1;positions[i*3+2]=.25+t*p.speed*1.5;}particlesGeometry.attributes.position.needsUpdate=true;mistMaterial.opacity=reduced.matches?.15:Math.max(0,.7*(1-t/1.8));atomizer.position.y=3.42-Math.max(0,1-t*5)*.065;if(sprayAge>=1.8){setSpraying(false);mistMaterial.opacity=0;}} 
      renderer.render(scene,camera);
    });
    setReady(true);
    return ()=>{disposed=true;controls.current=null;reference.onload=null;resizeObserver.disconnect();observer.disconnect();renderer.setAnimationLoop(null);renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointermove",move);renderer.domElement.removeEventListener("pointerup",up);renderer.domElement.removeEventListener("pointercancel",up);renderer.domElement.removeEventListener("webglcontextlost",lost);const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Points){geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:[object.material];list.forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();backTexture.dispose();mistTexture.dispose();knurlTexture.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[name,image,appearance]);
  return <div className={s.studio}>
    <div className={s.stage} style={{ "--studio-glow": appearance.glow } as CSSProperties}>
      <div className={s.heading}><span>THE SCENT RITUAL</span><span>INTERACTIVE 3D</span></div>
      <div ref={mount} className={s.canvas} role="img" aria-label={`Interactive 3D ${name} bottle. Drag horizontally to rotate, or use the controls below.`} />
      {!ready&&!failed&&<div className={s.loading}>Preparing your fragrance…</div>}
      {failed&&<div className={s.fallback}><img src={image} alt={`${name} bottle`} /><p>Your browser could not start the 3D experience. You can still explore the fragrance and request a gift proposal.</p></div>}
      <div className={s.stageFoot}><span>{name}</span><small>DRAG TO ROTATE · SCROLL TO CONTINUE</small></div>
    </div>
    <div className={s.steps} aria-label="Bottle experience controls">
      <button disabled={!ready||failed} onClick={()=>{setOpened(!opened);controls.current?.open(!opened);}} aria-pressed={opened}><span>01</span>{opened?"Replace cap":"Lift the cap"}</button>
      <button disabled={!ready||failed||!opened||spraying||playing} onClick={()=>controls.current?.spray()}><span>02</span>{spraying?"A moment of mist…":"Press to spray"}</button>
      <button disabled={!ready||failed||playing} onClick={()=>controls.current?.play()}><span>↻</span>{playing?"Playing the ritual…":"Play the ritual"}</button>
    </div>
    <div className={s.rotation} role="group" aria-label="Rotate bottle"><button aria-label="Rotate bottle left" disabled={!ready||failed} onClick={()=>controls.current?.rotate(-Math.PI/4)}>←</button><span>EXPLORE EVERY ANGLE</span><button aria-label="Rotate bottle right" disabled={!ready||failed} onClick={()=>controls.current?.rotate(Math.PI/4)}>→</button><button className={s.reset} disabled={!ready||failed} onClick={()=>controls.current?.reset()}>Reset</button></div>
    <p className={s.status} role="status">{playing?"Rotate. Uncap. A moment of fragrance.":spraying?"A fine mist, a lasting impression.":opened?"The cap is lifted. Press to release the mist.":"Lift the gold cap to reveal the atomiser."}</p>
    <p className={s.caption}>{name === "SYRA" ? "3D interpretation of SYRA’s 50ml bottle. SYRA is not currently available in the 8ml Discovery Set." : "3D interpretation of our 50ml bottle. Discovery gift sets contain three 8ml miniatures."}</p>
  </div>;
}
