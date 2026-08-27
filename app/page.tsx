'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useDailyDrip, useProphecy, useStarterGrant } from '@prophecy-dev/connect-react'
import {
  VenueShell,
  MarketGrid,
  marketPath,
  MiniLeaderboard,
  PositionsTable,
  EmptyState,
  fmtWei,
  type PositionRow,
} from '@prophecy-dev/venue-kit'
// THIS VENUE'S OWN MARKETS. Not useMarketBrowse/useEvents — those read every market on the
// platform, and this venue is a VIEW over the pool, not the pool.
import { useVenueMarkets } from './venue-markets'
import { TailgateHeader } from './components/tailgate-header'
import { TailgateOtherLots } from './components/tailgate-other-lots'
import { WalletButton } from './components/tailgate-session'
import { LotHeadcount } from './components/lot-headcount'
import { LotChatter } from './components/lot-chatter'
import { LotGames } from './components/lot-games'
import { LotQueue } from './components/lot-queue'
import { crowdPresence, pickTotal, shouldPreviewSampleCrowd, type CrowdEvent } from './crowd'
import {
  decorateBoard,
  filterByGame,
  gameChips,
  MORE_STACK,
  shouldPreviewBoard,
  type BoardEvent,
} from './board'


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

const VENUE_PROMPTS = [
  {
    title: 'The four-facts brief',
    summary: 'The subject, name, audience, and scene that shape the whole venue.',
    prompt: `I want to make a venue about American football, where fans make quick calls on games, players, and season outcomes.

Call it The Tailgate. It should feel like a stadium parking lot two hours before kickoff, and it is for players.

Build it by following https://docs.prophecyhosting.com/launch-a-venue.txt

Tell me the scope-check number before you design anything. If it is 0, stop — we will fix the terms first. When you are done, run npm run shot and show me the PNGs.`,
  },
  {
    title: 'The parking-lot direction',
    summary: 'The daylight, plywood, cooler-lid visual language.',
    prompt: `The app should feel like a stadium parking lot two hours before kickoff — daylight, grills going, folding chairs, hand-painted plywood signs with the spread chalked on them; loud, friendly, and a little sun-bleached.

Use warm asphalt, faded sky blue, plywood tan, cooler red, parking stripes, marker lettering, picnic checks, and physical shadows. Avoid polished sportsbook or financial-dashboard styling.`,
  },
  {
    title: 'The player interaction',
    summary: 'The speed, tactility, and language of every call.',
    prompt: `This venue is for players. Keep it mobile-first with one obvious decision at a time, big thumb targets, short copy, and almost no chrome.

Every pick should feel like slapping 25 PST on a cooler lid, not filling in a form. Make outcome controls visibly pressable. Keep market content data-driven and preserve the venue kit's market, quote, predict, sell, and checkout wiring. Restyle and restructure freely; never rewire.`,
  },
] as const

const GO_LIVE_COMMANDS = `prophecy login

prophecy venue create "The Tailgate" --network mainnet

prophecy deploy --key pck_… --venue the-tailgate`

const GO_LIVE_CARD = {
  title: 'Put it on the lot',
  summary:
    'Create the venue, save the one-time key, and deploy. Sign-in works on *.venues.prophecyhosting.com — no Privy dashboard change.',
  prompt: `After the venue is built, put it live on Prophecy hosting. The key prints ONCE — save it. The folder name is the hostname: the-tailgate.venues.prophecyhosting.com.

${GO_LIVE_COMMANDS}`,
} as const

const FULL_VENUE_PROMPT = [
  ...VENUE_PROMPTS.map(({ title, prompt }) => `${title}\n\n${prompt}`),
  `${GO_LIVE_CARD.title}\n\n${GO_LIVE_CARD.prompt}`,
].join('\n\n---\n\n')

function useCallBoard(events: readonly BoardEvent[]) {
  const [preview, setPreview] = useState(false)
  useEffect(() => {
    setPreview(shouldPreviewBoard())
  }, [])
  const board = useMemo(() => decorateBoard(events, preview), [events, preview])
  const games = useMemo(() => gameChips(board), [board])
  const [game, setGame] = useState<string | null>(null)
  const calls = useMemo(() => filterByGame(board, game), [board, game])
  const [index, setIndex] = useState(0)
  const [openLot, setOpenLot] = useState(false)

  useEffect(() => {
    setIndex(0)
    setOpenLot(false)
  }, [game, calls.length])

  const current = calls[index] ?? null
  const more = calls.filter((event) => event.id !== current?.id)
  const visibleMore = openLot ? more : more.slice(0, MORE_STACK)

  return {
    games,
    game,
    setGame,
    calls,
    index,
    setIndex,
    more,
    visibleMore,
    openLot,
    setOpenLot,
  }
}

