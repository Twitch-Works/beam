import type { FastifyInstance } from 'fastify'
import { CreateOrderInputSchema, VerifyPaymentInputSchema } from './payments.schema.js'
import * as paymentsService from './payments.service.js'

// NOTE: like the rest of the parent-facing API (`/bookings`, `/children`, …), these
// routes are not JWT-guarded yet — they take `parentId` in the body and check that
// the booking's payment belongs to that parent. Wire real Supabase auth here once
// `middleware/auth.ts` is finished.
export async function paymentsRoutes(fastify: FastifyInstance) {
  // POST /payments/orders — create Razorpay order before opening the checkout sheet
  fastify.post('/payments/orders', async (request, reply) => {
    const parsed = CreateOrderInputSchema.safeParse(request.body)
    console.log("Parsed request body:", parsed, JSON.stringify(parsed))
    if (!parsed.success) {
      return reply.status(400).send({ error: 'INVALID_REQUEST', details: parsed.error.flatten() })
    }
    const result = await paymentsService.createOrder(parsed.data.bookingId, parsed.data.parentId)
    console.log("Result from createOrder:", result, JSON.stringify(result))
    if (!result.ok) {
      const status =
        result.error === 'PAYMENT_NOT_FOUND'        ? 404 :
        result.error === 'FORBIDDEN'                ? 403 :
        result.error === 'ALREADY_PAID'             ? 409 :
        result.error === 'RAZORPAY_NOT_CONFIGURED'  ? 500 :
        result.error === 'RAZORPAY_ERROR'           ? 502 :
        422 // AMOUNT_TOO_LOW and anything else
      return reply.status(status).send({ error: result.error })
    }
    return reply.status(201).send(result.value)
  })

  // POST /payments/:bookingId/verify — verify Razorpay signature after the SDK callback
  fastify.post<{ Params: { bookingId: string } }>('/payments/:bookingId/verify', async (request, reply) => {
    const { bookingId } = request.params
    const parsed = VerifyPaymentInputSchema.safeParse(request.body)
    if (!parsed.success) {
      // Missing / malformed fields — never mark the booking as paid
      return reply.status(400).send({ error: 'MISSING_FIELDS', details: parsed.error.flatten() })
    }
    const { parentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = parsed.data

    const result = await paymentsService.verifyPayment(
      bookingId, parentId, razorpayPaymentId, razorpayOrderId, razorpaySignature,
    )
    if (!result.ok) {
      const status =
        result.error === 'INVALID_SIGNATURE' ? 400 :
        result.error === 'FORBIDDEN'          ? 403 :
        result.error === 'PAYMENT_NOT_FOUND'  ? 404 :
        422
      return reply.status(status).send({ error: result.error })
    }
    return reply.send({ ok: true })
  })

  // Webhook sub-plugin — scoped JSON parser captures raw Buffer for HMAC
  fastify.register(razorpayWebhookRoutes)
}

async function razorpayWebhookRoutes(fastify: FastifyInstance) {
  // Override JSON parser in this scope to return raw Buffer
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body)
  })

  fastify.post('/webhooks/razorpay', async (request, reply) => {
    const rawBody = request.body as unknown as Buffer
    const signature = (request.headers['x-razorpay-signature'] as string) ?? ''

    const result = await paymentsService.processWebhook(rawBody, signature)
    if (!result.ok) {
      // Return 400 so Razorpay does NOT retry (signature failure = bad secret config, not transient)
      return reply.status(400).send({ received: false, error: result.error })
    }
    return reply.send({ received: true })
  })
}
