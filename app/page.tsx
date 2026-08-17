'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useDailyDrip, useProphecy, useStarterGrant } from '@prophecy-dev/connect-react'
import { VenueShell, MarketGrid, marketPath, MiniLeaderboard, PositionsTable, FeaturedMarket, pickFeatured } from '@prophecy-dev/venue-kit'
// THIS VENUE'S OWN MARKETS. Not useMarketBrowse/useEvents — those read every market on the
// platform, and this venue is a VIEW over the pool, not the pool.
import { useVenueMarkets } from './venue-markets'


// Composed over @prophecy-dev/venue-kit.
// RESTYLE, NEVER REWIRE: change any markup/class/layout freely, but the predict/sell path stays in the
// kit's hooks and the {c} drawer — never re-implement the quote or checkout.
// venue-kit >= 0.3.0 shows TRADEABLE markets only by default (pass `includeSettled` to opt back in).

// THREE TIERS, and each string belongs to exactly one of them:
//   card    -> `title`, the short one (under 60 chars). Scannable in a grid. Always the default.
//   detail  -> `name`, the full question. One market, and room to read it properly.
//   inspect -> the rating and its per-criterion summaries, behind a disclosure, for the reader who
//              actually wants to know how the thing resolves.
// A short title that names nothing ("Exact score") is a CONTENT bug and is fixed where it is
// written. An earlier version of this file second-guessed the title with a heuristic; it mis-fired
// on perfectly good ones ("Toluca match winner", "Marriott total rooms") and is gone.

const chip = {
  font: 'inherit',
  fontSize: 12,
  padding: '4px 10px',
  cursor: 'pointer',
  color: 'var(--pc-text)',
  border: '1px solid var(--pc-border)',
  borderRadius: 'var(--pc-radius)',
  background: 'transparent',
} as const

// PositionsTable REQUIRES `wallet`; the current one lives on the Prophecy session. Same client-only
// guard as WalletButton below and for the same reason — ProphecyProvider mounts after hydration
// (see Providers), so calling useProphecy on the server render throws for want of its provider.
function MyPositions() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <MyPositionsInner />
}

function MyPositionsInner() {
  const { session } = useProphecy()
  // LINKED, because a position is the one surface that says "you have money on this" — and until
  // venue-kit 1.8.0 it was the only dead end in the venue: the market cards next to it were links and
  // these were plain text. `marketPath` builds the same /m/{id}-{slug} the cards use, so a position
  // and a card lead to the same URL and the market page reads the id back out with `parseMarketId`.
  return <PositionsTable wallet={session?.wallet ?? null} marketHref={(p) => marketPath(p.marketId, p.marketTitle ?? p.marketName, '/m')} />
}

/**
 * GETTING PST — without this a visitor cannot predict at all.
 *
 * A board nobody can trade on is a brochure. On testnet the collateral comes from two self-service
 * claims, and NEITHER has any UI in the kit — so every venue had to invent one, which meant none had
 * one, because a creator cannot ask for a thing they have never been shown.
 *
 * The two differ ON PURPOSE, and the difference is product rather than plumbing:
 *   - the starter grant AUTO-CLAIMS. It is a welcome; making someone hunt for it makes the promise
 *     untrue until they find it. The hook claims on its own, so this only reports.
 *   - the daily drip is MANUAL. It is a return loop, and claiming it on page load spends the
 *     engagement it exists to create.
 *
 * Both send from the visitor's OWN sponsored smart wallet, so this needs no key and no backend — the
 * contract enforces the once-only and the cooldown itself.
 *
 * RESTYLE THIS FREELY, like any page code. Just do not make the drip automatic.
 */
function GetPst() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <GetPstInner />
}

function GetPstInner() {
  const { authenticated } = usePrivy()
  const grant = useStarterGrant()
  const drip = useDailyDrip()
  // An offer that cannot be accepted is worse than silence: both claims need a wallet.
  if (!authenticated) return null
  // `enabled: false` is the admin switch for "there is no grant" — so promise nothing.
  if (!grant.enabled && !drip.claimable) return null
  return (
    <section className="venue-pst">
      {grant.enabled && !grant.granted ? <span>Your starting PST is on its way.</span> : null}
      {drip.claimable ? (
        <button type="button" className="venue-pst__claim" disabled={drip.claiming} onClick={() => void drip.claim()}>
          {drip.claiming ? 'Claiming…' : 'Claim today’s PST'}
        </button>
      ) : null}
    </section>
  )
}

