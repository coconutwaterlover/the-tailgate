'use client'

import { type PointerEvent, type ReactNode, useRef } from 'react'
import { FeaturedMarket, marketPath } from '@prophecy-dev/venue-kit'
import type { BoardEvent } from '../board'

export function LotQueue({
  calls,
  index,
  onIndex,
  emptyState,
}: {
  calls: BoardEvent[]
  index: number
  onIndex: (index: number) => void
  emptyState: ReactNode
}) {
  const current = calls[index] ?? null
  const startX = useRef<number | null>(null)
  const total = calls.length
  const atStart = index <= 0
  const atEnd = index >= total - 1

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('button, a')) return
    startX.current = event.clientX
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (startX.current == null) return
    const delta = event.clientX - startX.current
    startX.current = null
    if (delta <= -48) go(index + 1)
    if (delta >= 48) go(index - 1)
  }

  function go(next: number) {
    if (total === 0) return
    onIndex(Math.max(0, Math.min(total - 1, next)))
  }

  return (
    <div
      className="tailgate-queue"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        startX.current = null
      }}
    >
      {current ? (
        <FeaturedMarket
          event={current as never}
          cardHref={(event) => marketPath(event.id, event.title ?? event.name, '/m')}
        />
      ) : (
        emptyState
      )}
      {total > 0 ? (
        <div className="tailgate-queue__nav">
          <button type="button" onClick={() => go(index - 1)} disabled={atStart}>
            Last call
          </button>
          <span aria-live="polite">
            Call {index + 1} of {total}
          </span>
          <button type="button" className="tailgate-queue__next" onClick={() => go(index + 1)} disabled={atEnd}>
            Next call
          </button>
        </div>
      ) : null}
    </div>
  )
}
