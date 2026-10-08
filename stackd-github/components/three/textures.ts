import * as THREE from "three";
import { inkOn } from "@/lib/assets";
import { display, mono } from "@/lib/fonts";

// Canvas-drawn textures: no font or image downloads at runtime,
// and everything drawn here is part of the WebGL capture used for export.

const cache = new Map<string, THREE.Texture>();

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  // labels change with every slider tick; keep the cache from growing forever
  if (cache.size > 400) {
    const first = cache.keys().next().value as string;
    cache.get(first)?.dispose();
    cache.delete(first);
  }
  return tex;
}

export function gradientTexture(top: string, bottom: string): THREE.Texture {
  return make(`g:${top}:${bottom}`, 8, 128, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 128);
  });
}

export function tickerTexture(ticker: string, color: string, fontsReady: boolean): THREE.Texture {
  return make(`t:${ticker}:${color}:${fontsReady}`, 512, 256, (ctx) => {
    const dark = inkOn(color) === "#050711";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 150;
    do {
      ctx.font = `800 ${size}px ${display.style.fontFamily}, sans-serif`;
      size -= 6;
    } while (ctx.measureText(ticker).width > 460 && size > 40);
    ctx.fillStyle = dark ? "rgba(5,7,17,0.82)" : "rgba(246,248,255,0.94)";
    ctx.fillText(ticker, 256, 134);
  });
}

export function labelTexture(ticker: string, pct: string, color: string, fontsReady: boolean): THREE.Texture {
  return make(`l:${ticker}:${pct}:${color}:${fontsReady}`, 448, 128, (ctx) => {
    ctx.fillStyle = "rgba(8,12,26,0.92)";
    ctx.strokeStyle = "rgba(149,163,195,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 14, 440, 100, 50);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(52, 64, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#F6F8FF";
    let size = 46;
    do {
      ctx.font = `700 ${size}px ${display.style.fontFamily}, sans-serif`;
      size -= 3;
    } while (ctx.measureText(ticker).width > 190 && size > 22);
    ctx.fillText(ticker, 82, 67);
    ctx.textAlign = "right";
    ctx.fillStyle = "#68E9FF";
    ctx.font = `600 40px ${mono.style.fontFamily}, monospace`;
    ctx.fillText(pct, 418, 67);
  });
}

let glow: THREE.Texture | null = null;
export function glowTexture(): THREE.Texture {
  if (glow) return glow;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(66,133,255,0.55)");
  g.addColorStop(0.45, "rgba(36,67,218,0.22)");
  g.addColorStop(1, "rgba(36,67,218,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  glow = new THREE.CanvasTexture(canvas);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}
