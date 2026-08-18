'use client'

import type { GameChip } from '../board'

export function LotGames({
  games,
  selected,
  onSelect,
}: {
  games: GameChip[]
  selected: string | null
  onSelect: (key: string | null) => void
}) {
  if (games.length === 0) return null

  return (
    <div className="tailgate-games">
      <span className="tailgate-games__label">Which game</span>
      <div className="tailgate-games__chips" aria-label="Which game">
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
        >
          Whole lot
        </button>
        {games.map((game) => (
          <button
            type="button"
            key={game.key}
            aria-pressed={selected === game.key}
            onClick={() => onSelect(game.key)}
          >
            {game.label}
          </button>
        ))}
      </div>
    </div>
  )
}
