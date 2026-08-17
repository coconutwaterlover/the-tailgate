# Prophecy components in The Tailgate

The Tailgate is a player-first skin over Prophecy Connect. Market data, prices, positions, and
trading behavior stay in Prophecy's SDK and Venue Kit; this project changes presentation and copy.

## Capability map

### Event Grid

- **Where:** `app/page.tsx`
- **How:** `useVenueMarkets()` supplies the venue-scoped events to `FeaturedMarket` and
  `MarketGrid`.
- **Why:** The featured card creates one obvious decision, while the short list keeps the
  mobile experience fast.
- **Important:** We always pass `events`; a bare `MarketGrid` would fetch the global pool.

### Single Market

- **Where:** `app/m/[id]/page.tsx` and `app/m/[id]/market-view.tsx`
- **How:** The route parses the market id, `useMarketDetailData(id)` loads the event, and
  `MarketDetail` renders the question and wired prediction controls.
- **Why:** A player gets one complete call per screen without rebuilding the trade path.

### Live Odds

- **Where:** Market cards and `MarketDetail`
- **How:** Cards render the current outcome prices carried by each event. `MarketDetail` uses
  Venue Kit's default live `PriceChart`; we do not calculate prices or subscribe manually.
- **Why:** Every surface uses the same Connect-derived values.

### Holders

- **Where:** `WhoCalledIt` in `app/m/[id]/market-view.tsx`
- **How:** `useConnect()` provides the shared `ConnectClient`, then
  `client.markets.holders(marketId, { limit: 5 })` loads the top five folded positions. The section
  uses `short` and `fmtWei` from Venue Kit for display.
- **Why:** “Who called it?” adds compact social proof without turning the page into a trading
  terminal. It uses the SDK rather than a raw HTTP request.

### Resolution

- **Where:** `app/m/[id]/market-view.tsx`
- **How:** `ResolutionReceipt` shows the oracle result and sources. `ResolutionNotes` exposes the
  market's Caliber criteria in a collapsed detail.
- **Why:** Players can see not only whether they were right, but how the result was established.

### Search

- **Where:** `app/venue-markets.ts`
- **How:** Four `useSearch` calls cover the main query and up to three title terms, merge by market
  id, and retain only tradeable markets.
- **Why:** Search defines the venue's view over global markets. There is intentionally no visible
  search box while the homepage presents only a short curated board.

### CLOB

- **Where:** No dedicated order-book interface.
- **How:** Market structure and the prediction path remain delegated to Venue Kit and Connect. The
  venue does not branch on protocol versions or implement fills itself.
- **Why:** A dense order-book surface conflicts with the player-first brief. Add one only when the
  scoped catalogue contains CLOB markets and the audience needs it.

## Additional surfaces

- `MiniLeaderboard` creates the “Loudest in the lot” competition.
- `PositionsTable` renders the signed-in player's calls and preserves the wired sell affordance.
- `Comments` provides market-level conversation.
- `ActivityFeed` shows recent calls on a market.
- `ResolutionReceipt` and `Comments` remain below the primary decision to preserve the player flow.
- `ProphecyCheckout` is mounted once in `app/providers.tsx` and must not be moved or replaced.

## Integration rule

Restyle and restructure freely; never rewire. Use Prophecy hooks, clients, formatters, and components
for anything involving market truth, prices, positions, resolution, or trading.
