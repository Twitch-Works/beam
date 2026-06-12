import 'dotenv/config'
import { buildApp } from './app.js'

const PORT = Number(process.env.PORT ?? 3000)

const fastify = buildApp()

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`🚀 API running on http://localhost:${PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
