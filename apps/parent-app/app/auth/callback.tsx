import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import * as ExpoLinking from 'expo-linking'
import { colors, spacing, fontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

function routeFromOnboardingStep(onboardingStep?: string | null) {
  if (!onboardingStep) {
    router.replace('/(auth)/parent-setup')
    return
  }

  if (onboardingStep === 'parent-done') {
    router.replace('/(auth)/child-setup')
    return
  }

  router.replace('/(root)/')
}

function parseAuthParams(url: string) {
  const hashFragment = url.includes('#') ? url.split('#')[1] : ''
  const queryString = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : ''
  const params = new URLSearchParams([queryString, hashFragment].filter(Boolean).join('&'))

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
    type: params.get('type'),
  }
}

export default function AuthCallbackScreen() {
  const url = ExpoLinking.useURL()
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => (url ? parseAuthParams(url) : null), [url])

  useEffect(() => {
    let cancelled = false

    const completeAuth = async () => {
      if (!parsed) return

      try {
        if (parsed.accessToken && parsed.refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          })
          if (sessionError) throw sessionError
          if (!cancelled) routeFromOnboardingStep(data.user?.user_metadata?.onboardingStep)
          return
        }

        if (parsed.code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code)
          if (exchangeError) throw exchangeError
          if (!cancelled) routeFromOnboardingStep(data.user?.user_metadata?.onboardingStep)
          return
        }

        throw new Error(parsed.type === 'signup' ? 'Email verification link is missing session data.' : 'Authentication callback is invalid.')
      } catch (callbackError) {
        if (!cancelled) {
          setError(callbackError instanceof Error ? callbackError.message : 'Unable to complete sign-in.')
        }
      }
    }

    void completeAuth()

    return () => {
      cancelled = true
    }
  }, [parsed])

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.title}>{error ? 'Verification failed' : 'Completing sign-in'}</Text>
      <Text style={styles.subtitle}>
        {error
          ? error
          : 'We are verifying your email and preparing your parent account.'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.h2,
    color: colors.navy,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
})
