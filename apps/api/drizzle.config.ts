import type { Config } from 'drizzle-kit'
import 'dotenv/config'

console.log("Drizzle Config Loaded with DATABASE_URL:", process.env.DATABASE_URL, process.env.POSTGRES_URL)
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
