import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from './supabase/server'

export type AdminRole = 'admin' | 'super_admin'

export type AdminSession = {
  id: string
  name: string
  email: string
  role: AdminRole
}

export async function getAdminSession(): Promise<AdminSession> {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.app_metadata?.role as AdminRole
  if (role !== 'admin' && role !== 'super_admin') redirect('/access-denied')

  return {
    id: user.id,
    name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Admin',
    email: user.email ?? '',
    role,
  }
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (session.role !== 'super_admin') redirect('/access-denied')
  return session
}
