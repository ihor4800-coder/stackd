import { fmtPct } from "@/lib/allocation";
import { inkOn } from "@/lib/assets";
import { layoutStack, SIDE } from "@/lib/layout3d";
import type { StackAsset } from "@/lib/types";

/**
 * 2D front elevation of the same deterministic layout the 3D stack uses.
 * Doubles as the static fallback when WebGL is missing or a capture fails.
 */
export default function FlatStack({ assets, className = "" }: { assets: StackAsset[]; className?: string }) {
  const cells = layoutStack(assets);
  const S = 300;
  const u = S / SIDE;
  const front = assets
    .map((a) => ({ a, c: cells.get(a.id)! }))
    .filter(({ c }) => c.size[0] > 0)
    // back to front, so nearer blocks overlap the ones behind them
    .sort((p, q) => p.c.center[2] - q.c.center[2]);
  const depth = 0.26;

  return (
    <svg viewBox="-16 -92 410 426" className={className} role="img" aria-label="Stack allocation graphic">
      <defs>
        {front.map(({ a }) => (
          <linearGradient key={a.id} id={`fs-${a.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={a.color} />
            <stop offset="1" stopColor={a.color2} />
          </linearGradient>
        ))}
      </defs>
      <ellipse cx={190} cy={316} rx={190} ry={12} fill="#4285FF" opacity={0.16} />
      {front.map(({ a, c }) => {
        // simple cabinet projection: depth pushes blocks up and to the right
        const z = (SIDE / 2 - (c.center[2] + c.size[2] / 2)) * u * depth;
        const zd = c.size[2] * u * depth;
        const w = c.size[0] * u;
        const h = c.size[1] * u;
        const x = (c.center[0] - c.size[0] / 2 + SIDE / 2) * u + z;
        const y = S - (c.center[1] + c.size[1] / 2 + SIDE / 2) * u - z;
        const r = Math.min(9, w / 4, h / 4);
        const label = w > 46 && h > 30;
        return (
          <g key={a.id}>
            <path d={`M${x} ${y} l${zd} ${-zd} h${w} l${-zd} ${zd} z`} fill={a.color} opacity={0.92} />
            <path d={`M${x + w} ${y} l${zd} ${-zd} v${h} l${-zd} ${zd} z`} fill={a.color2} opacity={0.75} />
            <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#fs-${a.id})`} stroke="rgba(5,7,17,0.55)" strokeWidth={1.5} />
            {label && (
              <>
                <text x={x + w / 2} y={y + h / 2 - (h > 52 ? 4 : -4)} textAnchor="middle" fontSize={Math.min(22, w / 3.4)} fontWeight={800} fill={inkOn(a.color)} style={{ fontFamily: "var(--font-display)" }}>
                  {a.ticker}
                </text>
                {h > 52 && (
                  <text x={x + w / 2} y={y + h / 2 + 16} textAnchor="middle" fontSize={12} fill={inkOn(a.color)} opacity={0.8} style={{ fontFamily: "var(--font-mono)" }}>
                    {fmtPct(a.bp)}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
