'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { PrivyProvider, useIdentityToken, usePrivy, useWallets } from '@privy-io/react-auth'
import { SmartWalletsProvider, useSmartWallets } from '@privy-io/react-auth/smart-wallets'
import { createPublicClient, http } from 'viem'
import { somniaTestnet } from 'viem/chains'
import { ConnectProvider, ProphecyCheckout, ProphecyProvider, type Wallet } from '@prophecy-dev/connect-react'
import { NETWORKS, pst, type ChainReader } from '@prophecy-dev/connect-sdk'

// ONE NAME FOR THE NETWORK, and everything else derived from it.
//
// This used to be four independent literals — `API`, `GATEWAY`, `NETWORK` and the viem chain — and
// the comments below are the scars: a venue read testnet markets while minting sessions against the
// MAINNET gateway, and the chain was separately hardcoded to mainnet while `API` switched. Nothing
// made them agree; they agreed only while whoever edited them remembered all four.
//
// `NETWORKS` is Connect's single row per network (SOC-539, exported by connect-sdk), which exists
// for exactly this: "a venue carries five things that must agree, and holding four of them in four
// places is what produced four separate renders-fine-talks-to-the-wrong-server incidents". Switching
// this venue between networks is now ONE word.
const NETWORK = "testnet" as const
const NET = NETWORKS[NETWORK]
const API = NET.apiUrl
const GATEWAY = NET.gatewayUrl
const VENUE_ID = "the-tailgate"
// What this build READS markets through. Its own venue once launched; the platform venue before then,
// because an unregistered venue id is refused and an empty board is not a preview of anything.
const READ_VENUE_ID = "the-tailgate"
// THE ONE CONSTANT HERE THAT IS NOT NETWORK-SHAPED, and it says so because otherwise it gets asked
// about. Everything around it either derives from `NETWORK` or asserts against it, and the note on
// the chain says the two MUST match — so a reader reasonably infers the whole neighbourhood is
// network-sensitive and escalates "is Privy configured for mainnet?" to a human. It isn't and it
// doesn't need to be: ONE Privy app serves both networks, it is already configured for both, and
// nothing here changes when `NETWORK` does. Nobody needs to check.
const PRIVY_APP_ID = "cmo2sszq800qd0bl7mqtdv4zp"
// THE CHAIN IS THE ONE THING STILL WRITTEN TWICE, because viem wants an object and `NET` carries an
// id. So it is asserted rather than trusted: a chain that does not match the network fails at import
// with a message naming both, instead of a venue that reads one chain and signs on another.
if (somniaTestnet.id !== NET.chainId) {
  throw new Error(
    `venue misconfigured: NETWORK "${NETWORK}" is chain ${NET.chainId}, but the imported viem chain is ${somniaTestnet.id}`,
  )
}
// The venue's own Connect key. Empty when the venue has not been issued one (it still works —
// reads are anonymous and sponsorship falls back to user-pays); present, it rides EVERY call.
//
// Passed on as `API_KEY || null`, and the null is load-bearing rather than tidy: the SDK reads
// `undefined` as "nobody decided" and logs a keyless warning, `null` as "deliberately keyless" and
// stays quiet. A generated venue that has not been issued a key is the second case — there is no
// env var its operator forgot to set — so `undefined` would put a warning in the console of every
// such venue with nothing anyone could do about it.
const API_KEY = ""

// The brand, emitted from the venue spec. ONE ProphecyTheme re-skins the entire kit.
const THEME = {
  "accent": "#c94d34",
  "surface": "#f3ecd6",
  "inner": "#d6b77d",
  "border": "#615942",
  "text": "#2d2d25",
  "gain": "#2d7a51",
  "yes": "#2d7a51",
  "danger": "#b83a2f",
  "no": "#b83a2f",
  "radius": "2px",
  "brand": "The Tailgate",
  "onAccent": "#fff8e6",
  "zIndex": 9000
} as const
// MUST match the brand, or a dark brand renders gray-on-white under a light OS.
const COLOR_SCHEME = "light" as const

