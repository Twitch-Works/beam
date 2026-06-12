import { Ionicons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '../../src/lib/AuthContext'
import { colors, fontSize, fontWeight } from '../../src/constants/theme'

type TabIconName = keyof typeof Ionicons.glyphMap

function tabIcon(name: TabIconName, activeName: TabIconName) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? activeName : name} color={color} size={size} />
  )
}

export default function RootTabsLayout() {
  const { session, isMockSession, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!session && !isMockSession) {
    return <Redirect href="/(auth)" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarLabelStyle: {
          fontFamily: 'Nunito_600SemiBold',
          fontSize: fontSize.micro,
          fontWeight: fontWeight.semibold,
        },
        tabBarStyle: {
          minHeight: 83,
          paddingTop: 8,
          paddingBottom: 16,
          borderTopColor: colors.border,
          backgroundColor: colors.white,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen name="sessions" options={{ title: 'Sessions', tabBarIcon: tabIcon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="checklist" options={{ title: 'Checklist', tabBarIcon: tabIcon('checkbox-outline', 'checkbox') }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarIcon: tabIcon('wallet-outline', 'wallet') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person-outline', 'person') }} />
      <Tabs.Screen name="session/[bookingId]" options={{ href: null }} />
      <Tabs.Screen name="session/active/[bookingId]" options={{ href: null }} />
      <Tabs.Screen name="session/complete/[bookingId]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="availability" options={{ href: null }} />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
})
