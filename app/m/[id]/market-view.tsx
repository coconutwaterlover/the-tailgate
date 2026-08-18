'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { VenueShell, MarketDetail, ActivityFeed, ResolutionReceipt, EmptyState, ErrorState, Skeleton, fmtWei, short, useMarketDetailData } from '@prophecy-dev/venue-kit'
import { Comments, useConnect } from '@prophecy-dev/connect-react'
import { TailgateHeader } from '../../components/tailgate-header'
import { WalletButton } from '../../components/tailgate-session'

function TailgateEmpty({ title, message }: { title: string; message: string }) {
  return (
    <EmptyState
      className="tailgate-empty"
      title={title}
      message={message}
    />
  )
}

/**
 * The detail page is where the FULL question belongs. The card showed the short title because a
 * grid is scanned; here there is one market and room to read it properly, so the headline is
 * `name` — "What will the exact score be in Portland Timbers vs Seattle Sounders FC, 2 Aug 2026?"
 * rather than "Exact score".
 *
 * The kit's h1 renders `title`, and has no slot to override it — but `useMarketDetailData` takes an
 * event and skips its own fetch when given one ("Pass `event` to skip the fetch"). So this page
 * owns the single fetch and hands the market on with the question in front. No second request, and
 * nothing about the market itself is changed.
 */
export function MarketView({ id }: { id: string }) {
  const { event, loading, notFound } = useMarketDetailData(id)
  const asked = event ? { ...event, title: event.name || event.title } : null

  return (
    <div data-density="sparse" data-archetype="tailgate">
      <VenueShell
        header={<TailgateHeader walletSlot={<WalletButton />} />}
        footer={
          <div className="tailgate-footer">
            <span>The Tailgate</span>
            <span>Call it. Own it. Come back tomorrow.</span>
          </div>
        }
      >
        <Link href="/" className="tailgate-back">
          ← Back to the board
        </Link>
        {loading ? (
          <div className="tailgate-detail-loading">
            <Skeleton width="70%" height={28} />
            <Skeleton height={220} radius={12} />
          </div>
        ) : notFound || !asked ? (
          <ErrorState title="That sign came down" message="Head back to the lot and pick another call." />
        ) : (
          <>
            <div className="tailgate-detail-kicker">Make your call</div>
            <MarketDetail marketId={id} event={asked} />
            <WhoCalledIt
              marketId={id}
              outcomes={asked.outcomes}
              decimals={asked.collateral?.decimals ?? 18}
            />
            <h2 className="venue-section">What the crowd is saying</h2>
            <Comments
              subjectType="event"
              subjectRef={id}
              emptyState={<TailgateEmpty title="The folding chairs are quiet" message="Bring the first take to the circle." />}
            />
            {/* WHY a market resolved the way it did, with its sources. Works with no configuration at
                all, and it is the honest answer to "why did I lose?" — which is the question that
                decides whether someone comes back. */}
            <h2 className="venue-section">The final word</h2>
            <ResolutionReceipt
              marketId={id}
              emptyState={<TailgateEmpty title="The whistle has not blown" message="The final receipt lands after this call settles." />}
            />
            {/* The trades on THIS market. Scoped by marketId, so unlike the venue-wide feed on the
                home page it needs no venue id and is true from the first run. */}
            <h2 className="venue-section">Recent calls</h2>
            <ActivityFeed
              marketId={id}
              limit={10}
              emptyState={<TailgateEmpty title="The cooler lid is clean" message="The next call leaves the first mark." />}
            />
            <ResolutionNotes market={asked} />
          </>
        )}
      </VenueShell>
    </div>
  )
}

interface HolderRow {
  wallet: string
  outcomeIndex: number
  shares: string
  costBasis: string
}

