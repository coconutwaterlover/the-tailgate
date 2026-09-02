'use client'

import { useMemo, type CSSProperties } from 'react'
import { PriceChart, usePriceHistory, type PriceInterval } from '@prophecy-dev/connect-react'

/**
 * THE GRAPH — ON A BACKGROUND, AND ZOOMED TO THE RANGE IT ACTUALLY USES.
 *
 * Demo feedback (Sep 1): the line was "green on green" and hard to read, and a call that lives
 * between 40% and 60% is a flat line on a 0–100 axis. Two fixes, and neither of them draws the line:
 *
 *   BACKGROUND — the plot sits on its own chalked panel (`--pc-surface`) instead of the venue's
 *   green field, and the line is handed the venue's own ink through `colors`. Left alone
 *   <PriceChart> strokes its default mint (#46d39a) straight onto a mixed-green board.
 *
 *   ZOOM — <PriceChart> has no y-domain prop; it always maps 0…1 across the whole plot. So the plot
 *   is rendered TALLER than the window it sits in and offset upward, which is the same thing as a
 *   zoom: the line, the grid it hangs on and the value pill all scale together, because they are all
 *   the kit's own, and the window shows only the band the call has actually moved through. The kit's
 *   grid is off in that path (`showGrid={false}`) and this frame draws the band's ticks instead —
 *   the kit's 0/25/50/75/100 lines sit outside the window and would read as the wrong scale.
 *
 * `usePriceHistory` here is the BAND, not a second chart: <PriceChart> still draws, as the kit
 * reference asks. `live: false` so this does not open a second relay subscription — the live tail
 * only nudges the newest point, and the band is padded either way.
 *
 * The window keeps at least five points of headroom above and below the traded range, and the band
 * is recomputed whenever the page loads a market — so <PriceChart>'s own live tail has room to move
 * inside it rather than running off the top of the frame.
 *
 * BINARY CALLS ONLY for the zoom. A categorical market draws one line per outcome in the kit's own
 * palette with its legend BELOW the plot, and a clipping window would cut that legend off — so
 * those, and any call without enough history to measure, render full-range in the same panel.
 */

const HEIGHT = 224
const INTERVAL: PriceInterval = '1h'
/** Headroom above and below the traded range, so the line never touches the frame. */
const PAD = 5
/** Never zoom tighter than this: a 6-point window turns noise into drama. */
const MIN_BAND = 20
/** A range this wide already fills the plot — leave it on the full board. */
const ZOOM_FLOOR = 72
/** The band snaps outward to this, so every tick label is a round number. */
const SNAP = 10

/** The line takes the venue's tokens. Inline `stroke` resolves a var() against the venue root. */
const CHART_INK = {
  yes: 'var(--pc-gain)',
  no: 'var(--pc-danger)',
  multi: 'var(--pc-accent)',
} as const

/** Whole percentage points, so the tick labels are exact and the arithmetic cannot drift. */
type Band = { lo: number; hi: number }

type GraphOutcome = { index: number; label: string }

