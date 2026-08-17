'use client'

import { useEffect, useMemo, useState } from 'react'
import { isTradeable } from '@prophecy-dev/venue-kit'
import { useSearch } from '@prophecy-dev/connect-react'

// "Markets are global objects, venues are views" — and a view has to be SCOPED. Category alone is far
// too coarse: an F1 venue scoped to "sport" shows cricket and MLS. `useSearch` is the only surface
// with a TEXT filter, and it returns full Event objects, so this feeds the same MarketGrid and keeps
// grouping, columns and the rest.
const VENUE_QUERY = "bitcoin"
// THE TERMS THE VENUE WIDENS WITH, and they are not a nicety — they are the difference between a board
// and an empty state. The search matches keywords in a market's TITLE, and a market minted for this
// venue says "Max Verstappen's 2027 F1 team": it contains "Verstappen" and "F1", and NOT the words the
// creator typed. Measured on testnet right after minting six F1 markets:
//
//   "Formula 1"    -> 0        "Verstappen"   -> 1
//   "Hamilton"     -> 0        "Constructors" -> 2
//
// So the venue asks its subject AND its entities, and merges. Fixed count because these are hooks.
// NOT `as const` — that made an empty list the TUPLE type `readonly []`, and `VENUE_TERMS[0]` on a
// zero-length tuple is a type ERROR rather than `undefined`. Three of them, in the default case: a
// venue scaffolded without `--terms` (SOC-560 #4b). The `?? VENUE_QUERY` below was written for
// exactly the absence the type then denied could happen.
const VENUE_TERMS: readonly string[] = ["bitcoin","ethereum","solana"]
// `tradeable: true` FILTERS AT THE API, which is what makes the limit below worth having: the server
// returns `limit` TRADEABLE markets rather than `limit` of anything, so settled ones no longer eat
// the board. (Measured before this: "book" matched 12 at limit 12, ten of them settled — a board of
// two.) It is also belt-and-braces with the client-side filter further down, deliberately: a venue
// that hands MarketGrid its own `events` owns what it renders, and the grid's tradeable-only default
// does not apply then.
//
// This option was removed for a while because `useSearch` accepted it and silently dropped it —
// forwarding only { venue, mode, limit }. Fixed in connect-react (SOC-528), which also fixed the
// cache key so a changed filter actually refetches. The venue pins ^1.4.0 and resolves well past it;
// on an older lockfile this degrades to the client-side filter rather than showing settled markets.
// NOT `category`. `/v1/search` honours taxonomy and `client.markets.search()` accepts it, but
// `useSearch`'s options do NOT declare it (Connect are fixing the wire schema first — SOC-531 item 6),
// and a prop the reference does not list is a prop a venue must not pass. This emitted it briefly on
// the strength of the old shape; the venue is not typechecked, so it would have been dropped in
// silence — the same class of failure as the `tradeable` drop it was written to survive. The category
// nav filters the merged array in the page instead.
const VENUE_SEARCH = {"mode":"hybrid","tradeable":true,"limit":12} as const

// The venue's OWN markets, baked in so this venue leads with them even with NOTHING else reachable.
// Safe to compile in because pins only REORDER the query's results below — a resolved market is not in
// a tradeable result set, so a stale id ranks nothing. It decays into a no-op, not into a dead link.
const LOCAL_PINS: string[] = []
// Where those pins REFRESH from, so a venue that does talk to the studio stays current with no rebuild.
// `null` means this venue was built to run without us and does not call home at all.
const VENUE_MANIFEST = "https://studio.prophecyhosting.com/v/the-tailgate/markets.json"

/**
 * The markets THIS venue is about. Use this instead of a bare <MarketGrid />, which fetches the GLOBAL
 * pool and fills a Formula 1 venue with cricket and crypto.
 */
export function useVenueMarkets() {
  // Four searches, merged: the subject plus up to three of the venue's own entities. An empty term is
  // a no-op query, so the hook count stays fixed whatever the venue knows about itself.
  const main = useSearch(VENUE_QUERY, VENUE_SEARCH)
  const t1 = useSearch(VENUE_TERMS[0] ?? VENUE_QUERY, VENUE_SEARCH)
  const t2 = useSearch(VENUE_TERMS[1] ?? VENUE_QUERY, VENUE_SEARCH)
  const t3 = useSearch(VENUE_TERMS[2] ?? VENUE_QUERY, VENUE_SEARCH)
  const results = useMemo(() => {
    const byId = new Map<string, (typeof main.results)[number]>()
    for (const list of [main.results, t1.results, t2.results, t3.results]) {
      for (const e of list ?? []) if (e && !byId.has(String((e as { id?: unknown }).id))) byId.set(String((e as { id?: unknown }).id), e)
    }
    // TRADEABLE ONLY, and it stays even though VENUE_SEARCH now asks the API for the same thing.
    //
    // Not redundancy — the two answer different questions. The server filters when it builds the
    // page of results; this filters what is on screen NOW. A market whose `closesAt` passes while a
    // visitor reads the board was tradeable when fetched and is not any more, and `isTradeable`
    // re-checks against the clock. It is also the floor if a venue is pinned to a connect-react old
    // enough to drop the option.
    return [...byId.values()].filter((e) => isTradeable(e as never))
  }, [main.results, t1.results, t2.results, t3.results])
  // ANY query still in flight means the board is not finished. This was `&&`, which is true only
  // while ALL FOUR are loading — so the moment the fastest one returned, the venue declared itself
  // loaded and rendered a partial board as though it were complete. The visible symptom is markets
  // appearing after the skeletons have gone, which reads as a glitch rather than a fetch.
  const loading = main.loading || t1.loading || t2.loading || t3.loading
  const [pinned, setPinned] = useState<string[]>(LOCAL_PINS)
  useEffect(() => {
    if (!VENUE_MANIFEST) return
    let alive = true
    // A venue must NEVER break because the studio is unreachable. A failed refresh keeps the pins this
    // venue was built with; no pins at all is still a complete venue, just an unordered one.
    fetch(VENUE_MANIFEST)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && Array.isArray(j?.pinned)) setPinned(j.pinned as string[]) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  const events = useMemo(() => {
    const all = results ?? []
    if (!pinned.length) return all
    // ORDERING, not injection: a pinned market the query does not return cannot be forced in, because
    // browse has no by-id filter. It floats; it does not guarantee.
    const rank = new Map(pinned.map((id, i) => [id, i]))
    return [...all].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
  }, [results, pinned])
  return { events, loading }
}
