import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import beamSchemas from '@beam/schemas'
import type { ZodType } from 'zod'
import { authorize } from '../../middleware/auth.js'
import type { Result } from '../../lib/result.js'
import * as service from './scheduling.service.js'

const TEACHER_SELF_SERVICE = authorize('teacher', 'admin', 'super_admin')
const ADMIN_ONLY = authorize('admin', 'super_admin')

// A teacher always acts as themselves; admins must name the teacher explicitly.
function resolveTeacherId(request: FastifyRequest, requestedId: string | undefined) {
  return request.user.role === 'teacher' ? request.user.id : requestedId
}

function parse<T>(schema: ZodType<T>, value: unknown, reply: FastifyReply): T | null {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  reply.status(400).send({ error: result.error.issues[0]?.message ?? 'Invalid request', issues: result.error.issues })
  return null
}

function send<T>(reply: FastifyReply, result: Result<T, service.SchedulingError>, successStatus = 200) {
  if (!result.ok) return reply.status(result.error.status).send({ error: result.error.message })
  return reply.status(successStatus).send(result.value)
}

export async function schedulingRoutes(fastify: FastifyInstance) {
  // ── Teacher: activities they can offer ─────────────────────────────────────
  fastify.get<{ Querystring: { teacherId?: string } }>('/teacher/activities', { preHandler: TEACHER_SELF_SERVICE }, async (req, reply) => {
    const teacherId = resolveTeacherId(req, req.query.teacherId)
    if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })
    return send(reply, await service.listTeachableActivities(teacherId))
  })

  // ── Teacher: class slots ───────────────────────────────────────────────────
  fastify.get<{ Querystring: { teacherId?: string; from?: string; to?: string; activityId?: string } }>(
    '/teacher/slots',
    { preHandler: TEACHER_SELF_SERVICE },
    async (req, reply) => {
      const teacherId = resolveTeacherId(req, req.query.teacherId)
      if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })
      const filters = parse(beamSchemas.TeacherSlotFiltersSchema, req.query, reply)
      if (!filters) return
      return send(reply, await service.listSlots(teacherId, filters))
    },
  )

  fastify.post<{ Body: { teacherId?: string } }>('/teacher/slots', { preHandler: TEACHER_SELF_SERVICE }, async (req, reply) => {
    const teacherId = resolveTeacherId(req, req.body?.teacherId)
    if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })
    const input = parse(beamSchemas.TeacherSlotInputSchema, req.body, reply)
    if (!input) return
    return send(reply, await service.createSlot(teacherId, input), 201)
  })

  fastify.delete<{ Params: { id: string }; Querystring: { teacherId?: string } }>(
    '/teacher/slots/:id',
    { preHandler: TEACHER_SELF_SERVICE },
    async (req, reply) => {
      const teacherId = resolveTeacherId(req, req.query.teacherId)
      if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })
      return send(reply, await service.removeSlot(teacherId, req.params.id))
    },
  )

  // ── Teacher: booking change requests ───────────────────────────────────────
  fastify.get<{ Querystring: { teacherId?: string; status?: string } }>(
    '/teacher/change-requests',
    { preHandler: TEACHER_SELF_SERVICE },
    async (req, reply) => {
      const teacherId = resolveTeacherId(req, req.query.teacherId)
      if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })
      const filters = parse(beamSchemas.BookingChangeRequestFiltersSchema, { status: req.query.status }, reply)
      if (!filters) return
      return send(reply, await service.listChangeRequests({ teacherId, status: filters.status }))
    },
  )

  fastify.post<{ Params: { id: string }; Body: { teacherId?: string } }>(
    '/teacher/bookings/:id/change-requests',
    { preHandler: TEACHER_SELF_SERVICE },
    async (req, reply) => {
      const teacherId = resolveTeacherId(req, req.body?.teacherId)
      if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })
      const input = parse(beamSchemas.CreateBookingChangeRequestInputSchema, req.body, reply)
      if (!input) return
      return send(reply, await service.createChangeRequest(teacherId, req.params.id, input), 201)
    },
  )

  fastify.post<{ Params: { id: string }; Body: { teacherId?: string } }>(
    '/teacher/change-requests/:id/withdraw',
    { preHandler: TEACHER_SELF_SERVICE },
    async (req, reply) => {
      const teacherId = resolveTeacherId(req, req.body?.teacherId)
      if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })
      return send(reply, await service.withdrawChangeRequest(teacherId, req.params.id))
    },
  )

  // ── Admin: review queue ────────────────────────────────────────────────────
  fastify.get<{ Querystring: { status?: string } }>('/admin/change-requests', { preHandler: ADMIN_ONLY }, async (req, reply) => {
    const filters = parse(beamSchemas.BookingChangeRequestFiltersSchema, { status: req.query.status || undefined }, reply)
    if (!filters) return
    return send(reply, await service.listChangeRequests({ status: filters.status }))
  })

  fastify.patch<{ Params: { id: string } }>('/admin/change-requests/:id', { preHandler: ADMIN_ONLY }, async (req, reply) => {
    const input = parse(beamSchemas.ReviewBookingChangeRequestInputSchema, req.body, reply)
    if (!input) return
    const admin = { id: req.user.id, role: req.user.role as 'admin' | 'super_admin' }
    return send(reply, await service.reviewChangeRequest(admin, req.params.id, input))
  })
}
