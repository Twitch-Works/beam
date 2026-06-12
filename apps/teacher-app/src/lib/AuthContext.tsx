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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMockSession, setMockSession] = React.useState(false)

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session
      if (s && s.user.user_metadata?.role !== 'teacher') {
        supabase.auth.signOut()
        setSession(null)
      } else {
        setSession(s)
      }
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s && s.user.user_metadata?.role !== 'teacher') {
        supabase.auth.signOut()
        setSession(null)
        return
      }
      setSession(s)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading, isMockSession, setMockSession, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
