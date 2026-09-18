import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from './supabase/server'

export type AdminRole = 'admin' | 'super_admin' | 'teacher'

export type AdminSession = {
  id: string
  name: string
  email: string
  role: AdminRole
}

const VALID_ROLES: AdminRole[] = ['admin', 'super_admin', 'teacher']

// Mirrors middleware.ts's NEXT_PUBLIC_USER_ENV gate — 'admin' deployments serve only
// admin/super_admin, 'partner' deployments serve only teacher. Unset → no
// restriction. Kept as a second, independent check (defense in depth).
function isRoleAllowedForDeployment(role: string | undefined) {
  const userEnv = process.env.NEXT_PUBLIC_USER_ENV
  if (userEnv === 'admin' || !userEnv) return role === 'admin' || role === 'super_admin'
  if (userEnv === 'partner') return role === 'teacher'
  return false
}

export async function getAdminSession(): Promise<AdminSession> {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.app_metadata?.role as AdminRole
  if (!VALID_ROLES.includes(role)) redirect('/access-denied')
  if (!isRoleAllowedForDeployment(role)) redirect('/access-denied')

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

export async function requireTeacher(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (session.role !== 'teacher') redirect('/access-denied')
  return session
}
