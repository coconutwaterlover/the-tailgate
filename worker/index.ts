import handler from 'vinext/server/app-router-entry'

// `Fetcher` and `ExecutionContext` are workerd globals, declared here rather than pulled in with
// @cloudflare/workers-types — that package redefines a large part of the DOM lib this app also needs
// (it is a browser app as well as a worker), and the conflict is worse than two interfaces. Only the
// members this file uses are declared. `Fetcher` was the one left out, so a fresh scaffold did not
// typecheck (SOC-560 #4b).
interface Fetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>
}
interface Env {
  ASSETS: Fetcher
}
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler.fetch(request, env, ctx)
  },
}
