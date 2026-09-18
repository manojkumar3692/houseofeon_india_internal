"use client";
import { useEffect,useRef,useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import s from "./reveal.module.css";
type Props={progress:number;company:string;message:string;fragrances:string[]};
const smooth=(a:number,b:number,p:number)=>{const t=Math.min(1,Math.max(0,(p-a)/(b-a)));return t*t*(3-2*t);};
function canvasTexture(width:number,height:number,draw:(ctx:CanvasRenderingContext2D)=>void){const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;draw(canvas.getContext("2d")!);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
function wrapText(ctx:CanvasRenderingContext2D,text:string,width:number){const lines:string[]=[];let line="";for(const char of text){const next=line+char;if(ctx.measureText(next).width>width){lines.push(line.trim());line=char;}else line=next;}if(line)lines.push(line.trim());return lines;}
export default function GiftRevealScene(props:Props){
  const host=useRef<HTMLDivElement>(null);const latest=useRef(props);latest.current=props;
  const updateRef=useRef<(()=>void)|null>(null);const [failed,setFailed]=useState(false);
  useEffect(()=>{updateRef.current?.();},[props.company,props.message,props.fragrances]);
  useEffect(()=>{
    if(!host.current)return;const node=host.current;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});}catch{setFailed(true);return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;node.appendChild(renderer.domElement);
    const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,50);camera.position.set(0,4.4,6.8);camera.lookAt(0,.95,0);
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();scene.add(new THREE.HemisphereLight(0xfff0d2,0x201b15,1.4));const light=new THREE.DirectionalLight(0xffe4b0,3);light.position.set(-3,6,5);scene.add(light);
    const gift=new THREE.Group();scene.add(gift);gift.rotation.y=-.23;
    const espresso=new THREE.MeshStandardMaterial({color:0x392a20,roughness:.6,metalness:.08});const gold=new THREE.MeshStandardMaterial({color:0xc69a4a,roughness:.25,metalness:1});const lining=new THREE.MeshStandardMaterial({color:0x171713,roughness:1});const materials:THREE.Material[]=[espresso,gold,lining];const textures:THREE.Texture[]=[];
    function box(w:number,h:number,d:number,mat:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,r=.04){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);m.position.set(x,y,z);parent.add(m);return m;}
    box(3.7,.16,2.65,espresso,gift,0,-.08,0);box(3.7,.58,.12,espresso,gift,0,.21,1.28);box(3.7,.58,.12,espresso,gift,0,.21,-1.28);box(.12,.58,2.5,espresso,gift,-1.79,.21,0);box(.12,.58,2.5,espresso,gift,1.79,.21,0);box(3.44,.08,2.37,lining,gift,0,.02,0);
    box(3.68,.022,.02,gold,gift,0,.5,1.345,.005);box(3.68,.022,.02,gold,gift,0,.5,-1.345,.005);
    const lidHinge=new THREE.Group();lidHinge.position.set(0,.52,-1.31);gift.add(lidHinge);
    box(3.76,.16,2.72,espresso,lidHinge,0,.08,1.31);
    const logo=canvasTexture(1024,640,ctx=>{ctx.fillStyle="#c9a76b";ctx.textAlign="center";ctx.font="100px Georgia";ctx.fillText("E",512,220);ctx.font="36px Georgia";ctx.fillText("H O U S E   O F   E O N",512,330);ctx.font="19px Georgia";ctx.fillText("T H E   A R T   O F   G I V I N G",512,405);});textures.push(logo);const logoMat=new THREE.MeshBasicMaterial({map:logo,transparent:true,toneMapped:false,depthWrite:false});materials.push(logoMat);const logoPlane=new THREE.Mesh(new THREE.PlaneGeometry(3.3,2.05),logoMat);logoPlane.rotation.x=-Math.PI/2;logoPlane.position.set(0,.165,1.31);lidHinge.add(logoPlane);
    const ribbonLeft=box(1.9,.022,.22,gold,lidHinge,-.94,.185,1.31,.006);const ribbonRight=box(1.9,.022,.22,gold,lidHinge,.94,.185,1.31,.006);
    const vials:THREE.Group[]=[];const labels:THREE.MeshBasicMaterial[]=[];
    const liquidColours=[0xe4b976,0xb7d6de,0xdcb267];
    for(let i=0;i<3;i++){
      const group=new THREE.Group();gift.add(group);vials.push(group);
      const glass=new THREE.MeshPhysicalMaterial({color:liquidColours[i],transparent:true,opacity:.68,roughness:.08,metalness:.05,clearcoat:1});materials.push(glass);
      const vial=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,1.03,40),glass);group.add(vial);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(.214,.214,.31,40),gold);cap.position.y=.67;group.add(cap);
      const collar=new THREE.Mesh(new THREE.TorusGeometry(.208,.012,8,40),gold);collar.rotation.x=Math.PI/2;collar.position.y=.52;group.add(collar);
      const labelMat=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});labels.push(labelMat);materials.push(labelMat);const label=new THREE.Mesh(new THREE.PlaneGeometry(.35,.62),labelMat);label.position.set(0,-.015,.208);group.add(label);
    }
    const cardMat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,toneMapped:false});materials.push(cardMat);const card=new THREE.Mesh(new THREE.PlaneGeometry(2.03,1.2),cardMat);gift.add(card);
    const update=()=>{
      const p=latest.current;
      const old=cardMat.map;if(old){old.dispose();textures.splice(textures.indexOf(old),1);}
      cardMat.map=canvasTexture(900,530,ctx=>{ctx.fillStyle="#f3e6ca";ctx.fillRect(0,0,900,530);ctx.strokeStyle="#b59b6a";ctx.strokeRect(22,22,856,486);ctx.textAlign="center";ctx.fillStyle="#94743f";ctx.font="17px Georgia";ctx.fillText("W I T H   A P P R E C I A T I O N",450,95);ctx.fillStyle="#35291e";ctx.font="32px Georgia";wrapText(ctx,p.message||"A thoughtful thank-you.",760).slice(0,4).forEach((line,i)=>ctx.fillText(line,450,185+i*42));ctx.font="bold 23px Georgia";ctx.fillText((p.company||"YOUR COMPANY").slice(0,100),450,425,760);ctx.font="12px Georgia";ctx.fillText("HOUSE OF EON · THE DISCOVERY COLLECTION",450,475);});textures.push(cardMat.map);cardMat.needsUpdate=true;
      labels.forEach((mat,i)=>{if(mat.map){mat.map.dispose();textures.splice(textures.indexOf(mat.map),1);}mat.map=canvasTexture(240,400,ctx=>{ctx.fillStyle="#f4e8ce";ctx.fillRect(0,0,240,400);ctx.textAlign="center";ctx.fillStyle="#493722";ctx.font="18px Georgia";ctx.fillText("HOUSE OF EON",120,68);ctx.font="24px Georgia";wrapText(ctx,p.fragrances[i].toUpperCase(),210).forEach((line,j)=>ctx.fillText(line,120,185+j*32));ctx.font="17px Georgia";ctx.fillText("8 ML",120,345);});textures.push(mat.map);mat.needsUpdate=true;});
    };updateRef.current=update;update();
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.7,.012,8,100),gold);ring.rotation.x=Math.PI/2;ring.position.y=-.25;scene.add(ring);
    const shadowTexture=canvasTexture(128,128,ctx=>{const g=ctx.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,"#0009");g.addColorStop(1,"#0000");ctx.fillStyle=g;ctx.fillRect(0,0,128,128);});textures.push(shadowTexture);const shadowMat=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});materials.push(shadowMat);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(6.5,5),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=-.3;scene.add(shadow);
    let visible=true;const observer=new IntersectionObserver(entries=>visible=entries[0].isIntersecting);observer.observe(node);const resize=()=>{renderer.setSize(node.clientWidth,node.clientHeight);camera.aspect=node.clientWidth/node.clientHeight;camera.fov=camera.aspect>1.5?29:38;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(node);resize();
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");let p=latest.current.progress;let last=performance.now();
    const lost=(e:Event)=>{e.preventDefault();renderer.setAnimationLoop(null);setFailed(true);};renderer.domElement.addEventListener("webglcontextlost",lost);
    renderer.setAnimationLoop(now=>{const dt=Math.min(.05,(now-last)/1000);last=now;if(!visible||document.hidden)return;p+=(latest.current.progress-p)*(reduced.matches?1:1-Math.exp(-dt*6));const unwrap=smooth(0,.24,p),open=smooth(.18,.6,p),rise=smooth(.42,.84,p),reveal=smooth(.64,1,p);
      ribbonLeft.position.x=-.94-unwrap*2;ribbonRight.position.x=.94+unwrap*2;ribbonLeft.scale.x=ribbonRight.scale.x=1-unwrap*.95;ribbonLeft.visible=ribbonRight.visible=unwrap<.99;
      lidHinge.rotation.x=-open*1.95;gift.rotation.y=-.23+open*.12;gift.position.y=reduced.matches?0:Math.sin(now*.0006)*.025;
      vials.forEach((v,i)=>{v.position.set((i-1)*(.88+rise*.24),.28+rise*(1.35+(i===1?.3:0)),.05);v.rotation.x=Math.PI/2*(1-rise);v.rotation.z=(i-1)*rise*-.12;});card.visible=reveal>.01;card.position.set(0,.6+reveal*.24,1.25+reveal*.45);card.rotation.x=-.5+reveal*.3;card.scale.setScalar(Math.max(.001,reveal));renderer.render(scene,camera);
    });
    return()=>{updateRef.current=null;renderer.setAnimationLoop(null);observer.disconnect();ro.disconnect();renderer.domElement.removeEventListener("webglcontextlost",lost);scene.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.geometry.dispose();});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[]);
  return <div className={s.sceneHost} ref={host} role="img" aria-label="3D gift box opening to reveal three 8ml miniatures and a personalised message card">{failed&&<div className={s.loading}><span>Three discoveries.<br />One thoughtful thank-you.</span><small>Your personalised gift card preview is below.</small></div>}</div>;
}
