import { pct } from '@prophecy-dev/venue-kit'

/**
 * Crowd presence is DISPLAY only. Pick counts and splits already ride on each Event from
 * useVenueMarkets (`tradeCount`, outcome prices). This file turns those into overheard lines
 * and a lot tally — it does not fetch, quote, or trade.
 */

export type CrowdEvent = {
  id: string
  title?: string | null
  name?: string | null
  tradeCount?: number
  outcomes?: Array<{ index: number; label: string; price: number | null }>
  odds?: number[] | null
}

export type CrowdPresence = {
  picks: number
  /** True when the number is large enough to read as a tally, not a lonely click. */
  showCount: boolean
  lines: string[]
  sample: boolean
}

/** Used only when the board has no picks yet and we still need to see the panels (Playwright shots, `?crowd=sample`). */
export const SAMPLE_CROWD_EVENTS: CrowdEvent[] = [
  {
    id: 'sample-chiefs-bills',
    title: 'Chiefs vs Bills',
    tradeCount: 128,
    outcomes: [
      { index: 0, label: 'Kansas City Chiefs', price: 0.5 },
      { index: 1, label: 'Buffalo Bills', price: 0.5 },
    ],
  },
  {
    id: 'sample-bills-lean',
    title: 'Bills keep it close',
    tradeCount: 54,
    outcomes: [
      { index: 0, label: 'Buffalo Bills', price: 0.6 },
      { index: 1, label: 'Other', price: 0.4 },
    ],
  },
  {
    id: 'sample-steelers',
    title: 'Steelers on Sunday',
    tradeCount: 32,
    outcomes: [
      { index: 0, label: 'Pittsburgh Steelers', price: 0.64 },
      { index: 1, label: 'Other', price: 0.36 },
    ],
  },
]

const NFL_NICKNAMES = new Set([
  'Cardinals',
  'Falcons',
  'Ravens',
  'Bills',
  'Panthers',
  'Bears',
  'Bengals',
  'Browns',
  'Cowboys',
  'Broncos',
  'Lions',
  'Packers',
  'Texans',
  'Colts',
  'Jaguars',
  'Chiefs',
  'Raiders',
  'Chargers',
  'Rams',
  'Dolphins',
  'Vikings',
  'Patriots',
  'Saints',
  'Giants',
  'Jets',
  'Eagles',
  'Steelers',
  '49ers',
  'Seahawks',
  'Buccaneers',
  'Titans',
  'Commanders',
])

const GENERIC_SIDES = new Set(['yes', 'no', 'other', 'over', 'under'])

/** Below this, a number reads as a vacant lot, not a crowd. */
const COUNT_FLOOR = 12
/** Below this, a split is a couple of chairs, not "the lot". */
const SPLIT_FLOOR = 8

export function pickTotal(events: readonly CrowdEvent[]): number {
  return events.reduce((sum, event) => sum + (event.tradeCount ?? 0), 0)
}

export function crowdPresence(events: readonly CrowdEvent[], sample = false): CrowdPresence {
  const source = sample ? SAMPLE_CROWD_EVENTS : events
  const picks = pickTotal(source)
  return {
    picks,
    showCount: picks >= COUNT_FLOOR,
    lines: chatterLines(source),
    sample,
  }
}

export function chatterLines(events: readonly CrowdEvent[]): string[] {
  const lines: string[] = []
  const seen = new Set<string>()
  for (const event of events) {
    const line = lineForMarket(event)
    if (!line || seen.has(line)) continue
    seen.add(line)
    lines.push(line)
  }
  if (lines.length === 0) return lines
  if (lines.length >= 3) return lines
  return [
    ...lines,
    "grill's going",
    "chairs are out if you want one",
  ]
}

function lineForMarket(event: CrowdEvent): string | null {
  const picks = event.tradeCount ?? 0
  if (picks <= 0) return null

  const side = leadingSide(event)
  if (!side || GENERIC_SIDES.has(side.name.toLowerCase())) {
    return hashPick(event.id, [
      'a few chairs just filled in on this one',
      'the cooler picked up another call',
      "someone just slapped a name on the lid",
    ])
  }

  if (picks < SPLIT_FLOOR) {
    return hashPick(event.id, [
      `a couple of chairs just called ${side.name}`,
      `${side.name} just got a name on the cooler`,
      `early call on ${side.name} — lot's still filling in`,
    ])
  }

  const { name, share, rest } = side
  if (share >= 48 && share <= 52) {
    return hashPick(event.id, [
      `half the lot's on ${name}`,
      `lot's split down the middle on ${name}`,
      `chairs are 50/50 on ${name}`,
    ])
  }
  if (share >= 70) {
    return hashPick(event.id, [
      `most of the lot's calling ${name}`,
      `${name}'s got the noise right now`,
      `cooler's packed on ${name}`,
    ])
  }
  return hashPick(event.id, [
    `cooler's leaning ${name}, ${share}/${rest}`,
    `${name} has the chairs, ${share}/${rest}`,
    `lot's tilting ${name}, ${share}/${rest}`,
  ])
}

function leadingSide(event: CrowdEvent): { name: string; share: number; rest: number } | null {
  const outcomes = event.outcomes ?? []
  if (outcomes.length < 2) return null

  const priced = outcomes.map((outcome) => {
    const price = event.odds?.[outcome.index] ?? outcome.price ?? null
    return { label: outcome.label, percent: pct(price) }
  })
  if (priced.some((row) => row.percent == null)) return null

  const ranked = [...priced].sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
  const leader = ranked[0]
  if (!leader || leader.percent == null) return null

  const share = leader.percent
  const rest = Math.max(0, 100 - share)
  const name = shortSide(leader.label, event.title ?? event.name)
  if (!name) return null
  return { name, share, rest }
}

function shortSide(label: string, title?: string | null): string {
  const trimmed = label.trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  if (GENERIC_SIDES.has(lower)) {
    const fromTitle = teamFromTitle(title)
    if (fromTitle) return lower === 'yes' ? fromTitle : trimmed
    return trimmed
  }
  const words = trimmed.split(/\s+/)
  const last = words[words.length - 1]
  if (last && NFL_NICKNAMES.has(last)) return last
  if (trimmed.length > 22) return words.slice(-2).join(' ')
  return trimmed
}

function teamFromTitle(title?: string | null): string | null {
  if (!title) return null
  for (const nickname of NFL_NICKNAMES) {
    if (title.includes(nickname)) return nickname
  }
  return null
}

function hashPick(id: string, options: string[]): string {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return options[Math.abs(hash) % options.length] ?? options[0]!
}

export function shouldPreviewSampleCrowd(): boolean {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).get('crowd') === 'sample') return true
  return Boolean(navigator.webdriver)
}