export function LotGraph({
  marketId,
  outcomes,
}: {
  marketId: string
  outcomes?: readonly GraphOutcome[]
}) {
  // Two sides or fewer is what the kit plots as a single line — the only shape a clipping window can
  // hold without losing a legend. Anything else skips the history fetch entirely (`market={null}`).
  const binary = (outcomes?.length ?? 2) <= 2
  const { series } = usePriceHistory(binary ? marketId : null, { interval: INTERVAL, live: false })

  const band = useMemo(() => {
    const points = series?.points ?? []
    if (points.length < 2) return null
    return bandOf(points, 0)
  }, [series])

  const labels = (index: number) => outcomes?.[index]?.label ?? `Side ${index + 1}`
  const tracked = binary ? outcomes?.[0]?.label ?? null : null

  if (!band) {
    return (
      <figure className="lot-graph">
        <GraphHead scale="Full board · 0–100%" tracked={tracked} />
        <div className="lot-graph__frame lot-graph__frame--plain">
          <PriceChart
            market={marketId}
            height={HEIGHT}
            interval={INTERVAL}
            colors={CHART_INK}
            labels={labels}
          />
        </div>
      </figure>
    )
  }

  const span = band.hi - band.lo
  const paneHeight = Math.round((HEIGHT * 100) / span)
  const offset = Math.round(((100 - band.hi) / 100) * paneHeight)
  const step = span <= MIN_BAND ? 5 : SNAP
  const ticks = Array.from({ length: Math.round(span / step) + 1 }, (_, i) => ({
    at: ((i * step) / span) * 100,
    label: `${band.hi - i * step}%`,
  }))

  // The three boxes below all measure off the same numbers, so they travel as custom properties
  // rather than three separate inline styles that could drift apart.
  const frame = {
    ['--graph-h']: `${HEIGHT}px`,
    ['--graph-pane-h']: `${paneHeight}px`,
    ['--graph-top']: `${-offset}px`,
  } as CSSProperties

  return (
    <figure className="lot-graph" style={frame}>
      <GraphHead
        scale={`Zoomed · ${band.lo}–${band.hi}%`}
        tracked={tracked}
      />
      <div className="lot-graph__frame">
        <div className="lot-graph__window">
          <div className="lot-graph__pane">
            <PriceChart
              market={marketId}
              height={paneHeight}
              interval={INTERVAL}
              showGrid={false}
              showLegend={false}
              colors={CHART_INK}
              labels={labels}
            />
          </div>
        </div>
        {/* The band's own ticks, OUTSIDE the clipping window so the top and bottom labels are not
            cut in half — and their numbers are the band's, not the kit's 0/25/50/75/100. */}
        <div className="lot-graph__ticks" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick.at} style={{ top: `${tick.at}%` }}>
              <em>{tick.label}</em>
            </span>
          ))}
        </div>
      </div>
    </figure>
  )
}

function GraphHead({ scale, tracked }: { scale: string; tracked: string | null }) {
  return (
    <figcaption className="lot-graph__head">
      <span className="lot-graph__title">How the lot has moved it</span>
      <span className="lot-graph__meta">
        {tracked ? <strong>{tracked}</strong> : null}
        <span className="lot-graph__scale">{scale}</span>
      </span>
    </figcaption>
  )
}

/**
 * The window the line has lived in, in whole percentage points: padded, widened to a floor, and
 * snapped outward to `SNAP` so the ticks read as round numbers. `null` means "do not zoom" — too
 * little history, or a range already wide enough that the full board is the honest picture.
 */
function bandOf(points: readonly { prices: number[] }[], outcome: number): Band | null {
  let low = Infinity
  let high = -Infinity
  for (const point of points) {
    const value = point.prices[outcome]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    if (value < low) low = value
    if (value > high) high = value
  }
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null

  let lo = Math.max(0, low * 100 - PAD)
  let hi = Math.min(100, high * 100 + PAD)
  if (hi - lo >= ZOOM_FLOOR) return null

  if (hi - lo < MIN_BAND) {
    const mid = (lo + hi) / 2
    lo = mid - MIN_BAND / 2
    hi = mid + MIN_BAND / 2
    if (lo < 0) {
      hi -= lo
      lo = 0
    }
    if (hi > 100) {
      lo -= hi - 100
      hi = 100
    }
  }

  // Outward to whole SNAP steps: the band is what the tick labels read, so it has to land on
  // numbers a person recognises rather than 38.7%.
  const loSnapped = Math.max(0, Math.floor(lo / SNAP) * SNAP)
  const hiSnapped = Math.min(100, Math.ceil(hi / SNAP) * SNAP)
  // Snapped flat means the numbers are effectively one value, and a zoom would be inventing
  // movement that is not there.
  if (hiSnapped - loSnapped < MIN_BAND) return null
  return { lo: loSnapped, hi: hiSnapped }
}
