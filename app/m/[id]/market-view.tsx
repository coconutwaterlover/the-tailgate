'use client'

import Link from 'next/link'
import { VenueShell, MarketDetail, ActivityFeed, ResolutionReceipt, ErrorState, Skeleton, useMarketDetailData } from '@prophecy-dev/venue-kit'
import { Comments } from '@prophecy-dev/connect-react'

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
        brand="The Tailgate"
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
          <ErrorState title="Market not found" message="This market may have been removed, or the link is wrong." />
        ) : (
          <>
            <div className="tailgate-detail-kicker">Make your call</div>
            <MarketDetail marketId={id} event={asked} />
            <h2 className="venue-section">What the crowd is saying</h2>
            <Comments subjectType="event" subjectRef={id} />
            {/* WHY a market resolved the way it did, with its sources. Works with no configuration at
                all, and it is the honest answer to "why did I lose?" — which is the question that
                decides whether someone comes back. */}
            <h2 className="venue-section">The final word</h2>
            <ResolutionReceipt marketId={id} />
            {/* The trades on THIS market. Scoped by marketId, so unlike the venue-wide feed on the
                home page it needs no venue id and is true from the first run. */}
            <h2 className="venue-section">Recent calls</h2>
            <ActivityFeed marketId={id} limit={10} />
            <ResolutionNotes market={asked} />
          </>
        )}
      </VenueShell>
    </div>
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