// THE CHAIN MUST MATCH THE NETWORK ABOVE. This was hardcoded to viem's `somnia` (5031, mainnet)
// while API/GATEWAY switched on the venue's network — so a testnet venue read its markets from
// testnet and every chain-level operation from MAINNET. It fails the way that costs an evening: the
// board fills, the venue looks right, and the checkout silently never opens, because the default
// trade adapter resolved to the wrong chain's contracts. Reported from a real venue before this was
// found. A reader that THROWS also locks the checkout path, so this must be a real client.
const reader: ChainReader = createPublicClient({ chain: somniaTestnet, transport: http() })

/** Privy smart wallet -> Connect `Wallet`. The only wallet-specific glue a venue writes. */
function WithPrivy({ children }: { children: ReactNode }) {
  const { user, getAccessToken } = usePrivy()
  const { identityToken } = useIdentityToken()
  const { wallets } = useWallets()
  const { client } = useSmartWallets()

  const address =
    (user?.linkedAccounts?.find((a) => (a as { type?: string }).type === 'smart_wallet') as { address?: string } | undefined)
      ?.address ??
    wallets[0]?.address ??
    null

  const wallet = useMemo<Wallet>(
    () => ({
      address,
      getToken: () => getAccessToken(),
      getIdentityToken: async () => identityToken ?? null,
      executor: client
        ? {
            send: async (calls) => {
              const req: any = calls.length === 1 ? { chain: somniaTestnet, to: calls[0]!.to, data: calls[0]!.data } : { calls }
              return { txHash: (await client.sendTransaction(req)) as string }
            },
          }
        : null,
    }),
    [address, client, getAccessToken, identityToken],
  )

  return (
    <ProphecyProvider
      venueId={READ_VENUE_ID}
      gatewayUrl={GATEWAY}
      // THE DATA PLANE, AND IT DEFAULTS TO MAINNET WITHOUT THIS. <ProphecyProvider> uses `apiUrl` for
      // the social connector mirror and analytics, and its default is api.prophecyhosting.com — so a
      // TESTNET venue that omits it signs a visitor in against testnet and then calls MAINNET for
      // /v1/social/*, which answers 401 for a session it has never seen. Seen live: follow, posts and
      // profile all failing on a working venue, plus a CORS error on analytics, with nothing on the
      // page suggesting the wrong host.
      //
      // This is the FOURTH network-shaped constant to be missed at a fourth site (GATEWAY, the viem
      // chain, the provider network, now this). Same lesson each time: every one of them has to switch
      // together, and the venue looks completely healthy while any single one is wrong.
      apiUrl={API}
      apiKey={API_KEY || null}
      // Steers the DEFAULT trade adapter at the right chain's contracts. Without it the adapter
      // resolves to mainnet whatever the reader says, and the checkout never opens on testnet —
      // the venue looks entirely healthy right up until someone tries to trade.
      network={NETWORK}
      wallet={wallet}
      reader={reader}
      theme={THEME}
      colorScheme={COLOR_SCHEME}
      stake={pst(25)}
    >
      {children}
      {/* The {c} drawer — mount once, or predict silently no-ops. */}
      <ProphecyCheckout />
    </ProphecyProvider>
  )
}

/**
 * Privy cannot be server-rendered: a venue with <PrivyProvider> in the tree returns 500 from
 * vinext's error shell (bisected 2026-07-20 — ConnectProvider alone renders, PrivyProvider alone
 * does not, on both 3.34.0 and 3.35.1). So the tree is SPLIT: ConnectProvider server-renders, which
 * keeps the shell, title and OG card in the HTML — the reason this app is on vinext at all — and
 * the wallet/checkout stack mounts after hydration.
 */
function ClientOnly({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return <>{mounted ? children : fallback}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConnectProvider baseUrl={API} apiKey={API_KEY || null} timeoutMs={4000}>
    <ClientOnly fallback={children}>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: { theme: COLOR_SCHEME },
        // Headless signing — the {c} drawer stays the only confirm surface.
        embeddedWallets: { showWalletUIs: false, ethereum: { createOnLogin: 'users-without-wallets' } },
        defaultChain: somniaTestnet,
        supportedChains: [somniaTestnet],
      }}
    >
      <SmartWalletsProvider>
        <WithPrivy>{children}</WithPrivy>
      </SmartWalletsProvider>
    </PrivyProvider>
    </ClientOnly>
    </ConnectProvider>
  )
}
