'use client'

import { marketPath } from '@prophecy-dev/venue-kit'
import { gameOf, type BoardEvent } from '../board'
import { leadingSide } from '../crowd'

/**
 * WHERE THE LOT IS PILING IN — two or three blocks that jump straight to the busy calls, above the
 * whole lot rather than buried in it (demo feedback, Sep 1).
 *
 * Every number on these blocks already rides on the event: `tradeCount` is the pick count and the
 * outcome prices are the lean. Nothing is quoted or fetched here — a block is a link to the market
 * page, where the kit does the trading.
 */
export function LotPopular({ calls }: { calls: BoardEvent[] }) {
  if (calls.length === 0) return null

  return (
    <ol className="tailgate-popular">
      {calls.map((call, index) => {
        const title = call.title ?? call.name ?? 'Open call'
        const side = leadingSide(call)
        const picks = call.tradeCount ?? 0
        const game = gameOf(call)
        return (
          <li key={call.id}>
            <a className="tailgate-popular__card" href={marketPath(call.id, title, '/m')}>
              <span className="tailgate-popular__tape">
                {index === 0 ? 'Loudest call' : `Busy · ${String(index + 1).padStart(2, '0')}`}
              </span>
              <span className="tailgate-popular__game">{game.label}</span>
              <strong className="tailgate-popular__title">{title}</strong>
              {side ? (
                <span className="tailgate-popular__lean">
                  <span className="tailgate-popular__side">{side.name}</span>
                  <span className="tailgate-popular__share">{side.share}%</span>
                  <span className="tailgate-popular__bar" aria-hidden="true">
                    <i style={{ width: `${Math.max(4, Math.min(100, side.share))}%` }} />
                  </span>
                </span>
              ) : null}
              <span className="tailgate-popular__foot">
                <span>{picks === 1 ? '1 pick on the lid' : `${picks} picks on the lid`}</span>
                <span className="tailgate-popular__go">Take a side →</span>
              </span>
            </a>
          </li>
        )
      })}
    </ol>
  )
}
