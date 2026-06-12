import { Redirect, Tabs } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontSize, TAB_BAR_HEIGHT } from '@/constants/theme'
import { useAuth } from '@/lib/AuthContext'
import { useDeepLink } from '@/hooks/useDeepLink'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const TABS: {
  name: string
  label: string
  icon: IoniconName
  iconActive: IoniconName
}[] = [
  { name: 'index',    label: 'Home',     icon: 'home-outline',     iconActive: 'home' },
  { name: 'explore',  label: 'Explore',  icon: 'compass-outline',  iconActive: 'compass' },
  { name: 'bookings', label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'kids',     label: 'Kids',     icon: 'people-outline',   iconActive: 'people' },
  { name: 'profile',  label: 'Profile',  icon: 'person-outline',   iconActive: 'person' },
]

export default function RootLayout() {
  const insets = useSafeAreaInsets()
  const { session, isMockSession, isLoading } = useAuth()

  // Wire deep links — only active after auth resolves
  useDeepLink()

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
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
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Nunito-SemiBold',
          marginTop: 2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="activity/[id]" options={{ href: null }} />
      <Tabs.Screen name="teacher/[id]" options={{ href: null }} />
      <Tabs.Screen name="booking/[id]" options={{ href: null }} />
      <Tabs.Screen name="slots/[id]" options={{ href: null }} />
      <Tabs.Screen name="payment/[id]" options={{ href: null }} />
      <Tabs.Screen name="reels" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="child/[id]" options={{ href: null }} />
    </Tabs>
  )
}
