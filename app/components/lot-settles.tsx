'use client'

import { countdown, formatDeadline } from '@prophecy-dev/venue-kit'

/**
 * HOW THIS CALL SETTLES — AND IT SITS AT THE TOP.
 *
 * Demo feedback (Sep 1): "how the market resolves is below in the bottom bottom bottom… unless he
 * scrolls down till the bottom there is no info about that." It was a collapsed `<details>` under
 * the activity feed, which is the same as not being there. So it is the first thing under the
 * headline now, open, in plain words: what makes the call right, what makes it wrong, when it
 * closes, and when it settles.
 *
 * Everything here is already ON the market — `criteria` is the market's own resolution text and
 * `caliber` is its rating. The full per-criterion rating stays behind a disclosure inside this
 * panel: almost nobody wants it, and the few who do want all of it.
 */

export interface Caliber {
  status?: string | null
  band?: string | null
  definition?: string | null
  detailUrl?: string | null
  criteria?: Array<{ key: string; name: string; status: string; summary?: string | null }> | null
}

export interface SettlesMarket {
  closesAt?: number | null
  resolvesAt?: number | null
  criteria?: {
    yes?: string | null
    no?: string | null
    void?: string | null
    text?: string | null
  } | null
  caliber?: Caliber | null
}

const LEAD =
  'The arbiter settles this on the answer to the call below, read off published sources. The ones it used land in the final word once the whistle blows.'

export function LotSettles({ market }: { market: SettlesMarket }) {
  const rules = market.criteria ?? null
  const caliber = market.caliber ?? null
  const rated = caliber?.status === 'rated'
  const ratedCriteria = (rated ? caliber?.criteria : null) ?? []
  // Most live calls carry no resolution prose at all — `criteria.text` and `caliber.definition` are
  // both null on the board today — so the lead says the mechanism and lets the rating rows below
  // carry what is specific to this call. It does NOT restate the question: the market's own
  // headline is the next thing on the page.
  const lead = rules?.text || (rated ? caliber?.definition : null) || LEAD
  // A gate that did not pass is the one thing in the rating anybody needs to know before they call
  // it, so it is not left inside the disclosure on its own.
  const failed = ratedCriteria.filter((criterion) => criterion.status !== 'pass')

  return (
    <section className="lot-settles" aria-labelledby="lot-settles-title">
      <div className="lot-settles__head">
        <span>Chalked on the back of the sign</span>
        <h2 id="lot-settles-title">How this call settles</h2>
        {rated && caliber?.band ? <em>Rated {caliber.band}</em> : null}
      </div>

      <p className="lot-settles__lead">{lead}</p>

      {rules?.yes || rules?.no || rules?.void ? (
        <dl className="lot-settles__rules">
          {rules?.yes ? (
            <div data-tone="right">
              <dt>Right if</dt>
              <dd>{rules.yes}</dd>
            </div>
          ) : null}
          {rules?.no ? (
            <div data-tone="wrong">
              <dt>Wrong if</dt>
              <dd>{rules.no}</dd>
            </div>
          ) : null}
          {rules?.void ? (
            <div data-tone="off">
              <dt>Called off if</dt>
              <dd>{rules.void}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {failed.length > 0 ? (
        <p className="lot-settles__flag">
          {failed.length === 1
            ? `One check on this call did not pass: ${failed[0]?.summary ?? failed[0]?.name}`
            : `${failed.length} checks on this call did not pass — open the arbiter’s notes below.`}
        </p>
      ) : null}

      <div className="lot-settles__clock">
        {market.closesAt ? (
          <span>
            <strong>Calls close</strong> {countdown(market.closesAt, 'closed')} · {formatDeadline(market.closesAt)}
          </span>
        ) : null}
        {market.resolvesAt ? (
          <span>
            <strong>Settles</strong> {formatDeadline(market.resolvesAt)}
          </span>
        ) : null}
      </div>

      {ratedCriteria.length > 0 || caliber?.detailUrl ? (
        <details className="venue-resolution">
          <summary>What the arbiter checked</summary>
          <ul className="venue-resolution__criteria">
            {ratedCriteria.map((criterion) => (
              <li key={criterion.key} data-status={criterion.status}>
                <strong>{criterion.name}</strong> {criterion.summary}
              </li>
            ))}
          </ul>
          {caliber?.detailUrl ? (
            <a href={caliber.detailUrl} target="_blank" rel="noreferrer noopener">
              Full rating on Caliber ↗
            </a>
          ) : null}
        </details>
      ) : null}
    </section>
  )
}
