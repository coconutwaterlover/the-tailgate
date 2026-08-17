import type { Metadata } from 'next'
import { parseMarketId } from '@prophecy-dev/connect-sdk'
import { MarketView } from './market-view'

// THE SEGMENT MAY CARRY A SLUG. Links into this route are `/m/{id}-{slug}` (see `marketPath`), so
// the raw segment is NOT an id — handing it to the API straight would look up "0xabc…-will-bitcoin"
// and get nothing. `parseMarketId` reads the leading id back out and returns null for anything that
// is not one, which is also what keeps a fragment of somebody's title from reaching a lookup.
//
// The slug is DECORATIVE, and deliberately: a stale slug, a bare id and the current slug all resolve
// to the same page, so regenerating one when the oracle rewrites a title costs nothing and breaks no
// existing link.
function idFrom(raw: string): string {
  return parseMarketId(decodeURIComponent(raw)) ?? raw
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: "The Tailgate · market",
    description: "Predict on this market at The Tailgate.",
    // CANONICAL IS THE BARE ID. One page, one canonical — otherwise every title rewrite mints a
    // second URL for the same market and they compete with each other in search.
    alternates: { canonical: `/m/${idFrom(id)}` },
  }
}

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MarketView id={idFrom(id)} />
}
