import { NFL_NICKNAMES, type CrowdEvent } from './crowd'

export type BoardEvent = CrowdEvent & { id: string }

export type GameChip = {
  key: string
  label: string
  heat: number
}

const OPEN_GAME = { key: 'open', label: 'Open lot' } as const

/** Hottest matchups first so the shot can prove the filter without a live three-game board. */
const SAMPLE_SPECS = [
  {
    title: 'Chiefs vs Bills',
    heat: 186,
    outcomes: [
      { index: 0, label: 'Kansas City Chiefs', price: 0.56 },
      { index: 1, label: 'Buffalo Bills', price: 0.44 },
    ],
  },
  {
    title: 'Bills keep the lid on',
    heat: 94,
    outcomes: [
      { index: 0, label: 'Buffalo Bills', price: 0.6 },
      { index: 1, label: 'Kansas City Chiefs', price: 0.4 },
    ],
  },
  {
    title: 'Eagles vs Cowboys',
    heat: 142,
    outcomes: [
      { index: 0, label: 'Philadelphia Eagles', price: 0.53 },
      { index: 1, label: 'Dallas Cowboys', price: 0.47 },
    ],
  },
  {
    title: 'Hurts finds the end zone',
    heat: 61,
    outcomes: [
      { index: 0, label: 'Philadelphia Eagles', price: 0.58 },
      { index: 1, label: 'Dallas Cowboys', price: 0.42 },
    ],
  },
  {
    title: 'Packers vs Lions',
    heat: 88,
    outcomes: [
      { index: 0, label: 'Green Bay Packers', price: 0.51 },
      { index: 1, label: 'Detroit Lions', price: 0.49 },
    ],
  },
  {
    title: 'Lions cover at home',
    heat: 37,
    outcomes: [
      { index: 0, label: 'Detroit Lions', price: 0.55 },
      { index: 1, label: 'Green Bay Packers', price: 0.45 },
    ],
  },
] as const

export const MORE_STACK = 4
export const GAME_CHIP_CAP = 6

/** Same heat the lot tally and chatter already read: how many picks landed on the call. */
export function sortByHeat<T extends BoardEvent>(events: readonly T[]): T[] {
  return [...events].sort((a, b) => (b.tradeCount ?? 0) - (a.tradeCount ?? 0) || a.id.localeCompare(b.id))
}

export function gameOf(event: BoardEvent): { key: string; label: string } {
  const teams = teamsIn(event)
  if (teams.length >= 2) {
    const display = teams.slice(0, 2)
    return {
      key: [...display].sort().join('|'),
      label: `${display[0]}–${display[1]}`,
    }
  }
  if (teams.length === 1 && teams[0]) return { key: teams[0], label: teams[0] }
  return OPEN_GAME
}

export function gameChips(events: readonly BoardEvent[]): GameChip[] {
  const byKey = new Map<string, GameChip>()
  for (const event of events) {
    const game = gameOf(event)
    const current = byKey.get(game.key)
    const heat = event.tradeCount ?? 0
    if (current) current.heat += heat
    else byKey.set(game.key, { key: game.key, label: game.label, heat })
  }
  return [...byKey.values()].sort((a, b) => b.heat - a.heat || a.label.localeCompare(b.label)).slice(0, GAME_CHIP_CAP)
}

export function filterByGame<T extends BoardEvent>(events: readonly T[], gameKey: string | null): T[] {
  if (!gameKey) return [...events]
  return events.filter((event) => gameOf(event).key === gameKey)
}

export function decorateBoard<T extends BoardEvent>(events: readonly T[], preview: boolean): T[] {
  if (!preview) return sortByHeat(events)
  const template = events[0]
  if (!template) return sortByHeat(events)
  const extras = SAMPLE_SPECS.map((spec, index) => ({
    ...template,
    id: `${template.id}-lot-${index}`,
    title: spec.title,
    name: spec.title,
    tradeCount: spec.heat,
    outcomes: spec.outcomes.map((outcome) => ({ ...outcome })),
    odds: spec.outcomes.map((outcome) => outcome.price),
  })) as T[]
  return sortByHeat([...extras, ...events])
}

export function shouldPreviewBoard(): boolean {
  if (typeof window === 'undefined') return false
  const query = new URLSearchParams(window.location.search)
  if (query.get('board') === 'sample' || query.get('crowd') === 'sample') return true
  return Boolean(navigator.webdriver)
}

function teamsIn(event: BoardEvent): string[] {
  const text = [event.title, event.name, ...(event.outcomes ?? []).map((outcome) => outcome.label)].join(' ')
  const found: Array<{ name: string; at: number }> = []
  for (const nickname of NFL_NICKNAMES) {
    const at = text.indexOf(nickname)
    if (at >= 0) found.push({ name: nickname, at })
  }
  return found.sort((left, right) => left.at - right.at).map((team) => team.name)
}
