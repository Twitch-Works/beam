import { useEffect } from 'react'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'

function parseBeamUrl(url: string): string | null {
  const { hostname, path } = Linking.parse(url)
  const base = hostname ?? ''
  const id = path ?? ''
  const map: Record<string, string> = {
    explore: '/explore',
    bookings: '/bookings',
    kids: '/kids',
    activity: id ? `/activity/${id}` : '/explore',
    booking: id ? `/booking/${id}` : '/bookings',
  }
  return map[base] ?? null
}

export function useDeepLink() {
  useEffect(() => {
    // Handle cold-start: app opened via deep link while not running
    Linking.getInitialURL().then(url => {
      if (url?.startsWith('beam://')) {
        const route = parseBeamUrl(url)
        if (route) router.replace(route as any)
      }
    })

    // Handle warm/hot: app already running when link arrives
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('beam://')) {
        const route = parseBeamUrl(url)
        if (route) router.push(route as any)
      }
    })

    return () => sub.remove()
  }, [])
}
