import type { ReactNode } from 'react'

function LightTower({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      className={`tailgate-header__tower tailgate-header__tower--${side}`}
      viewBox="0 0 44 58"
      aria-hidden="true"
    >
      <path d="M18 56 22 18 26 56M20 42h5M19 50h7" />
      <path d="M9 7h26v13H9zM13 7V3m9 4V3m9 4V3" />
      <g className="tailgate-header__bulbs">
        <circle cx="14" cy="12" r="1.8" />
        <circle cx="22" cy="12" r="1.8" />
        <circle cx="30" cy="12" r="1.8" />
        <circle cx="14" cy="17" r="1.8" />
        <circle cx="22" cy="17" r="1.8" />
        <circle cx="30" cy="17" r="1.8" />
      </g>
    </svg>
  )
}

export function TailgateHeader({
  walletSlot,
  presence,
}: {
  walletSlot?: ReactNode
  presence?: ReactNode
}) {
  return (
    <>
      <div className="tailgate-header__identity">
        <LightTower side="left" />
        <div className="tailgate-header__copy">
          <strong>The Tailgate</strong>
          <span>Lot open · Two hours to kickoff</span>
          {presence}
        </div>
        <LightTower side="right" />
      </div>
      {walletSlot ? <div className="tailgate-header__wallet">{walletSlot}</div> : null}
    </>
  )
}
