import type { FastifyInstance, FastifyReply } from 'fastify'
import beamSchemas from '@beam/schemas'
import type { Result } from '../../lib/result.js'
import * as service from './guest-booking.service.js'

// Public, unauthenticated endpoints for the landing page. They never return
// parent/child ids — callers only ever hold the booking id.

function send<T>(reply: FastifyReply, result: Result<T, service.GuestBookingError>, successStatus = 200) {
  if (!result.ok) return reply.status(result.error.status).send({ error: result.error.message })
  return reply.status(successStatus).send(result.value)
}

export async function guestBookingRoutes(fastify: FastifyInstance) {
  fastify.post('/guest/bookings', async (req, reply) => {
    const parsed = beamSchemas.CreateGuestBookingInputSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid request' })
    return send(reply, await service.createGuestBooking(parsed.data), 201)
  })

  fastify.post<{ Params: { id: string } }>('/guest/bookings/:id/payment-order', async (req, reply) => {
    return send(reply, await service.createGuestPaymentOrder(req.params.id))
  })

  // Parent app → after login. Safe to call on every launch; outcome depends only on Supabase's verified phone.
  fastify.post('/parent-accounts/claim', async (req, reply) => {
    const parsed = beamSchemas.ClaimParentAccountInputSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'authUserId is required' })
    return send(reply, await service.claimParentAccount(parsed.data.authUserId))
  })

  fastify.post<{ Params: { id: string } }>('/guest/bookings/:id/verify', async (req, reply) => {
    const parsed = beamSchemas.VerifyGuestPaymentInputSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Missing payment details' })
    return send(reply, await service.verifyGuestPayment(req.params.id, parsed.data))
  })
}
