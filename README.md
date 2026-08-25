# The Tailgate

A player-first [Prophecy](https://docs.prophecyhosting.com/welcome) venue about American football.
It is built to feel like a stadium parking lot two hours before kickoff: daylight, grills going,
folding chairs, hand-painted plywood, and calls made on a cooler lid.

Grab a chair. Make the call.

Live on [the-tailgate.vercel.app](https://the-tailgate.vercel.app). Source lives at
[github.com/coconutwaterlover/the-tailgate](https://github.com/coconutwaterlover/the-tailgate).

## On the lot

- **Today’s big sign** — one featured market, then a short mobile-first list
- **Quick calls** — pick a side, put 25 PST on the cooler, see where the lot is leaning
- **Loudest in the lot** — a compact player leaderboard
- **Your calls** — signed-in positions as ticket stubs
- **Market pages** — the full question, top holders, comments, recent activity, and resolution receipts
- **Copy venue** — the prompts and go-live commands used to recreate this experience

Trading, prices, positions, and checkout stay inside Prophecy Connect and Venue Kit. This repo
restyles the place; it does not rewire the trade path.

See [PROPHECY_COMPONENTS.md](PROPHECY_COMPONENTS.md) for the component map, and [AGENTS.md](AGENTS.md)
if you are changing the venue.

## Requirements

- Node.js 18 or newer
- npm
- A Prophecy npm access key for the private `@prophecy-dev/*` packages

The tracked `.npmrc` reads the token from the environment. Do not commit the token itself:

```bash
export NPM_TOKEN=<your-prophecy-npm-key>
```

Without it, `npm install` returns **404** for `@prophecy-dev/*`. That means not signed in, not that
the packages are missing.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Privy app used for sign-in must allow that
exact origin, including the port.

The venue runs on **Somnia mainnet** (chain 5031). One word switches it — `NETWORK` in
`app/providers.tsx` — and the API host, gateway, viem chain and trade contracts all follow from it.

Mainnet PST is real, so the testnet faucet is not part of this build: the starter grant and daily
drip in `GetPst` render nothing unless the network actually offers them. A visitor needs PST in their
wallet before they can predict. Set `NETWORK = "testnet"` to get the self-service claims back for
local work.

## Verify

```bash
npm run typecheck
npm run validate
npm run build
npm run shot
```

`validate` is the same guard that gates a Prophecy deploy — it reads the venue's source and refuses
things like a page that remounts a provider. On CLI 0.1.0 that is *all* it does: it prints
`Venue guard passed (N files checked)` and **no scope check**. Earlier docs promised an
`ON THE BOARD: N` line; don't wait for it. The guard never fetches a market, so it cannot tell you
whether a visitor sees a board — for that, query the API for the terms in `app/venue-markets.ts`, or
run the venue and look.

The guard matches on **text**, not on what the code does: naming `ProphecyProvider` or
`ConnectProvider` anywhere in a page file fails the deploy, comments included. Talk about the
providers in prose in page files.

`shot` writes `shots/desktop.png` and `shots/mobile.png`. It needs Playwright and Chromium available
to the Prophecy CLI. Look at the PNGs; no other check looks at the page.

## Market scope

This venue is a view over Prophecy’s market pool, not the pool itself. The search lives in
[`app/venue-markets.ts`](app/venue-markets.ts):

```ts
const VENUE_QUERY = "NFL season"
const VENUE_TERMS = ["Week 1 2026 NFL", "starting quarterback", "Steelers"]
```

Search matches **market titles**, fuzzily — which is why the query is not `"NFL"`. On mainnet that
matches **NFLX**, the Netflix share price, and takes most of the board with stock-close markets. Team
and player names hit, but thinly (one market each for the Chiefs and the Steelers), so the widening
terms are phrasings that cut across teams. This scope lands 17 open football markets. After you change the query or terms:

1. Run `npm run validate`
2. Stop if the scope report says `ON THE BOARD: 0`
3. Regenerate and inspect the screenshots

Always feed markets through `useVenueMarkets()`. A bare `<MarketGrid />` fetches the global pool.

## Project structure

```text
app/
  page.tsx                    Homepage, leaderboard, positions, and copy prompts
  venue-markets.ts            Venue-scoped market search
  providers.tsx               Connect, Privy, theme, and the checkout drawer
  components/tailgate-header.tsx
  m/[id]/market-view.tsx      Market detail, holders, comments, and resolution
  globals.css                 Tailgate visual system
PROPHECY_COMPONENTS.md        Prophecy capability map
shots/                        Generated visual checks
```

The checkout drawer is mounted once in `app/providers.tsx`. Do not move, wrap, or unmount it.

## Restyle freely. Never rewire.

Pricing, market truth, positions, resolution, and trading stay in Prophecy Connect and Venue Kit.
Do not calculate prices, post trades, fork `<OrderEntry>`, or bypass `<ProphecyCheckout>`.

People **predict**, they take a **position**, they are **right or wrong**. Do not write *bet*,
*odds*, *wager*, or *gamble*.

## Deploy

### Vercel

The Next.js production build is:

```bash
npm run build:vercel
```

Add `NPM_TOKEN` to the Vercel project’s build environment so `@prophecy-dev/*` can install. The
framework preset should run `npm run build:vercel`.

### Prophecy hosting

**The venue key is not in this repo, and does not need to be.** `API_KEY` in
[`app/providers.tsx`](app/providers.tsx) is an empty **slot**: `prophecy deploy` matches that line and
writes the key from `--key` (or `PROPHECY_VENUE_KEY`) into it before building. The deployed venue
carries the key; git never does. Keep the line in its exact shape — the CLI's regex is
`const API_KEY = (["'])(.*?)\1`, and a line it cannot match refuses the deploy.

Keeping it out of git is deliberate. It is not a secret in the usual sense — it ships in the browser
bundle, so every visitor holds it — but committing it to a public repo makes it greppable by people
who never opened the venue, and what it buys an abuser is our sponsorship budget, our fee attribution
and our market-creation quota.

```bash
export PROPHECY_ACCESS_TOKEN=…                  # or: prophecy login
prophecy deploy --key pck_…                     # worker name comes from the directory
```

Deploying with no key does not fail — it prints `WARNING: no venue key — this venue will trade
unattributed and unsponsored` and goes live keyless: reads fine, board fills, every visitor pays
their own gas. Watch for that line.

Two things the deploy needs that are easy to miss:

- **Cloudflare auth.** The publish step shells out to `wrangler … --dispatch-namespace
  prophecy-studio`, so it needs `wrangler login` or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
  in the environment. Without it the build succeeds and the publish fails.
- **The key lands on disk.** After a real deploy, `app/providers.tsx` holds the key locally. Run
  `git checkout app/providers.tsx` before committing anything.

`prophecy deploy --dry-run --skip-install` runs the guard and the full build and publishes nothing —
worth doing first. To confirm afterwards which way a live deploy went:

```bash
curl -s https://the-tailgate.venues.prophecyhosting.com/ \
  | grep -oE '/_next/static/chunks/providers-[^"]+\.js' \
  | head -1 | xargs -I{} curl -s https://the-tailgate.venues.prophecyhosting.com{} \
  | grep -c pck_
```

`1` means the key shipped; `0` means the venue is live and keyless.

The venue id is `the-tailgate`, already claimed on mainnet. A *different* venue needs its own key
from `prophecy venue create "<Name>"` — that command prints the `pck_…` key once.

The launch walkthrough is at
[docs.prophecyhosting.com/launch-a-venue.txt](https://docs.prophecyhosting.com/launch-a-venue.txt).

## Documentation

- [Prophecy Connect](https://docs.prophecyhosting.com/welcome)
- [Make a venue](https://docs.prophecyhosting.com/make-a-venue)
- [Prompt to venue](https://docs.prophecyhosting.com/prompt-to-venue)
- [Component usage in this project](PROPHECY_COMPONENTS.md)
