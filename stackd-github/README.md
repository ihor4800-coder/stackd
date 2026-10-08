# STACKD — Build Your Crypto Stack

Front-end only portfolio builder. No backend, wallet, prices or trading. Portfolios live in the browser's localStorage.

## Run

```bash
npm install
npm run dev
```

`npm run build` writes a fully static site to `out/` (deploy that folder anywhere, or push the repo to Vercel as a Next.js project).

## Deploy

- **Vercel:** import this GitHub repository at vercel.com/new. It is detected as Next.js; no settings or environment variables are needed. Every push to `main` redeploys.
- **Any static host:** run `npm run build` and upload the `out/` folder. The site expects to live at the root of a domain (asset paths start with `/`), so a GitHub Pages project URL like `user.github.io/repo` needs a `basePath` in `next.config.mjs` first.

## Edit before launch

`lib/config.ts` holds the X, Telegram and Dexscreener links and the contract address. Empty values show "Coming Soon".

## Where things are

- `lib/allocation.ts` — basis-point maths, auto balance, Stack DNA
- `lib/layout3d.ts` — deterministic block layout (volume = allocation)
- `lib/assets.ts`, `lib/demos.ts` — asset catalog and example stacks
- `lib/storage.ts` — localStorage, JSON import/export
- `lib/share.ts` — PNG card, text summary, X intent link
- `state/portfolio.tsx` — portfolio state and saved library
- `components/three/` — React Three Fiber scene
- `components/builder/`, `components/landing/` — UI
