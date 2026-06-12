import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { adminRoutes }    from './modules/admin/admin.routes.js'
import { catalogRoutes }  from './modules/catalog/catalog.routes.js'
import { bookingRoutes }  from './modules/booking/booking.routes.js'
import { teacherRoutes }  from './modules/booking/teacher.routes.js'
import { parentRoutes }   from './modules/booking/parent.routes.js'
import { paymentsRoutes } from './modules/payments/payments.routes.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'beam-dev-secret-change-in-production'

export function buildApp() {
  const fastify = Fastify({ logger: false })

  fastify.register(cors, {
    origin: [
      'http://localhost:3100',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      /^https:\/\/.*\.beam\.co$/,
      /^https:\/\/.*\.vercel\.app$/,
      'https://beamkids.in',
      'https://www.beamkids.in',
      'https://admin.beamkids.in',
    ],
    credentials: true,
  })

  fastify.register(jwt, { secret: JWT_SECRET })

  fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  fastify.get('/debug/db-host', async () => {
    const url = process.env.DATABASE_URL ?? ''
    try {
      const parsed = new URL(url)
      return { host: parsed.hostname, port: parsed.port, user: parsed.username, db: parsed.pathname }
    } catch {
      return { error: 'invalid DATABASE_URL', length: url.length, prefix: url.slice(0, 20) }
    }
  })


  fastify.register(catalogRoutes)
  fastify.register(bookingRoutes)
  fastify.register(teacherRoutes)
  fastify.register(parentRoutes)
  fastify.register(paymentsRoutes)
  fastify.register(adminRoutes)

  fastify.setErrorHandler((error, _req, reply) => {
    const cause = (error as NodeJS.ErrnoException).cause ?? error
    console.error('[beam-api error]', {
      message: error.message,
      code: (error as NodeJS.ErrnoException).code,
      cause: cause instanceof Error ? { message: cause.message, code: (cause as NodeJS.ErrnoException).code } : cause,
      stack: error.stack?.split('\n').slice(0, 4).join('\n'),
    })
    reply.status(error.statusCode ?? 500).send({
      error: error.message,
      cause: cause instanceof Error ? cause.message : String(cause),
    })
  })

  return fastify
}
