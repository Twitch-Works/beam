import type { Session, User } from '@supabase/supabase-js'
import React from 'react'
import { supabase } from './supabase'
import { parentApi, type ParentUser } from './api'

interface AuthContextValue {
  session: Session | null
  user: User | null
  parentUserId: string | null
  parentProfile: ParentUser | null
  isLoading: boolean
  isMockSession: boolean
  setMockSession: (v: boolean) => void
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue>({
  session: null,
  user: null,
  parentUserId: null,
  parentProfile: null,
  isLoading: true,
  isMockSession: false,
  setMockSession: () => {},
  signOut: async () => {},
})

// Fixed UUID used when logging in with the test phone 9999999999
const MOCK_USER_ID = '00000000-0000-0000-0000-999999999999'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [parentProfile, setParentProfile] = React.useState<ParentUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMockSession, setMockSession] = React.useState(false) // dev: auto-login with test user

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setIsLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setParentProfile(null)
    setMockSession(false)
  }, [])

  React.useEffect(() => {
    if (isMockSession) {
      setParentProfile({
        id: MOCK_USER_ID,
        email: 'mock@beam.app',
        firstName: 'Test',
        lastName: 'Parent',
        phone: '+919999999999',
        city: 'Bengaluru',
        role: 'parent',
      })
      return
    }

    if (!session?.user) {
      setParentProfile(null)
      return
    }

    let cancelled = false

    const resolveParentProfile = async () => {
      setIsLoading(true)
      try {
        const phone = typeof session.user.phone === 'string' && session.user.phone.length > 0
          ? session.user.phone
          : ((session.user.user_metadata?.phone as string | undefined) ?? undefined)

          console.log("PHOEN ", phone);
          console.log("session.user.id ", session.user.id);
          console.log("session.user.email ", session.user.email);
          console.log("session.user.user_metadata ", session.user.user_metadata);
        const profile = await parentApi.users.me({
          authUserId: session.user.id,
          email: session.user.email ?? undefined,
          phone,
        })

        if (!cancelled) setParentProfile(profile)
      } catch {
        if (!cancelled) setParentProfile(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void resolveParentProfile()

    return () => {
      cancelled = true
    }
  }, [isMockSession, session])

  // When in mock session, expose a fake user with the fixed test UUID so all
  // API hooks can use user.id normally and hit the seeded test data.
  const effectiveUser = isMockSession
    ? ({ id: MOCK_USER_ID, user_metadata: { onboardingStep: 'complete', city: 'Bengaluru' } } as unknown as User)
    : (session?.user ?? null)

    console.log('AuthContext:', { session, parentProfile, isMockSession })

  return (
    <AuthContext.Provider
      value={{
        session,
        user: effectiveUser,
        parentUserId: parentProfile?.id ?? (isMockSession ? MOCK_USER_ID : null),
        parentProfile,
        isLoading,
        isMockSession,
        setMockSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
