import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  JWT_SECRET: z.string().min(32),

  UPSTASH_REDIS_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),

  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  META_WHATSAPP_TOKEN: z.string().optional(),

  PORT: z.coerce.number().int().positive().default(3000),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const env = parsed.data

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,

  db: {
    url: env.DATABASE_URL,
  },

  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },

  jwt: {
    secret: env.JWT_SECRET,
  },

  redis: {
    url: env.UPSTASH_REDIS_URL ?? env.REDIS_URL ?? '',
  },

  razorpay: {
    keyId:         env.RAZORPAY_KEY_ID ?? '',
    keySecret:     env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },

  notifications: {
    resendApiKey: env.RESEND_API_KEY ?? '',
    expoAccessToken: env.EXPO_ACCESS_TOKEN ?? '',
    metaWhatsappToken: env.META_WHATSAPP_TOKEN ?? '',
  },
} as const

export type Config = typeof config
