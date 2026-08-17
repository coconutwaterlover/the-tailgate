---
name: prophecy-venue
description: Build or restyle a Prophecy prediction venue. Use when working in a directory scaffolded by create-prophecy-venue (it has app/providers.tsx, app/venue-markets.ts and @prophecy-dev/venue-kit in package.json), or when asked to design, restyle, theme or add surfaces to a prediction market venue.
---

# Building a Prophecy venue

A venue is a branded prediction market: people take positions on things they argue about. You are
here to make it look and feel like its subject. The trading already works — your job is everything
around it.

## Ask first — four things, and only four

A venue that is generic is a venue nobody returns to, and you cannot infer any of these. Ask, then
design. **Do not interview them** — an earlier version of this product asked twenty questions and
only four of the answers changed anything that shipped. These are those four:

1. **What is it about?** The subject, specifically. "Formula 1" is a venue; "sports" is a directory.
   This is also what scopes the board — a vague subject shows the whole platform.
2. **What is it called?** It goes in the header, the tab, and the URL.
3. **Who is it for — a trader, a player, or a debater?** This decides the venue's shape more than
   anything else. **trader** = edge, charts, density · **player** = fast, mobile, one decision per
   screen · **debater** = comments, follows, receipts. Read **`reference/venue-types.md`** before
   designing — a venue built for all three serves none. If they are unsure, ask what their audience
   does *now*: reads charts, argues in a group chat, or kills five minutes on their phone.
4. **What should it feel like?** A reference they already love beats an adjective ("like the F1
   timing screens"). If they have brand colours, take the hex; otherwise choose from the subject.

If they cannot answer 3 or 4, do not stall: build from 1 and 2, show it, let them react. **People
correct a venue far more easily than they describe one.**

## The one rule

**Restyle and restructure freely. Never rewire.**

The predict/sell path lives inside the kit's components and the checkout drawer mounted once in
`app/providers.tsx`. Rewrite every page, invent sections, change the whole visual language — you
still cannot break trading, because you never touch it.

Never: reimplement a quote or a price; wrap, fork or bypass `<ProphecyCheckout>`, `<OrderEntry>` or
`useCheckout()`; remount a provider; move the drawer; fetch prices or post trades yourself.

## Get the markets from the venue's own view

```tsx
import { useVenueMarkets } from './venue-markets'
const { events, loading } = useVenueMarkets()
```

`<MarketGrid />` with no props fetches the **global** pool — that is how a Formula 1 venue fills with
cricket. Always pass `events`.

## Before you say it is done

```bash
npm run validate   # the same check that gates deploy
npm run build
npm run shot       # renders to shots/*.png — the only check that LOOKS at it. Open them.
```

`validate` refuses a venue that renders no market surface, hand-rolls a quote, unmounts the checkout,
reads the global pool, or sets ink colours it cannot know are legible. Fix the cause it names — do
not work around it. **Each rejected attempt re-reads your whole context, so a precise fix is cheaper
than a guess.**

It also prints a **scope check**: what this venue really matches. `ON THE BOARD: 0` is an empty
venue — search matches **titles**, so scope `VENUE_QUERY`/`VENUE_TERMS` by names that appear in one
(`"Verstappen"`, not `"Formula 1"`).

## Colour

Use `var(--pc-*)`: `--pc-text` `--pc-muted` `--pc-surface` `--pc-inner` `--pc-accent`
`--pc-onaccent` `--pc-border` `--pc-gain` `--pc-danger` `--pc-radius` `--pc-space` (**not**
`--pc-gap`). The shell paints the page, so a hard-coded colour is a guess about someone else's
background — that is how a headline ends up near-white on a light page, invisible and structurally
perfect. Translucent scrims (`rgba(0,0,0,.55)`) are fine.

## Read these when you need them

Do not load them up front — they cost context on every pass.

- **`reference/kit.md`** — every component, hook and formatter with its real signature, generated
  from the installed type declarations. Read before using any surface you have not used yet. **If a
  prop is not in there, do not pass it**: the venue is not typechecked at build time, so a guessed
  prop compiles, deploys, and throws on a visitor's screen.
- **`reference/venue-types.md`** — what a trader, a player and a debater each need, and the surfaces
  that serve them. Read once you know which one this venue is for.
- **`reference/house-style.md`** — how a venue is written and named. Read before writing any copy.

## The words

Never *bet*, *odds*, *wager*, *gamble*. People **predict**, take a **position**, are **right or
wrong**. This is not a style preference — it is the line between a prediction market and a
bookmaker.
