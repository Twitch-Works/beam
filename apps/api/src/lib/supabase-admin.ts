import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role client — server only. Lazy so the API boots without it in tests.
let client: SupabaseClient | null = null
function getClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  }
  return client
}

/** The Supabase login's phone — only if Supabase has verified it (OTP). */
export async function getVerifiedAuthPhone(authUserId: string): Promise<{ phone: string; email: string | null } | null> {
  const { data, error } = await getClient().auth.admin.getUserById(authUserId)
  if (error || !data.user) return null
  const { phone, phone_confirmed_at: confirmedAt, email } = data.user
  if (!phone || !confirmedAt) return null
  return { phone, email: email ?? null }
}
