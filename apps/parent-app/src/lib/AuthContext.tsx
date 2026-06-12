import type { Session, User } from '@supabase/supabase-js'
import React from 'react'
import { supabase } from './supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  isLoading: boolean
  isMockSession: boolean
  setMockSession: (v: boolean) => void
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  isMockSession: false,
  setMockSession: () => {},
  signOut: async () => {},
})

// Fixed UUID used when logging in with the test phone 9999999999
const MOCK_USER_ID = '00000000-0000-0000-0000-999999999999'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMockSession, setMockSession] = React.useState(true) // dev: auto-login with test user

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
    setMockSession(false)
  }, [])

  // When in mock session, expose a fake user with the fixed test UUID so all
  // API hooks can use user.id normally and hit the seeded test data.
  const effectiveUser = isMockSession
    ? ({ id: MOCK_USER_ID, user_metadata: { onboardingStep: 'complete', city: 'Bengaluru' } } as unknown as User)
    : (session?.user ?? null)

  return (
    <AuthContext.Provider value={{ session, user: effectiveUser, isLoading, isMockSession, setMockSession, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