function useLotCrowd(events: readonly CrowdEvent[], loading: boolean) {
  const [previewSample, setPreviewSample] = useState(false)
  useEffect(() => {
    setPreviewSample(shouldPreviewSampleCrowd())
  }, [])
  const emptyBoard = !loading && pickTotal(events) === 0
  return crowdPresence(events, previewSample && emptyBoard)
}

function TailgateEmpty({ title, message }: { title: string; message: string }) {
  return (
    <EmptyState
      className="tailgate-empty"
      title={title}
      message={message}
    />
  )
}

function CopyVenueSection() {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1800)
    } catch {
      setCopied('Copy failed')
    }
  }

  return (
    <section className="tailgate-copy">
      <div className="tailgate-copy__intro">
        <span className="tailgate-copy__tape">Tear off a copy</span>
        <h2>Bring this tailgate to your lot.</h2>
        <p>
          These are the three prompts behind the venue, plus the commands that create it and put it
          live. Copy the full recipe or take one card at a time.
        </p>
        <div className="tailgate-copy__actions">
          <button type="button" onClick={() => void copy('all', FULL_VENUE_PROMPT)}>
            {copied === 'all' ? 'Copied to clipboard' : 'Copy venue prompt'}
          </button>
          <button
            type="button"
            className="tailgate-copy__secondary"
            onClick={() => void copy('deploy', GO_LIVE_COMMANDS)}
          >
            {copied === 'deploy' ? 'Copied to clipboard' : 'Copy go-live commands'}
          </button>
          <a href="https://github.com/coconutwaterlover/the-tailgate" target="_blank" rel="noreferrer noopener">
            View the source ↗
          </a>
        </div>
        <span className="tailgate-copy__status" aria-live="polite">
          {copied === 'Copy failed' ? 'Clipboard unavailable — open a prompt card and copy it manually.' : ''}
        </span>
      </div>

      <div className="tailgate-copy__cards">
        {VENUE_PROMPTS.map((item, index) => {
          const label = `prompt-${index}`
          return (
            <article className="tailgate-prompt" key={item.title}>
              <span>Prompt {index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <details>
                <summary>Read the prompt</summary>
                <pre>{item.prompt}</pre>
              </details>
              <button type="button" onClick={() => void copy(label, item.prompt)}>
                {copied === label ? 'Copied' : 'Copy prompt'}
              </button>
            </article>
          )
        })}
        <article className="tailgate-prompt tailgate-prompt--live">
          <span>Go live</span>
          <h3>{GO_LIVE_CARD.title}</h3>
          <p>{GO_LIVE_CARD.summary}</p>
          <details open>
            <summary>Read the commands</summary>
            <pre>{GO_LIVE_COMMANDS}</pre>
          </details>
          <button type="button" onClick={() => void copy('deploy', GO_LIVE_COMMANDS)}>
            {copied === 'deploy' ? 'Copied' : 'Copy commands'}
          </button>
        </article>
      </div>
    </section>
  )
}

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
  return (
    <PositionsTable
      wallet={session?.wallet ?? null}
      marketHref={(p) => marketPath(p.marketId, p.marketTitle ?? p.marketName, '/m')}
      renderCard={(row) => <PositionTicket row={row} />}
      emptyState={
        <TailgateEmpty
          title="Your ticket roll is clear"
          message="Make a call and your stub will land here."
        />
      }
    />
  )
}

