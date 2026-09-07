import { type ReactNode, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { AnimatedSplash } from '@/components/splash/AnimatedSplash'
import { IntroCarousel } from '@/components/onboarding/IntroCarousel'

/**
 * Orchestrates what the user sees on cold start:
 *
 *   animated splash  ->  intro carousel (signed-out only)  ->  app
 *
 * The splash stays up until auth resolves, so we never flash the wrong screen.
 * The intro carousel shows whenever there is no session; logged-in users skip
 * straight to the app. Completing / skipping it (session-local, not persisted)
 * moves the user on to the sign-in flow — it returns on the next cold start if
 * they are still signed out.
 */
export function BootGate({ children }: { children: ReactNode }) {
  const { session, isMockSession, isLoading } = useAuth()
  const [introDismissed, setIntroDismissed] = useState(false)

  const isLoggedIn = Boolean(session) || isMockSession
  const bootResolved = !isLoading
  const showIntro = bootResolved && !isLoggedIn && !introDismissed

  return (
    <AnimatedSplash ready={bootResolved}>
      {showIntro ? (
        <IntroCarousel onDone={() => setIntroDismissed(true)} />
      ) : (
        children
      )}
    </AnimatedSplash>
  )
}
