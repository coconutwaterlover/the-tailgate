'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets'
import { somnia } from 'viem/chains'
import { useProphecy, useWallet, UserBadge, WalletBalance } from '@prophecy-dev/connect-react'
import { pct, short } from '@prophecy-dev/venue-kit'

const VENUE_CHAIN_ID = somnia.id

const CHAINS: Record<number, { label: string; network: string; explorer: string }> = {
  5031: {
    label: 'Somnia',
    network: 'Mainnet',
    explorer: 'https://explorer.somnia.network',
  },
  50312: {
    label: 'Somnia Shannon',
    network: 'Testnet',
    explorer: 'https://shannon-explorer.somnia.network',
  },
}

const chip = {
  font: 'inherit',
  fontSize: 12,
  padding: '4px 10px',
  cursor: 'pointer',
  color: 'var(--pc-text)',
  border: '1px solid var(--pc-border)',
  borderRadius: 'var(--pc-radius)',
  background: 'transparent',
} as const

export function WalletButton() {
  // Privy mounts client-only (see Providers), so this cannot call usePrivy on the server or on the
  // first client render — the hook throws without its provider above it.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <WalletButtonInner />
}

function WalletButtonInner() {
  const { ready, authenticated, login } = usePrivy()
  if (!ready) return null
  if (!authenticated) {
    return (
      <button onClick={() => login()} style={{ ...chip, background: 'var(--pc-accent)', color: 'var(--pc-onaccent)' }}>
        Sign in
      </button>
    )
  }
  return <WalletChair />
}

function WalletChair() {
  const { user, logout } = usePrivy()
  const { owner, isReady, session } = useProphecy()
  const { client } = useSmartWallets()
  const { profile } = useWallet(owner)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const addr =
    owner ??
    (user?.linkedAccounts?.find((a) => (a as { type?: string }).type === 'smart_wallet') as { address?: string } | undefined)
      ?.address ??
    session?.wallet ??
    null

  const walletChainId = client?.chain?.id ?? null
  const chain = walletChainId != null ? CHAINS[walletChainId] : null
  const venueChain = CHAINS[VENUE_CHAIN_ID]
  const onVenueChain = walletChainId === VENUE_CHAIN_ID
  const signer = session?.wallet && owner && session.wallet.toLowerCase() !== owner.toLowerCase() ? session.wallet : null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  const copyAddr = () => {
    if (!addr) return
    void navigator.clipboard.writeText(addr).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  const explorer =
    addr && (chain ?? venueChain) ? `${(chain ?? venueChain).explorer}/address/${addr}` : null

  return (
    <div className="tailgate-header__session" ref={rootRef}>
      <WalletBalance wallet={owner} claim className="tailgate-wallet-balance" />
      <span
        className={`tailgate-chain-pill${walletChainId != null && !onVenueChain ? ' tailgate-chain-pill--warn' : ''}`}
      >
        {walletChainId == null
          ? 'Wallet warming…'
          : `${chain?.network ?? 'Chain'} · ${walletChainId}`}
      </span>
      <button
        type="button"
        style={chip}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {addr ? short(addr) : 'Your chair'}
      </button>
      {open ? (
        <section id={panelId} className="tailgate-wallet-panel" aria-label="Wallet details">
          <header className="tailgate-wallet-panel__head">
            <span>Your chair</span>
            <strong>What this wallet is holding and where it is signed in.</strong>
          </header>
          <UserBadge wallet={owner} showAddress className="tailgate-wallet-panel__badge" />
          <dl className="tailgate-wallet-panel__rows">
            <div>
              <dt>PST on the cooler</dt>
              <dd>
                <WalletBalance wallet={owner} className="tailgate-wallet-balance" />
              </dd>
            </div>
            <div>
              <dt>Smart wallet</dt>
              <dd>
                <code>{addr ?? '—'}</code>
                <button type="button" onClick={copyAddr} disabled={!addr}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </dd>
            </div>
            {signer ? (
              <div>
                <dt>Signer</dt>
                <dd>
                  <code>{signer}</code>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Connected network</dt>
              <dd className={walletChainId != null && !onVenueChain ? 'tailgate-wallet-panel__warn' : undefined}>
                {walletChainId == null
                  ? 'Waiting on the smart wallet…'
                  : `${chain?.label ?? 'Unknown chain'} · ${chain?.network ?? 'unlisted'} · id ${walletChainId}`}
              </dd>
            </div>
            <div>
              <dt>This lot</dt>
              <dd>
                {venueChain.label} · {venueChain.network} · id {VENUE_CHAIN_ID}
              </dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>
                {isReady ? 'Ready to call' : 'Warming up'}
                {session?.venueId ? ` · ${session.venueId}` : ''}
                {session?.method ? ` · ${session.method}` : ''}
              </dd>
            </div>
            {profile ? (
              <>
                <div>
                  <dt>Open calls</dt>
                  <dd>{profile.positionCount}</dd>
                </div>
                <div>
                  <dt>Record</dt>
                  <dd>
                    {profile.wins}/{profile.resolvedMarkets} right
                    {profile.winRate != null ? ` · ${pct(profile.winRate)}` : ''}
                    {profile.streak ? ` · streak ${profile.streak}` : ''}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
          {!onVenueChain && walletChainId != null ? (
            <p className="tailgate-wallet-panel__warn" role="status">
              This chair is signed onto {chain?.network ?? `chain ${walletChainId}`}. The lot is{' '}
              {venueChain.network}. Sign out and back in if a call will not go through.
            </p>
          ) : null}
          <footer className="tailgate-wallet-panel__actions">
            {explorer ? (
              <a href={explorer} target="_blank" rel="noreferrer">
                Open explorer
              </a>
            ) : null}
            <button type="button" onClick={() => void logout()}>
              Sign out
            </button>
          </footer>
        </section>
      ) : null}
    </div>
  )
}
