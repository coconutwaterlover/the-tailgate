'use client'

import { useEffect, useRef, useState } from 'react'
import { fmtCompact } from '@prophecy-dev/venue-kit'

export function LotHeadcount({
  picks,
  showCount,
  loading,
  compact,
}: {
  picks: number
  showCount: boolean
  loading: boolean
  compact?: boolean
}) {
  const displayed = useTickingCount(showCount && !loading ? picks : 0)
  const label = loading
    ? 'counting chairs…'
    : showCount
      ? `${fmtCompact(displayed)} in the lot`
      : "the lot's just filling in"

  return (
    <p className={`tailgate-headcount${compact ? ' tailgate-headcount--compact' : ''}`} aria-live="polite">
      <span className="tailgate-headcount__pulse" aria-hidden="true" />
      <span className="tailgate-headcount__label">{label}</span>
    </p>
  )
}

function useTickingCount(target: number) {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(shown)
  shownRef.current = shown

  useEffect(() => {
    const start = shownRef.current
    if (start === target) return
    const delta = target - start
    const startedAt = performance.now()
    const duration = 720
    let frame = 0

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - (1 - t) * (1 - t)
      setShown(Math.round(start + delta * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return shown
}