function PositionTicket({ row }: { row: PositionRow }) {
  const position = row.position
  const href = marketPath(position.marketId, position.marketTitle ?? position.marketName, '/m')
  const ticketNumber = position.marketId.replace(/^0x/, '').slice(-6).toUpperCase()

  return (
    <div className="tailgate-position-ticket">
      <a className="tailgate-position-ticket__title" href={href}>
        {row.marketLabel}
      </a>
      <div className="tailgate-position-ticket__call">
        <span>{row.side}</span>
        <strong>{row.pnlLabel ?? 'Call pending'}</strong>
      </div>
      <dl className="tailgate-position-ticket__stats">
        <div>
          <dt>On the stub</dt>
          <dd>{row.sizeLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>Paid in</dt>
          <dd>{row.costLabel ?? '—'}</dd>
        </div>
        <div>
          <dt>Worth now</dt>
          <dd>{row.valueLabel ?? '—'}</dd>
        </div>
      </dl>
      {row.statusLabel ? <span className="tailgate-position-ticket__status">{row.statusLabel}</span> : null}
      <footer>
        <span>Seat · {row.side}</span>
        <span>Ticket · TG-{ticketNumber}</span>
      </footer>
    </div>
  )
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
  const { isReady } = useProphecy()
  const grant = useStarterGrant()
  const drip = useDailyDrip()
  const [landed, setLanded] = useState(false)
  // An offer that cannot be accepted is worse than silence: both claims need a wallet.
  if (!authenticated) return null
  const showGrant = grant.enabled && !grant.granted
  const showDrip = drip.claimable || drip.claiming
  const showError = Boolean(grant.error || drip.error)
  // `enabled: false` is the admin switch for "there is no grant" — so promise nothing.
  if (!showGrant && !showDrip && !showError && !landed) return null
  const dripLabel =
    drip.amount > 0n ? `Claim today’s ${fmtWei(drip.amount)} PST` : 'Claim today’s PST'
  return (
    <section className="venue-pst">
      {showGrant ? <span>Your starting PST is on its way.</span> : null}
      {landed && !showDrip ? <span className="venue-pst__ok">Today’s PST is on the cooler.</span> : null}
      {showError ? (
        <span className="venue-pst__error" role="alert">
          Couldn’t drop the PST. Try the claim again.
        </span>
      ) : null}
      {showDrip ? (
        <button
          type="button"
          className="venue-pst__claim"
          disabled={drip.claiming || !isReady}
          onClick={() => {
            void drip.claim().then((ok) => {
              if (ok) setLanded(true)
            })
          }}
        >
          {drip.claiming ? 'Claiming…' : !isReady ? 'Wallet warming up…' : dripLabel}
        </button>
      ) : null}
    </section>
  )
}

export default function Page() {
  const all = useVenueMarkets()
  const loading = all.loading
  const events = all.events
  const crowd = useLotCrowd(events, loading)
  const board = useCallBoard(events)
  const extraCalls = board.more.length - board.visibleMore.length

  return (
    <div data-density="sparse" data-archetype="tailgate">
    <VenueShell
      header={
        <TailgateHeader
          walletSlot={<WalletButton />}
          presence={
            <LotHeadcount picks={crowd.picks} showCount={crowd.showCount} loading={loading} compact />
          }
        />
      }
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
              <h1>Grab a chair.<br />Make the call.</h1>
              <p>The grills are going and the signs are up. Pick your side, put it on the cooler, and let the whole lot know where you stand.</p>
            </div>
            <div className="tailgate-ticket" aria-label="How The Tailgate works">
              <span className="tailgate-ticket__label">Painted on the plywood</span>
              <strong>Pick a side</strong>
              <span>Slap 25 PST on the cooler</span>
              <span>See where the lot is leaning</span>
              <span>Come back when the whistle blows</span>
            </div>
          </section>

          <LotChatter lines={crowd.lines} />

          <GetPst />

          <section className="tailgate-section venue-lead">
            <div className="tailgate-section__head">
              <span>01</span>
              <h2>Today’s big sign</h2>
              <p>One call on the cooler. Next when you’re ready.</p>
            </div>
            <LotGames games={board.games} selected={board.game} onSelect={board.setGame} />
            <LotQueue
              calls={board.calls}
              index={board.index}
              onIndex={board.setIndex}
              emptyState={
                <TailgateEmpty
                  title="The plywood is blank"
                  message="Check back when the next call gets chalked up."
                />
              }
            />
          </section>

          <section className="tailgate-section">
            <div className="tailgate-section__head">
              <span>02</span>
              <h2>More around the lot</h2>
              <p>A short stack. Flip through the rest when you want them.</p>
            </div>
            <MarketGrid
              events={board.visibleMore}
              loading={loading}
              variant="list"
              emptyState={
                <TailgateEmpty
                  title="That’s the lot for now"
                  message="This call’s the one on the cooler. Next call when you’re ready."
                />
              }
              cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
            />
            {extraCalls > 0 ? (
              <button type="button" className="tailgate-more" onClick={() => board.setOpenLot(true)}>
                See more calls
              </button>
            ) : null}
            {board.openLot && board.more.length > MORE_STACK ? (
              <button type="button" className="tailgate-more tailgate-more--quiet" onClick={() => board.setOpenLot(false)}>
                That’s enough
              </button>
            ) : null}
          </section>

          <section className="tailgate-competition">
            <div className="tailgate-section__head">
              <span>03</span>
              <h2>Loudest in the lot</h2>
              <p>Being right earns the folding-chair bragging rights.</p>
            </div>
            <MiniLeaderboard
              metric="edge"
              limit={5}
              emptyState={
                <TailgateEmpty
                  title="The cooler is quiet"
                  message="Be first to claim the loud chair."
                />
              }
            />
          </section>

          <section className="tailgate-section tailgate-positions">
            <div className="tailgate-section__head">
              <span>04</span>
              <h2>Your calls</h2>
              <p>Everything you put on the record, in one place.</p>
            </div>
            <MyPositions />
          </section>

          <CopyVenueSection />
          <TailgateOtherLots />
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
