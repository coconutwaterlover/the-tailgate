'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import { useCheckoutEvents, type CheckoutEvent } from '@prophecy-dev/connect-react'

const EXPLORER = 'https://explorer.somnia.network'
const LAST_CALL_KEY = 'the-tailgate:last-call'
const LAST_CALL_EVENT = 'tailgate:last-call'
const HOLD_MS = 20_000

export type LastCall = {
  hash: string
  headline: string
  at: number
}

type Notice = {
  id: number
  tone: 'ok' | 'bad' | 'dim'
  headline: string
  detail: string
  hash?: string
}

function sideLabel(index: number) {
  return index === 0 ? 'Yes' : 'No'
}

function readLastCall(): LastCall | null {
  try {
    const raw = sessionStorage.getItem(LAST_CALL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastCall
    if (!parsed?.hash || !parsed.headline) return null
    return parsed
  } catch {
    return null
  }
}

export function rememberCall(call: LastCall) {
  try {
    sessionStorage.setItem(LAST_CALL_KEY, JSON.stringify(call))
    window.dispatchEvent(new CustomEvent(LAST_CALL_EVENT))
  } catch {
    // Private mode can refuse storage; the toast still shows the hash.
  }
}

export function useLastCall() {
  const [call, setCall] = useState<LastCall | null>(null)
  useEffect(() => {
    const sync = () => setCall(readLastCall())
    sync()
    window.addEventListener(LAST_CALL_EVENT, sync)
    return () => window.removeEventListener(LAST_CALL_EVENT, sync)
  }, [])
  return call
}

function explorerTx(hash: string) {
  return `${EXPLORER}/tx/${hash}`
}

function noticeFromEvent(e: CheckoutEvent): Notice | null {
  switch (e.type) {
    case 'settled': {
      const side = sideLabel(e.outcomeIndex)
      const headline =
        e.mode === 'sell' ? `You closed your ${side}` : `${side} is on the record`
      return {
        id: 0,
        tone: 'ok',
        headline,
        detail: e.txHash
          ? 'The call landed on Somnia mainnet. This hash is the receipt — not an error.'
          : 'The call landed on Somnia mainnet.',
        hash: e.txHash,
      }
    }
    case 'failed':
      if (e.cause === 'unfilled') {
        return {
          id: 0,
          tone: 'dim',
          headline: 'Nothing moved',
          detail: e.reason || 'Prices moved before it landed, so nothing was spent. Try the call again.',
        }
      }
      return {
        id: 0,
        tone: 'bad',
        headline: 'The call did not land',
        detail: e.reason,
      }
    case 'action.settled':
      return {
        id: 0,
        tone: 'ok',
        headline: e.title,
        detail: e.txHashes[0]
          ? 'That action landed on Somnia mainnet. This hash is the receipt.'
          : 'That action landed on Somnia mainnet.',
        hash: e.txHashes[0],
      }
    case 'action.failed':
      return {
        id: 0,
        tone: 'bad',
        headline: e.title,
        detail: e.reason,
      }
    case 'cancelled':
    case 'action.cancelled':
      return {
        id: 0,
        tone: 'dim',
        headline: 'You backed out',
        detail: 'Nothing was sent.',
      }
    default:
      return null
  }
}

export function TailgateCallNotice() {
  const [notices, setNotices] = useState<Notice[]>([])
  const liveId = useId()

  const push = useCallback((n: Omit<Notice, 'id'>) => {
    const id = Date.now()
    setNotices((prev) => [...prev.slice(-2), { ...n, id }])
    if (n.hash) {
      rememberCall({ hash: n.hash, headline: n.headline, at: Date.now() })
    }
    window.setTimeout(() => {
      setNotices((prev) => prev.filter((x) => x.id !== id))
    }, HOLD_MS)
  }, [])

  useCheckoutEvents((e) => {
    const next = noticeFromEvent(e)
    if (next) push(next)
  })

  if (!notices.length) return null

  return (
    <div className="tailgate-call-notices" role="status" aria-live="polite" aria-labelledby={liveId}>
      <span id={liveId} className="tailgate-call-notices__sr">
        Call receipts
      </span>
      {notices.map((n) => (
        <CallCard
          key={n.id}
          notice={n}
          onDismiss={() => setNotices((prev) => prev.filter((x) => x.id !== n.id))}
        />
      ))}
    </div>
  )
}

function CallCard({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  const copyHash = () => {
    if (!notice.hash) return
    void navigator.clipboard.writeText(notice.hash).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <article className={`tailgate-call-notice tailgate-call-notice--${notice.tone}`}>
      <header>
        <span>{notice.tone === 'ok' ? 'Receipt' : notice.tone === 'bad' ? 'Did not land' : 'Note'}</span>
        <strong>{notice.headline}</strong>
      </header>
      <p>{notice.detail}</p>
      {notice.hash ? (
        <div className="tailgate-call-notice__hash">
          <span>Transaction hash</span>
          <code>{notice.hash}</code>
          <div className="tailgate-call-notice__hash-actions">
            <button type="button" onClick={copyHash}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a href={explorerTx(notice.hash)} target="_blank" rel="noreferrer">
              Open explorer
            </a>
          </div>
        </div>
      ) : null}
      <button type="button" className="tailgate-call-notice__dismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </article>
  )
}
