import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { cdnAdapter } from '@vinext/cloudflare/cache/cdn-adapter'

// Canonical Cloudflare setup (what `vinext init --platform=cloudflare` prescribes). Verified the hard way:
//  - do NOT add @vitejs/plugin-rsc here: vinext auto-registers it when it detects app/, and a duplicate
//    registration HARD-FAILS the build. It must still be INSTALLED (vinext declares it as a peer).
//  - cloudflare() IS required, and viteEnvironment names the WORKER environment.
export default defineConfig({
  plugins: [
    vinext({ cache: { cdn: cdnAdapter() } }),
    cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } }),
  ],
  // `cloudflare:workers` is a virtual module only resolvable inside workerd.
  build: { rollupOptions: { external: ['cloudflare:workers'] } },
  // WITHOUT THIS, `npm run dev` DIES BEFORE THE VENUE RENDERS:
  //   The requested module '/node_modules/pino/browser.js' does not provide an export named 'default'
  // `pino` arrives transitively (Privy -> WalletConnect) as CJS, and Vite's dev transform will not
  // interop it unless it is pre-bundled. The production build is unaffected, which is what makes this
  // nasty: `npm run build` and deploy both succeed while the creator's dev loop — and the loop their
  // agent iterates in — is broken. Verified fixed in a browser against a clean scaffold, 2026-08-05.
  optimizeDeps: { include: ['pino'] },
})