function WalletButton() {
  // Privy mounts client-only (see Providers), so this cannot call usePrivy on the server or on the
  // first client render — the hook throws without its provider above it.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <WalletButtonInner />
}

function WalletButtonInner() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  if (!ready) return null
  const addr =
    (user?.linkedAccounts?.find((a) => (a as { type?: string }).type === 'smart_wallet') as { address?: string } | undefined)
      ?.address ?? null
  return authenticated ? (
    <button onClick={() => void logout()} style={chip}>
      {addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Signed in'} · Sign out
    </button>
  ) : (
    <button onClick={() => login()} style={{ ...chip, background: 'var(--pc-accent)', color: 'var(--pc-onaccent)' }}>
      Sign in
    </button>
  )
}

export default function Page() {
  const all = useVenueMarkets()
  const loading = all.loading
  const events = all.events
  const lead = events.length ? pickFeatured(events, "volume") : null
  // the hero must not also appear in the list beneath it
  const rest = lead ? events.filter((e) => e.id !== lead.id) : events

  return (
    <div data-density="sparse" data-archetype="tailgate">
    <VenueShell
      brand="The Tailgate"
      walletSlot={<WalletButton />}
      footer={
        <div className="tailgate-footer">
          <span>The Tailgate</span>
          <span>Call it. Own it. Come back tomorrow.</span>
        </div>
      }
    >
      <>
          <section className="tailgate-hero">
            <div className="tailgate-hero__copy">
              <span className="tailgate-kicker">Testnet · Gates open</span>
              <h1>Call the game<br />before kickoff.</h1>
              <p>One decision at a time. Pick your side, put it on the record, and see who read the moment right.</p>
            </div>
            <div className="tailgate-ticket" aria-label="How The Tailgate works">
              <span className="tailgate-ticket__label">Your game plan</span>
              <strong>Pick a call</strong>
              <span>Take a position with 25 PST</span>
              <span>Watch the crowd move</span>
              <span>Come back for the result</span>
            </div>
          </section>

          <div className="tailgate-marquee" aria-label="Venue highlights">
            <span>Live calls</span>
            <span>Gasless predictions</span>
            <span>Paper-money testnet</span>
          </div>

          <GetPst />

          {lead && (
            <section className="tailgate-section venue-lead">
              <div className="tailgate-section__head">
                <span>01</span>
                <h2>Make the call</h2>
                <p>The crowd is forming. Where do you stand?</p>
              </div>
              <FeaturedMarket event={lead} cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')} />
            </section>
          )}

          <section className="tailgate-section">
            <div className="tailgate-section__head">
              <span>02</span>
              <h2>More on the board</h2>
              <p>Quick calls. Big targets. No playbook required.</p>
            </div>
            <MarketGrid
              events={rest.slice(0, 7)}
              loading={loading}
              variant="list"
              emptyTitle="Nothing to call right now"
              emptyMessage="The board is quiet. Check back when the next matchup lands."
              cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
            />
          </section>

          <section className="tailgate-competition">
            <div className="tailgate-section__head">
              <span>03</span>
              <h2>Fans who saw it first</h2>
              <p>Accuracy earns the bragging rights.</p>
            </div>
            <MiniLeaderboard metric="edge" limit={5} />
          </section>

          <section className="tailgate-section tailgate-positions">
            <div className="tailgate-section__head">
              <span>04</span>
              <h2>Your calls</h2>
              <p>Everything you put on the record, in one place.</p>
            </div>
            <MyPositions />
          </section>
          {/* YOUR VENUE'S OWN LIVE SURFACES. Both need the numeric venue id you get from
              `prophecy venue create` — until then they would show the whole platform's trades under
              your brand, so they are off rather than wrong. Add `venueNo` and uncomment:

          <ActivityFeed venue={VENUE_NO} limit={12} />
          <LiveTrades venue={VENUE_NO} history>{(t) => <li>{t.side} {t.marketTitle}</li>}</LiveTrades>
          */}
      </>
    </VenueShell>
    </div>
  )
}
