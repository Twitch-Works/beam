import { createPublicKey } from 'node:crypto'

// Supabase projects with asymmetric JWT signing keys (ES256/RS256) publish their
// public keys at /auth/v1/.well-known/jwks.json — cache them by `kid`.
const keyCache = new Map<string, string>()
let lastFetchAt = 0
const REFETCH_COOLDOWN_MS = 60_000

// Read lazily from process.env (like supabase-admin.ts): @beam/config ships raw
// .ts, which Node can't load from node_modules in the deployed Vercel function.
function requireEnv(name: 'SUPABASE_URL' | 'JWT_SECRET'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required to verify Supabase tokens`)
  return value
}

// Explicit shape: Vercel's type check can resolve the global `Response` to an
// empty type (via @types/node's conditional fetch globals), dropping ok/status/json.
type JwksResponse = { ok: boolean; status: number; json(): Promise<unknown> }

async function refreshKeys() {
  lastFetchAt = Date.now()
  const res = (await fetch(`${requireEnv('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`)) as unknown as JwksResponse
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`)
  const { keys } = (await res.json()) as { keys: Array<Record<string, unknown> & { kid?: string }> }
  for (const jwk of keys) {
    if (!jwk.kid) continue
    const pem = createPublicKey({ key: jwk as never, format: 'jwk' }).export({ type: 'spki', format: 'pem' }) as string
    keyCache.set(jwk.kid, pem)
  }
}

export async function getSupabaseVerifyKey(header: { alg?: string; kid?: string }): Promise<string> {
  // Legacy projects sign with the shared HS256 secret.
  if (header.alg === 'HS256') return requireEnv('JWT_SECRET')

  if (header.kid && keyCache.has(header.kid)) return keyCache.get(header.kid)!
  if (Date.now() - lastFetchAt > REFETCH_COOLDOWN_MS || keyCache.size === 0) await refreshKeys()

  const key = header.kid ? keyCache.get(header.kid) : undefined
  if (!key) throw new Error('No matching Supabase signing key')
  return key
}
