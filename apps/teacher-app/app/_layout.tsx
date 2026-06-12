import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Font from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native'
import { AuthProvider } from '../src/lib/AuthContext'
import { colors, fontFamily } from '../src/constants/theme'

const queryClient = new QueryClient()

export default function RootLayout() {
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    Font.loadAsync({
      Nunito: require('../assets/fonts/Nunito-Regular.ttf'),
    })
      .then(() => {
        const defaultText = Text as typeof Text & { defaultProps?: { style?: unknown } }
        const defaultTextInput = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } }
        defaultText.defaultProps = defaultText.defaultProps ?? {}
        defaultText.defaultProps.style = [defaultText.defaultProps.style, { fontFamily: fontFamily.regular }]
        defaultTextInput.defaultProps = defaultTextInput.defaultProps ?? {}
        defaultTextInput.defaultProps.style = [defaultTextInput.defaultProps.style, { fontFamily: fontFamily.regular }]
        setIsReady(true)
      })
      .catch(() => setIsReady(true))
  }, [])

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(root)" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
  },
})
