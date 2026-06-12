import { z } from 'zod'

export const NotificationChannelSchema = z.enum(['push', 'whatsapp', 'email', 'in_app'])
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>

export const NotificationTemplateSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  channel: NotificationChannelSchema,
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>

export const NotificationLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  templateKey: z.string(),
  channel: NotificationChannelSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable().optional(),
  isRead: z.boolean().default(false),
  sentAt: z.date(),
  readAt: z.date().nullable().optional(),
})
export type NotificationLog = z.infer<typeof NotificationLogSchema>

export const SendNotificationInputSchema = z.object({
  userId: z.string().uuid(),
  templateKey: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  channels: z.array(NotificationChannelSchema).optional(),
})
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>
