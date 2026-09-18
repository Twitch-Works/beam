import { createPublicKey } from 'node:crypto'
import { config } from '@beam/config'

// Supabase projects with asymmetric JWT signing keys (ES256/RS256) publish their
// public keys at /auth/v1/.well-known/jwks.json — cache them by `kid`.
const keyCache = new Map<string, string>()
let lastFetchAt = 0
const REFETCH_COOLDOWN_MS = 60_000

async function refreshKeys() {
  lastFetchAt = Date.now()
  const res = await fetch(`${config.supabase.url}/auth/v1/.well-known/jwks.json`)
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
  if (header.alg === 'HS256') return config.jwt.secret

  if (header.kid && keyCache.has(header.kid)) return keyCache.get(header.kid)!
  if (Date.now() - lastFetchAt > REFETCH_COOLDOWN_MS || keyCache.size === 0) await refreshKeys()

  const key = header.kid ? keyCache.get(header.kid) : undefined
  if (!key) throw new Error('No matching Supabase signing key')
  return key
}
