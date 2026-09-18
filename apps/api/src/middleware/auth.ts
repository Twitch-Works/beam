import type { FastifyRequest, FastifyReply } from 'fastify'

export type UserRole = 'parent' | 'teacher' | 'admin' | 'super_admin'

// Raw shape of a Supabase-issued access token. `role` here is the Postgres
// role ("authenticated"), NOT the app role — the app role lives under
// app_metadata, set via a Supabase Auth Hook per docs/ADR/001-auth-architecture.md.
interface SupabaseJwtPayload {
  sub: string
  email?: string
  app_metadata?: { role?: UserRole }
  [key: string]: unknown
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: SupabaseJwtPayload
    user: { id: string; role: UserRole; email: string }
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const raw = request.user as unknown as SupabaseJwtPayload
    const role = raw.app_metadata?.role
    if (!raw.sub || !role) {
      reply.status(401).send({ error: 'UNAUTHORIZED' })
      return
    }
    request.user = { id: raw.sub, role, email: raw.email ?? '' }
  } catch {
    reply.status(401).send({ error: 'UNAUTHORIZED' })
  }
}

export function authorize(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply)
    if (reply.sent) return
    if (!roles.includes(request.user.role)) {
      reply.status(403).send({ error: 'FORBIDDEN' })
    }
  }
}
