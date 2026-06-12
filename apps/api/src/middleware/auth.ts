import type { FastifyRequest, FastifyReply } from 'fastify'

export type UserRole = 'parent' | 'teacher' | 'admin' | 'super_admin'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: UserRole; email: string }
    user: { id: string; role: UserRole; email: string }
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'UNAUTHORIZED' })
  }
}

export function authorize(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply)
    if (!roles.includes(request.user.role)) {
      reply.status(403).send({ error: 'FORBIDDEN' })
    }
  }
}
