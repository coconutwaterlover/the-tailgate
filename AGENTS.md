# Working on a Prophecy venue

This is a **prediction venue**: a branded site where people trade opinions on real events. You
are here to make it look and feel like its subject. Design freely — the trading works already.

## The one rule

**Restyle and restructure freely. Never rewire.**

The predict/sell path lives inside the kit's components and in the `{c}` checkout drawer mounted
once in `app/providers.tsx`. You can rewrite every page, invent new sections, change the whole
visual language — and you still cannot break trading, because you never touch it.

Concretely, **do not**:

- reimplement a quote, a price calculation, or an order form
- wrap, fork, or bypass `<ProphecyCheckout>`, `<OrderEntry>`, or `useCheckout()`
- move or unmount the checkout drawer in `app/providers.tsx`
- fetch prices or post trades yourself

Everything else is yours: layout, typography, colour, copy, imagery, motion, new components,
new pages. A page that looks nothing like the one you started with is a success, not a risk.

## What is fixed and what is yours

| Fixed (the frame) | Yours (everything else) |
| --- | --- |
| `app/providers.tsx` — providers + checkout drawer | `app/page.tsx` |
| `app/layout.tsx` — html/head, fonts, theme vars | `app/globals.css` and any CSS you add |
| `worker/index.ts`, `wrangler.jsonc` — hosting | `app/m/[id]/market-view.tsx` presentation |
| `app/venue-markets.ts` — which markets this venue shows | any component or page you add |

Edit `app/venue-markets.ts` only to change **which** markets appear (the query and terms), never
how they are fetched.

## Getting the markets

Use the venue's own hook, not a bare grid:

```tsx
import { useVenueMarkets } from './venue-markets'
const { events, loading } = useVenueMarkets()
```

`<MarketGrid />` with no props fetches the **global** pool and will fill a Formula 1 venue with
cricket. `useVenueMarkets()` is this venue's scoped view. Pass its results down:
`<MarketGrid events={events} loading={loading} />`.

## Components you have

From `@prophecy-dev/venue-kit`: `VenueShell` `MarketGrid` `MarketList` `MarketCard`
`FeaturedMarket` `MarketDetail` `OrderEntry` `ActivityFeed` `CategoryNav` `Leaderboard`
`MiniLeaderboard` `SearchBar` `SearchResults` `MarketSearch` `PositionsTable` plus primitives
(`Skeleton` `EmptyState` `ErrorState` `Badge`).

Every one of them accepts `className`, styles itself from `--pc-*` CSS variables, and takes
render-props for its parts (`renderItem`, `renderOutcome`, `renderFooter`, `renderRow`). **Reach
for a render-prop before you reach for a rewrite.**

Two traps that only fail at runtime, because the app is not typechecked at build time:

- `renderGroupLabel` takes **one object** (`{ key, label, markets }`), not a string. `g.toUpperCase()`
  throws and takes the page down. Use `group.label`.
- If a prop is not in the kit's documented surface, **do not pass it**. A guessed prop compiles,
  deploys, and breaks on a visitor's screen.

## Theming

Colour, type, radius and spacing come from `--pc-*` variables set on `[data-prophecy-root]`
(`--pc-accent` `--pc-surface` `--pc-inner` `--pc-border` `--pc-text` `--pc-muted` `--pc-onaccent`
`--pc-gain` `--pc-danger` `--pc-radius` `--pc-space`). Restyle the venue by changing those in one
place and the whole kit follows. Note the token is `--pc-space`, **not** `--pc-gap`.

**Colour from those tokens. Do not invent a palette, and never assume a background.** The shell
paints the page; a background you set on a wrapper around it will not win. Hard-coding your own ink
on an assumed dark background is how you get a headline in near-white on a light page — invisible,
and nothing will stop you. `npm run validate` checks that the venue is still a venue; **it does not
look at it.** A page can pass every check and be unreadable.

If you want a dark venue, change the theme the venue is built with — not the colours of individual
elements. `var(--pc-text)` is correct on any background the shell might use; `#f2f2f4` is correct on
exactly one.

## Going live

The venue needs a key of its own — that is also what creates it on Prophecy's side:

```bash
prophecy venue create "Paddock Club"    # prints the key, once
prophecy deploy --key pck_…              # guards, builds, deploys
```

The key ships inside the venue's bundle and is scoped to read + trade, so it is not a secret in the
usual sense — but it is shown **once** and cannot be read back.

## Installing

The `@prophecy-dev/*` packages are **private** while the protocol completes verification. The venue
ships an `.npmrc`; it needs the Prophecy access key in it, either written there at scaffold time or
supplied as `NPM_TOKEN`. If `npm install` returns **404** for `@prophecy-dev/*`, that means **not
signed in**, not "the package does not exist" — ask whoever gave you this venue for the key.

**That is not a broken template, and it is not yours to work around.** Do not substitute another
package, stub the imports, vendor a copy, or switch registries. Stop and say the token is missing.

## Before you say it's done

```bash
npm run validate   # the same check that runs at deploy
npm run build
```

`validate` needs the Prophecy CLI on your PATH. If you get `prophecy: not found`, it is not
installed yet — ask whoever gave you this venue, and **do not delete the script or invent a
substitute check**. Running `npm run build` alone is not the same thing: the build does not
typecheck, and the guard is what catches the mistakes that reach a visitor.

`validate` refuses a venue that renders no market surface, hand-rolls a quote, unmounts the
checkout drawer, or quietly reads the global market pool instead of this venue's own. It runs again
at deploy, so a venue that fails here cannot ship. Fix the cause it names; do not work around it.

It also prints a **scope check** — how many tradeable markets this venue's own search actually
matches, asked of the live index. `ON THE BOARD: 0` means a visitor sees an empty venue however good
the design is, and no other check in the toolchain can tell you that. The fix is `VENUE_QUERY` and
`VENUE_TERMS` in `app/venue-markets.ts`: **search matches market TITLES**, so scope by the names that
appear in them ("Verstappen", "The Winds of Winter"), not by the topic ("Formula 1", "book
releases") — measured, those topics match nothing at all. The scope check never fails the build; it
is a fact you are expected to act on.

```bash
npm run shot   # render the venue and write shots/desktop.png + shots/mobile.png
```

**`--shot` is the only check that looks at the page.** It builds the venue, boots it, and writes
PNGs. Everything above is structural; layout, spacing and rhythm are not, and real venues have
shipped with lone half-width cards in a two-column grid and a browser-default 168px textarea, both
obvious in a screenshot and invisible to every rule. It needs Playwright (`npm i -D playwright &&
npx playwright install chromium`) and it tells you so if it is missing. **Look at the PNGs** — or, if
you cannot, say that you could not and hand them to whoever can.

The build must also pass. Note that **the app is not typechecked at build time**, so a wrong prop or
a bad callback signature survives the build and fails on a visitor's screen — reread the traps above
rather than trusting a green build.

## House style for the writing

This is a place for people who **argue about a subject**, not a casino. Never use the words
*bet*, *odds*, *wager*, or *gamble* — people **predict**, they take a **position**, they are
**right or wrong**. Write like the subject's own press, not like a sportsbook.
