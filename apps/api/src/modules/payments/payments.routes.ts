import type { FastifyInstance } from 'fastify'
import { authenticate, authorize } from '../../middleware/auth.js'
import { CreateOrderInputSchema, VerifyPaymentInputSchema } from './payments.schema.js'
import * as paymentsService from './payments.service.js'

export async function paymentsRoutes(fastify: FastifyInstance) {
  // POST /payments/orders — create Razorpay order before opening SDK
  fastify.post('/payments/orders', {
    preHandler: [authenticate, authorize('parent')],
  }, async (request, reply) => {
    const { bookingId } = CreateOrderInputSchema.parse(request.body)
    const result = await paymentsService.createOrder(bookingId)
    if (!result.ok) {
      return reply.status(422).send({ error: result.error })
    }
    return reply.status(201).send(result.value)
  })

  // POST /payments/:bookingId/verify — verify Razorpay signature after SDK callback
  fastify.post<{ Params: { bookingId: string } }>('/payments/:bookingId/verify', {
    preHandler: [authenticate, authorize('parent')],
  }, async (request, reply) => {
    const { bookingId } = request.params
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      VerifyPaymentInputSchema.parse(request.body)

    const result = await paymentsService.verifyPayment(
      bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature,
    )
    if (!result.ok) {
      const status = result.error === 'INVALID_SIGNATURE' ? 400 : 422
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
