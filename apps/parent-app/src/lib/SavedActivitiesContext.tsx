import * as SecureStore from 'expo-secure-store'
import React from 'react'
import type { Activity } from './api'

const STORAGE_KEY = 'beam-parent-saved-activities'
const MAX_RECENT = 12

export type SavedActivitySnapshot = Pick<
  Activity,
  'id' | 'title' | 'imageUrl' | 'pricePerSession' | 'ageGroup' | 'categoryName' | 'sessionDurationMins' | 'avgRating'
>

type SavedActivitiesState = {
  wishlist: SavedActivitySnapshot[]
  recent: SavedActivitySnapshot[]
}

type SavedActivitiesContextValue = {
  isReady: boolean
  wishlist: SavedActivitySnapshot[]
  recent: SavedActivitySnapshot[]
  isWishlisted: (activityId: string) => boolean
  toggleWishlist: (activity: SavedActivitySnapshot) => Promise<void>
  markViewed: (activity: SavedActivitySnapshot) => Promise<void>
}

const SavedActivitiesContext = React.createContext<SavedActivitiesContextValue>({
  isReady: false,
  wishlist: [],
  recent: [],
  isWishlisted: () => false,
  toggleWishlist: async () => {},
  markViewed: async () => {},
})

function dedupeById(items: SavedActivitySnapshot[]) {
  const map = new Map<string, SavedActivitySnapshot>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return Array.from(map.values())
}

async function persistState(state: SavedActivitiesState) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state))
}

export function SavedActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(false)
  const [state, setState] = React.useState<SavedActivitiesState>({ wishlist: [], recent: [] })

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as Partial<SavedActivitiesState>
        if (!cancelled) {
          setState({
            wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
            recent: Array.isArray(parsed.recent) ? parsed.recent : [],
          })
        }
      } catch {
        if (!cancelled) {
          setState({ wishlist: [], recent: [] })
        }
      } finally {
        if (!cancelled) setIsReady(true)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const updateState = React.useCallback(async (updater: (current: SavedActivitiesState) => SavedActivitiesState) => {
    setState((current) => {
      const next = updater(current)
      void persistState(next)
      return next
    })
  }, [])

  const toggleWishlist = React.useCallback(async (activity: SavedActivitySnapshot) => {
    await updateState((current) => {
      const exists = current.wishlist.some((item) => item.id === activity.id)
      return {
        ...current,
        wishlist: exists
          ? current.wishlist.filter((item) => item.id !== activity.id)
          : [activity, ...current.wishlist],
      }
    })
  }, [updateState])

  const markViewed = React.useCallback(async (activity: SavedActivitySnapshot) => {
    await updateState((current) => {
      const nextRecent = dedupeById([activity, ...current.recent.filter((item) => item.id !== activity.id)])
      return {
        ...current,
        recent: nextRecent.slice(0, MAX_RECENT),
      }
    })
  }, [updateState])

  const isWishlisted = React.useCallback((activityId: string) => {
    return state.wishlist.some((item) => item.id === activityId)
  }, [state.wishlist])

  return (
    <SavedActivitiesContext.Provider
      value={{
        isReady,
        wishlist: state.wishlist,
        recent: state.recent,
        isWishlisted,
        toggleWishlist,
        markViewed,
      }}
    >
      {children}
    </SavedActivitiesContext.Provider>
  )
}

export function useSavedActivities() {
  return React.useContext(SavedActivitiesContext)
}
