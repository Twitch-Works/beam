import * as SecureStore from 'expo-secure-store'
import React from 'react'

const STORAGE_KEY = 'beam-parent-late-onboarding'

type LateOnboardingState = {
  completed: boolean
  city: string | null
  lat: number | null
  lng: number | null
  ageBand: string | null
  interests: string[]
}

type LateOnboardingContextValue = {
  enabled: boolean
  isReady: boolean
  state: LateOnboardingState
  setLocation: (payload: { city: string; lat?: number | null; lng?: number | null }) => Promise<void>
  setPreferences: (payload: { ageBand: string; interests: string[] }) => Promise<void>
  markCompleted: () => Promise<void>
  reset: () => Promise<void>
}

const INITIAL_STATE: LateOnboardingState = {
  completed: false,
  city: null,
  lat: null,
  lng: null,
  ageBand: null,
  interests: [],
}

const LateOnboardingContext = React.createContext<LateOnboardingContextValue>({
  enabled: false,
  isReady: false,
  state: INITIAL_STATE,
  setLocation: async () => {},
  setPreferences: async () => {},
  markCompleted: async () => {},
  reset: async () => {},
})

function getEnabledFlag() {
  const raw =
    process.env.EXPO_PUBLIC_ONBOARD_WITHOUT_LOGIN ??
    process.env.ONBOARD_WITHOUT_LOGIN ??
    'false'
  return raw === 'true'
}

async function persistState(nextState: LateOnboardingState) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(nextState))
}

export function LateOnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(false)
  const [state, setState] = React.useState<LateOnboardingState>(INITIAL_STATE)
  const enabled = true;
  // const enabled = getEnabledFlag()

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY)
        if (!raw) {
          if (!cancelled) setState(INITIAL_STATE)
          return
        }

        const parsed = JSON.parse(raw) as Partial<LateOnboardingState>
        if (!cancelled) {
          setState({
            completed: parsed.completed ?? false,
            city: parsed.city ?? null,
            lat: parsed.lat ?? null,
            lng: parsed.lng ?? null,
            ageBand: parsed.ageBand ?? null,
            interests: Array.isArray(parsed.interests) ? parsed.interests : [],
          })
        }
      } catch {
        if (!cancelled) setState(INITIAL_STATE)
      } finally {
        if (!cancelled) setIsReady(true)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const updateState = React.useCallback(async (updater: (current: LateOnboardingState) => LateOnboardingState) => {
    setState((current) => {
      const nextState = updater(current)
      void persistState(nextState)
      return nextState
    })
  }, [])

  const setLocation = React.useCallback(async (payload: { city: string; lat?: number | null; lng?: number | null }) => {
    await updateState((current) => ({
      ...current,
      city: payload.city,
      lat: payload.lat ?? current.lat ?? null,
      lng: payload.lng ?? current.lng ?? null,
    }))
  }, [updateState])

  const setPreferences = React.useCallback(async (payload: { ageBand: string; interests: string[] }) => {
    await updateState((current) => ({
      ...current,
      ageBand: payload.ageBand,
      interests: payload.interests,
    }))
  }, [updateState])

  const markCompleted = React.useCallback(async () => {
    await updateState((current) => ({ ...current, completed: true }))
  }, [updateState])

  const reset = React.useCallback(async () => {
    setState(INITIAL_STATE)
    await SecureStore.deleteItemAsync(STORAGE_KEY)
  }, [])

  return (
    <LateOnboardingContext.Provider
      value={{
        enabled,
        isReady,
        state,
        setLocation,
        setPreferences,
        markCompleted,
        reset,
      }}
    >
      {children}
    </LateOnboardingContext.Provider>
  )
}

export function useLateOnboarding() {
  return React.useContext(LateOnboardingContext)
}