function WhoCalledIt({
  marketId,
  outcomes,
  decimals,
}: {
  marketId: string
  outcomes: Array<{ index: number; label: string }>
  decimals: number
}) {
  const client = useConnect()
  const [holders, setHolders] = useState<HolderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setFailed(false)

    client.markets.holders(marketId, { limit: 5 })
      .then((result) => {
        if (alive) setHolders(result.holders)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [client, marketId])

  return (
    <section className="tailgate-holders" aria-labelledby="tailgate-holders-title">
      <div className="tailgate-holders__head">
        <div>
          <span>Cooler-side roll call</span>
          <h2 id="tailgate-holders-title">Who called it?</h2>
        </div>
        <p>Top five positions on this call.</p>
      </div>

      {loading ? (
        <div className="tailgate-holders__loading">
          <Skeleton height={42} />
          <Skeleton height={42} />
        </div>
      ) : failed ? (
        <p className="tailgate-holders__empty">The roll call could not load. The market is still live.</p>
      ) : holders.length === 0 ? (
        <p className="tailgate-holders__empty">Nobody has put a call on the cooler yet. You could be first.</p>
      ) : (
        <ol className="tailgate-holders__list">
          {holders.map((holder, index) => (
            <li key={`${holder.wallet}-${holder.outcomeIndex}`}>
              <span className="tailgate-holders__rank">{String(index + 1).padStart(2, '0')}</span>
              <strong>{short(holder.wallet)}</strong>
              <span className="tailgate-holders__side">
                {outcomes.find((outcome) => outcome.index === holder.outcomeIndex)?.label ?? `Side ${holder.outcomeIndex + 1}`}
              </span>
              <span className="tailgate-holders__shares">{fmtWei(holder.shares, decimals)} shares</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * How this market resolves — collapsed, because almost nobody wants it and the few who do want ALL
 * of it. The rating is not decoration: the criteria say how many sources have to agree, whether
 * they were reachable, and whether the window is sound. That is the honest answer to "how do you
 * decide", and it is already on the market.
 */
// `title` AND `caliber` ARE NULLABLE, and this said `string` / `Caliber`. The caller passes a whole
// wire `Event`, where both are `| null` — so a fresh scaffold did not typecheck (SOC-560 #4b).
// Nothing failed at runtime, because the branches below test for absence anyway; the check that would
// have said so was never runnable. `| null` rather than making the caller coalesce: this component
// reads what the API returns, and the API returns null.
function ResolutionNotes({ market }: { market: { title?: string | null; caliber?: Caliber | null } }) {
  const c = market.caliber
  if (!c || c.status !== 'rated') return null
  return (
    <details className="venue-resolution">
      <summary>
        How this resolves
        {c.band ? <span className="venue-resolution__band">Rated {c.band}</span> : null}
      </summary>
      {c.definition ? <p className="venue-resolution__lead">{c.definition}</p> : null}
      <ul className="venue-resolution__criteria">
        {(c.criteria ?? []).map((k) => (
          <li key={k.key} data-status={k.status}>
            <strong>{k.name}</strong> {k.summary}
          </li>
        ))}
      </ul>
      {c.detailUrl ? (
        <a href={c.detailUrl} target="_blank" rel="noreferrer noopener">
          Full rating on Caliber ↗
        </a>
      ) : null}
    </details>
  )
}

// Shape of the rating carried on every market. Declared locally rather than imported: it is read
// here and nowhere else, and a wrong guess would fail at the type level rather than at runtime.
// A STRUCTURAL SHIM for the fields this component reads, deliberately — importing the wire type
// would tie the emitted page to a schema version it does not pin. It has to be assignable FROM the
// real one though, and it was not: every field on the wire's caliber is nullable and this declared
// them merely optional, so passing an actual API row was a type error (SOC-560 #4b). `| null`
// everywhere; the reads below already test each one.
interface Caliber {
  status?: string | null
  band?: string | null
  definition?: string | null
  detailUrl?: string | null
  criteria?: Array<{ key: string; name: string; status: string; summary?: string | null }> | null
}
