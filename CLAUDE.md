See [AGENTS.md](AGENTS.md) — the same instructions apply here.

The short version: **restyle and restructure freely, never rewire.** Trading lives in the kit
and in the checkout drawer mounted in `app/providers.tsx`; get markets from `useVenueMarkets()`
rather than a bare `<MarketGrid />`; run `npm run validate` before you call it done.
