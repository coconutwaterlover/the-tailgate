<!-- GENERATED from KIT_REFERENCE in @prophecy-dev/studio-venue/capabilities.
     Do not edit by hand: run `tsx scripts/sync-reference.ts`. Signatures are read out of the
     installed venue-kit / connect-react type declarations and checked by `npm run check:kit`. -->

# The kit, verified

Every name below is exported by the installed packages. Anything not listed does not exist for your
purposes — and a prop that is not shown is a prop you must not pass: the venue is **not typechecked
at build time**, so a guess compiles, deploys, and throws on a visitor's screen.

```
AVAILABLE COMPONENTS — @prophecy-dev/venue-kit (all props optional unless marked REQUIRED):
  <VenueShell children brand mark nav walletSlot header footer maxWidth className headerClassName mainClassName>
      The page frame. brand/mark/nav/header/footer are SLOTS — pass your own JSX to restyle the chrome.
  <MarketGrid events? loading? category? status? limit? refreshMs? columns? variant='grid'|'list'
              pulse? emptyTitle? emptyMessage? emptyState? skeletonCount? exclude? includeSettled?
              strings? className?
              // CALLBACK SIGNATURES — these are the ones that CRASH at runtime if you guess. A build
              // does not typecheck the emitted venue, so a wrong signature reaches a real page.
              renderItem?: (event: Event) => ReactNode
              cardHref?: (event: Event) => string
              onCardClick?: (event: Event) => void
              groupBy?: 'resolutionDay' | 'resolutionWeek' | 'category'
              renderGroupLabel?: (group: MarketGroup) => ReactNode
              //   ^ ONE argument, and it is an OBJECT ({ key, label, markets }), NOT a string and NOT
              //     an index. (g, i) => g.toUpperCase() throws 'g.toUpperCase is not a function' and
              //     takes the whole page down with it. Use group.label.
              >
      Fetches its own markets unless you pass `events`. renderItem replaces the card entirely.
  <MarketList ...same as MarketGrid>            MarketGrid preset in list orientation.
  <MarketCard market:Event REQUIRED pulse? href? variant='default'|'featured' strings? className?
              onPredict?: (market: Event, outcomeIndex: number) => void
              renderOutcome?: (outcome, ctx: { price: number|null; disabled: boolean; predict: () => void }) => ReactNode
              renderFooter?: (market: Event) => ReactNode
              onClick?: (market: Event) => void>
  <FeaturedMarket (events:Event[] | event:Event | fetch:true) REQUIRED select? onSelect? cardHref? emptyState?>
      Pass `events` when a grid on the same page already fetched them — one fetch, two surfaces.
  marketPath(id, title?, base='/market') -> '/m/0xabc…-will-bitcoin-hit-150k'   parseMarketId(seg) -> id
      THE PAIR behind every link. Re-exported by venue-kit, so no connect-sdk import (the emitted page
      forbids one). `marketPath` feeds `cardHref` and `marketHref`; the slug is the SAME one
      prophecy.social has indexed, so links agree across venues. It is DECORATIVE — only the leading id
      is read — so a stale slug still resolves and regenerating one when a title improves is free. The
      route that receives it MUST call `parseMarketId`, or it looks up "0xabc…-will-bitcoin" and finds
      nothing. Canonical stays the bare id: one page, one URL.
  <MarketDetail marketId:string|null REQUIRED event? chart? orderEntry? activity? chartHeight? emptyState?>
      `chart` is a SLOT — put your own chart JSX in it (see usePriceHistory below).
  <OrderEntry market:Event REQUIRED>            Outcome buttons wired to the {c} checkout drawer.
  <ActivityFeed marketId? venue? limit? emptyState?>
  <CategoryNav ...> and COMPASS_CATEGORIES
  <Leaderboard metric='volume'|'edge' entries? limit? refreshMs? metricLabel? emptyState?
               renderRow?: (entry: LeaderboardEntry, index: number) => ReactNode
               onWallet?: (wallet: string) => void>
  <MiniLeaderboard metric? limit? refreshMs? onWallet? emptyState?>   Compact — rank · trader · metric.
  <SearchBar value REQUIRED onChange REQUIRED placeholder? autoFocus?>
  <SearchResults query REQUIRED mode='semantic'|'keyword'|'hybrid' limit? columns? variant? renderResult?>
  <MarketSearch placeholder? mode? limit? columns? variant? autoFocus?>   Bar + results, zero wiring.
  <PositionsTable wallet:string|null REQUIRED positions? showSell? emptyState?
                  layout?: 'cards' | 'table'   // cards is the DEFAULT (kit 1.7.0)
                  marketHref?: (p: Position) => string | null | undefined
                  renderRow?: (p: Position) => ReactNode
                  onSell?: (p: Position) => void>
      LINK THE ROWS. `marketHref` (kit 1.8.0) is what makes a position clickable back to its market;
      without it the title is plain text, which makes the one surface that says "you have money on
      this" the only dead end in the venue. Build the path with `marketPath` so it matches the cards:
        <PositionsTable wallet={w} marketHref={(p) => marketPath(p.marketId, p.marketTitle, '/m')} />
      `layout` defaults to CARDS — title on its own full-width line, numbers beneath. That is the
      right shape in a sidebar, which is where this usually lives. Pass `table` only for a genuinely
      wide column; `renderRow` implies a table either way.
  <NotificationFeed enabled? limit? onOpen?:(row)=>void signedOutState? onSignIn?
                    renderRow?:(row)=>ReactNode emptyState? strings?>
      "What's new" for the signed-in visitor. Needs a session; pass signedOutState for the rest.
  <ResolutionReceipt marketId:string|null REQUIRED resolution? renderSource?:(row)=>ReactNode
                     emptyState? strings? className?>
      HOW a market resolved, with its sources. The answer to "why did I lose?" — worth a place on a
      venue that wants to be trusted rather than merely used.
  Primitives: <Skeleton> <SkeletonLines> <EmptyState> <ErrorState> <Badge>
  Copy override for the WHOLE kit: <VenueKitStringsProvider value={{...}}>
  Also exported: timeAgo(unixSeconds) · isExpiredOrSettled(event) · useResolutionReceipt(marketId, opts?)

HOOKS — @prophecy-dev/venue-kit:
  useMarketBrowse({category?, status?, tradeable?, groupBy?}) -> { events, groups, loading }
  useFeaturedMarket(...) · useMarketDetailData(marketId, event?) · useLeaderboardData(metric?, opts?)
  usePositionsData(wallet) -> { rows, loading } · useMarketData(market) · useMarketCard(market)
  useCountdown(unixSeconds, closedLabel?) -> string|null
COMPONENTS — @prophecy-dev/connect-react (verified against connect-react 1.12.0's .d.ts):
  <PriceChart market:string|null REQUIRED outcomes?:number|number[] interval? from? to? live?
              height? labels?:(outcomeIndex:number)=>string colors? theme? showGrid? showLegend? className?>
      RENDERS THE CHART. Do not build your own from usePriceHistory — this exists and is themed.
  <TradePulse market:string|null REQUIRED children REQUIRED variant? outcomes? label? decimals? radius? theme? colors? max?>
      Live price movement around whatever you wrap.
  <LiveTrades venue?:number history?:boolean children REQUIRED>   The trade ticker.
  <ProphecyOutcomes position? duration? showTxHash?>
      THE TRADE TOASTS, AND YOU DO NOT MOUNT THEM. <ProphecyProvider> mounts one itself (react
      1.22.0), so every venue reports its trades with no wiring — this entry exists so you know what
      that corner of the screen is, not so you add one. It is what says a trade SETTLED or FAILED:
      the drawer shows its own spinner and tick, then closes on confirm while the send resolves
      after that, so without it a settled trade and a silently failed one look identical.
      It reads the venue's own --pc-* tokens, so restyling the brand restyles the toasts.
      Want your own? <ProphecyProvider outcomes={false}> and render from useCheckoutEvents. Mounting
      <ProphecyOutcomes> yourself also works and takes precedence — the automatic one stands down, so
      you never get two.
  <Comments subjectType REQUIRED subjectRef:string|null REQUIRED venue? limit? strings?>
  <FollowButton subjectType REQUIRED subjectRef:string|null REQUIRED strings?|labels?>
  <FollowerCount subjectType REQUIRED subjectRef:string|null REQUIRED label? refreshMs? className?>
  <UserBadge wallet:string|null REQUIRED profile? size? showConnectors? showAddress? className?>
  <StanceChip stance REQUIRED strings?>
  <TakeCard post:Post REQUIRED showTail? viewer?:string|null moderation?
            onReply?: (post: Post) => void
            onTail?: (post: Post) => void
            onChanged?: () => void   // a post was edited/deleted — the OWNER of the list refetches
            strings? className?>
  <Feed scope? subjectType? subjectRef? venue? limit? viewer?:string|null moderation?
        onReply?: (post: Post) => void  emptyState? strings? className?>
      A POST IS A CLAIM BY SOMEONE WITH A VERIFIED POSITION, and these two render it. `<Comments>` is
      the thin list for a market detail page; `<Feed>` + `<TakeCard>` are the community surface —
      what `reference/venue-types.md` means by "positions as posts, with reasoning attached".
      DO NOT HAND-ROLL A POST ROW from `useFeed`. The stance on a take is a SERVER-VERIFIED snapshot
      of what its author held when they wrote it, and that is the only reason `useTail` can open the
      checkout pre-filled with that person's exact call — `(subjectRef, stance.outcomeIndex)` was
      proven at write time. Your own card cannot carry that guarantee, and losing it is invisible.
      `viewer` is the signed-in wallet: omit it and no edit/delete is drawn, which is the safe
      default — guessing would put a Delete button on somebody else's writing.

HOOKS — @prophecy-dev/connect-react:
  usePriceHistory(marketId, {from?, to?, interval?, live?})   The chart's data, if you need it raw.
  useLiveStats(...)     volume / participants / velocity.
  useOdds · useActivity · useEvents · useEvent · useSearch · useLeaderboard · useHistory
  useProphecy() -> { session: { wallet, ... } }   <- the current wallet, for PositionsTable
  useWallet(wallet) -> { profile: { winRate, streak, edgeScore, wins, realizedPnl, ... } }
  useCheckoutEvents((e) => …)   e.type: 'confirmed'|'cancelled'|'settled'|'failed' (+ action.* )
      WHAT HAPPENED TO A TRADE, as a stream. You do not need it for toasts — the provider already
      renders those — but it is the hook for anything else that should react to a trade: advance an
      onboarding step, fire your own analytics, refetch a board. 'confirmed' fires on the TAP, before
      the send resolves; 'settled'/'failed' are terminal. Never announce success on 'confirmed'.
  useComments(subjectType, subjectRef, opts?)     useFeed(scope?, opts?)
  useTail() -> { tail: (post) => Promise<boolean>, pending, available }
      TAIL — take the same side as a post's author, at today's price. `available` is false where the
      venue cannot trade; render the button from it rather than assuming. Pass it to <TakeCard onTail>.
  useMarkets(params?, opts?)  <- an ALIAS for useEvents, and the name to reach for when a venue's
      board is a FILTER rather than a search: { venue?, status?, category?, tradeable?, limit? }.
  useNotifications(opts?)                         usePositions(wallet)
  useResolution(marketId)  <- how a market resolved, behind <ResolutionReceipt>
  useWalletRank · useProfile · useFollow · useFollowers · useFollowing · useFollowCounts
  useCheckout() -> { predict, ... }   Components: <CountryFlag> <CountrySelect>
YOUR VENUE'S OWN HOOK — not from any package, it is a FILE IN THIS VENUE (app/venue-markets.ts):
  useVenueMarkets() -> { events, loading }
      THE BOARD. Use this, never a bare <MarketGrid /> or useMarketBrowse — those read the GLOBAL
      pool and fill a Formula 1 venue with cricket. This venue is a VIEW over that pool, and this
      hook is the view: it merges the searches for VENUE_QUERY plus the venue's own terms, keeps
      only what is tradeable now, and floats the venue's own pinned markets to the front.
      Edit VENUE_QUERY / VENUE_TERMS in that file to change what the venue is about; `prophecy
      validate` then tells you how many markets it actually matches, which is the number that
      decides whether a visitor sees a board or an empty page.

THE MARKET CLOCK — what makes a countdown tick and a closed market stop looking tradeable:
  useMarketClock(...) -> re-evaluates lifecycle on a shared ticker. formatMarketClock(...) and
  formatDuration(...) give the wording, via Intl, so venues do not each write a duration formatter
  and drift. WITHOUT IT nothing re-renders: a mounted countdown freezes, and a market that closes
  while someone is reading the board keeps rendering as tradeable until the next fetch. All the
  lifecycle logic stays in wire, so an API sorting by "closing soon" and a card showing the
  countdown cannot disagree.
GETTING PST — the thing a visitor needs before they can predict at all. On testnet a venue with no
  way to obtain collateral is a board nobody can trade on, and neither of these has any UI in the kit:
  useStarterGrant({referrer?, auto?}) -> { granted, enabled, amount, claiming, claim }
      The welcome allocation. AUTO-CLAIMS by default and should stay that way — a user just told
      "here is your starting grant" must not have to hunt for a button. 'amount' is READ from the
      contract; never hardcode it, an admin can move it. 'enabled: false' means say nothing at all
      rather than promise a grant that is switched off.
  useDailyDrip() -> { claimable, amount, claiming, claim }
      The daily top-up, and MANUAL on purpose: it is a return loop, and auto-claiming it on page load
      spends the engagement it exists to create. Render a real affordance when 'claimable'.
  Both send from the visitor's own sponsored smart wallet — no operator key, no venue backend; the
  contract enforces the once-only and the cooldown itself.
FORMATTERS (venue-kit): pct fmtCompact fmtWei fmtSigned countdown formatDeadline marketTitle short
  isTradeable isClosed isUpcoming groupMarkets pickFeatured

EVERY CALLBACK ABOVE TAKES EXACTLY THE ARGUMENTS SHOWN. The emitted venue is NOT typechecked at build
time, so a guessed signature compiles, deploys, and throws on the visitor's screen. If a signature is
not written above, do not pass that prop.

THE ONE RULE THAT DOES NOT BEND: the trade path stays in the kit. Restructure the page however you
like — the checkout is <ProphecyCheckout> plus the kit's predict affordances, and you must never
reimplement, wrap or bypass it. Restyle and restructure freely; never rewire the trade.
```
