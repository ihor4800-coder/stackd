import { toPng } from "html-to-image";
import { allocationCents, fmtPct, fmtUsd } from "./allocation";
import { SITE } from "./config";
import type { Portfolio } from "./types";

export type ShareMode = "public" | "private";

export function sortedAssets(p: Portfolio) {
  return [...p.assets].filter((a) => a.bp > 0).sort((a, b) => b.bp - a.bp);
}

/** Text summary. Public mode never includes the budget or dollar amounts. */
export function summaryText(p: Portfolio, mode: ShareMode): string {
  const lines = sortedAssets(p).map((a) =>
    mode === "private"
      ? `${a.ticker} ${fmtPct(a.bp)} (${fmtUsd(allocationCents(p.budgetCents, a.bp))})`
      : `${a.ticker} ${fmtPct(a.bp)}`,
  );
  const head = mode === "private" ? `${p.name} · planned budget ${fmtUsd(p.budgetCents)}` : p.name;
  return [head, "", ...lines, "", `Built with STACKD ${SITE.ticker}`, SITE.tagline].join("\n");
}

/** X only receives text; the PNG has to be attached by hand. */
export function xIntentUrl(p: Portfolio): string {
  const rows = sortedAssets(p).slice(0, 8).map((a) => `${a.ticker} ${fmtPct(a.bp)}`);
  const text = [`My stack: ${p.name}`, "", ...rows, "", `Built with STACKD ${SITE.ticker}`].join("\n");
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

/** True when a captured canvas image actually contains pixels. */
export function hasPixels(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 48;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(false);
        ctx.drawImage(img, 0, 0, 48, 48);
        const d = ctx.getImageData(0, 0, 48, 48).data;
        let lit = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 24 && d[i] + d[i + 1] + d[i + 2] > 40) lit++;
        resolve(lit > 40);
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

export async function cardToPng(node: HTMLElement): Promise<string> {
  await document.fonts.ready;
  const opts = { pixelRatio: 2, cacheBust: true, width: node.offsetWidth, height: node.offsetHeight, style: { transform: "none" } };
  // first pass warms html-to-image's font and image cache; the second is the real one
  await toPng(node, opts);
  return toPng(node, opts);
}
