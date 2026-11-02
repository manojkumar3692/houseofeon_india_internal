"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DiwaliFireworks.module.css";

// Perspective-projected particles: a quiet, golden firework sculpture rather
// than a full-screen flash. No WebGL context, textures or animation dependency.
export default function DiwaliFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, frame = 0, last = 0, visible = false;
    let disposed = false;

    function draw(time: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const mobile = width < 760;
      const radius = Math.min(width * (mobile ? .24 : .14), 190);
      // Staggered spheres, softly drifting along their depth axis.
      for (let burst = 0; burst < 3; burst++) {
        const age = ((time + burst * 3.1) % 10.8);
        if (age > 4.4) continue;
        const cx = width * (mobile ? [.85, .92, .75][burst] : [.66, .92, .81][burst]);
        const cy = height * (mobile ? [.15, .60, .80][burst] : [.19, .39, .68][burst]);
        if (age < .65) {
          const y = cy + (1 - age / .65) * radius;
          const trail = context.createLinearGradient(cx, y, cx, y + 40);
          trail.addColorStop(0, "rgba(255,218,147,.7)");
          trail.addColorStop(1, "rgba(226,161,65,0)");
          context.fillStyle = trail;
          context.fillRect(cx, y, 1.5, 40);
          continue;
        }
        const progress = (age - .65) / 3.75;
        const spread = 1 - Math.pow(1 - progress, 3);
        const opacity = Math.sin(Math.PI * progress) * .72;
        const rotation = time * .13 + burst;
        const count = mobile ? 42 : 72;
        for (let i = 0; i < count; i++) {
          // Fibonacci sphere distributes sparks evenly through real depth.
          const sy = 1 - 2 * (i + .5) / count;
          const angle = i * 2.399963;
          const ring = Math.sqrt(1 - sy * sy);
          const sx = Math.cos(angle) * ring;
          const sz = Math.sin(angle) * ring;
          const x = sx * Math.cos(rotation) - sz * Math.sin(rotation);
          const z = sx * Math.sin(rotation) + sz * Math.cos(rotation);
          const perspective = 480 / (480 - z * radius * spread);
          const px = cx + x * radius * spread * perspective;
          const py = cy + sy * radius * spread * perspective + progress * progress * 30;
          const alpha = opacity * (.5 + (z + 1) * .25);
          context.strokeStyle = `rgba(234,174,83,${alpha * .55})`;
          context.lineWidth = .7 * perspective;
          context.beginPath();
          context.moveTo(cx + (px - cx) * .87, cy + (py - cy) * .87);
          context.lineTo(px, py);
          context.stroke();
          context.fillStyle = `rgba(255,226,164,${alpha})`;
          context.beginPath();
          context.arc(px, py, Math.max(.65, perspective * 1.3), 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    function tick(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden || paused || media.matches) return;
      if (last) elapsedRef.current += Math.min(now - last, 50) / 1000;
      last = now;
      draw(elapsedRef.current);
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame);
      last = 0;
      if (visible && !document.hidden && !paused && !media.matches) frame = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(media.matches ? 2 : elapsedRef.current);
    });
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
    resize.observe(canvas);
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [paused, reduced]);

  return <>
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    {!reduced && <button type="button" className={styles.toggle} onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? "Resume Diwali fireworks" : "Pause Diwali fireworks"}>{paused ? "▷" : "Ⅱ"} <span>{paused ? "Play sparkle" : "Pause sparkle"}</span></button>}
  </>;
}
