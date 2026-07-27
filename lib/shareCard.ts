import { Product } from "@/lib/products";

// Builds a branded, Story-ratio (1080x1920) result image client-side using
// <canvas> so a swipe-game result can be shared as an actual image to
// Instagram/Facebook Stories — not just a text link. No server round-trip,
// no external image-generation service.

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export async function generateSwipeShareImage(
  product: Product,
  matchPercent: number
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGradient.addColorStop(0, "#1f1711");
  bgGradient.addColorStop(1, "#3a2a1a");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Soft glow behind product area
  const glow = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    720,
    80,
    CANVAS_WIDTH / 2,
    720,
    560
  );
  glow.addColorStop(0, "rgba(215, 185, 143, 0.35)");
  glow.addColorStop(1, "rgba(215, 185, 143, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Brand wordmark
  ctx.textAlign = "center";
  ctx.fillStyle = "#d7b98f";
  ctx.font = "900 34px Arial, sans-serif";
  ctx.fillText("H O U S E   O F   E O N", CANVAS_WIDTH / 2, 130);

  // Eyebrow
  ctx.fillStyle = "#fffaf4";
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillText("MY SCENT MATCH", CANVAS_WIDTH / 2, 240);

  // Product image, centered square with rounded corners
  try {
    const img = await loadImage(product.image);
    const boxSize = 640;
    const boxX = (CANVAS_WIDTH - boxSize) / 2;
    const boxY = 340;

    ctx.save();
    roundRectPath(ctx, boxX, boxY, boxSize, boxSize, 48);
    ctx.clip();
    ctx.fillStyle = "#fffaf4";
    ctx.fillRect(boxX, boxY, boxSize, boxSize);

    // Contain-fit the image inside the box
    const scale = Math.min(boxSize / img.width, boxSize / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const drawX = boxX + (boxSize - drawWidth) / 2;
    const drawY = boxY + (boxSize - drawHeight) / 2;
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  } catch {
    // Image failed to load (e.g. offline) — continue without it, the card
    // still communicates the match + coupon clearly with text alone.
  }

  // Match percent badge
  ctx.fillStyle = "#1f1711";
  roundRectPath(ctx, CANVAS_WIDTH / 2 - 130, 1010, 260, 64, 32);
  ctx.fillStyle = "#fffaf4";
  ctx.fill();
  ctx.fillStyle = "#1f1711";
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillText(`${matchPercent}% MATCH`, CANVAS_WIDTH / 2, 1053);

  // Product name
  ctx.fillStyle = "#fffaf4";
  ctx.font = "900 64px Arial, sans-serif";
  ctx.fillText(product.name.toUpperCase(), CANVAS_WIDTH / 2, 1170);

  // Tagline
  ctx.fillStyle = "#d7b98f";
  ctx.font = "700 32px Arial, sans-serif";
  ctx.fillText(product.tagline, CANVAS_WIDTH / 2, 1225);

  // Coupon pill
  const pillWidth = 620;
  const pillX = (CANVAS_WIDTH - pillWidth) / 2;
  const pillY = 1310;
  ctx.save();
  roundRectPath(ctx, pillX, pillY, pillWidth, 120, 60);
  ctx.strokeStyle = "#d7b98f";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#fffaf4";
  ctx.font = "900 42px Arial, sans-serif";
  ctx.fillText("EON20 · 20% OFF", CANVAS_WIDTH / 2, pillY + 76);

  // Footer CTA
  ctx.fillStyle = "#f3eadc";
  ctx.font = "700 30px Arial, sans-serif";
  ctx.fillText("Take the swipe test →", CANVAS_WIDTH / 2, 1560);

  ctx.fillStyle = "#d7b98f";
  ctx.font = "900 34px Arial, sans-serif";
  ctx.fillText("houseofeon.in/scent-swipe", CANVAS_WIDTH / 2, 1610);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareOrDownloadImage(
  blob: Blob,
  product: Product,
  captionText: string
): Promise<ShareOutcome> {
  const fileName = `house-of-eon-${product.slug}-match.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `My House of Eon match: ${product.name}`,
        text: captionText,
      });
      return "shared";
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return "cancelled";
    }
    // Fall through to download fallback below.
  }

  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(captionText).catch(() => {});
    }

    return "downloaded";
  } catch {
    return "failed";
  }
}
