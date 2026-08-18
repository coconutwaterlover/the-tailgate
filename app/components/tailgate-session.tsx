'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useProphecy, WalletBalance } from '@prophecy-dev/connect-react'

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
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { owner } = useProphecy()
  if (!ready) return null
  const addr =
    owner ??
    (user?.linkedAccounts?.find((a) => (a as { type?: string }).type === 'smart_wallet') as { address?: string } | undefined)
      ?.address ??
    null
  return authenticated ? (
    <div className="tailgate-header__session">
      <WalletBalance wallet={owner} claim className="tailgate-wallet-balance" />
      <button onClick={() => void logout()} style={chip}>
        {addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : 'Signed in'} · Sign out
      </button>
    </div>
  ) : (
    <button onClick={() => login()} style={{ ...chip, background: 'var(--pc-accent)', color: 'var(--pc-onaccent)' }}>
      Sign in
    </button>
  )
}
