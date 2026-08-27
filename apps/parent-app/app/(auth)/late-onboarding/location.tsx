import React from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontSize, radius, spacing } from '@/constants/theme'
import { useLateOnboarding } from '@/lib/LateOnboardingContext'

const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad']

export default function LateOnboardingLocationScreen() {
  const insets = useSafeAreaInsets()
  const { state, setLocation } = useLateOnboarding()
  const [city, setCity] = React.useState(state.city ?? '')
  const [detecting, setDetecting] = React.useState(false)

  const isValid = city.trim().length >= 2

  const handleUseLocation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setDetecting(true)

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to personalize nearby activities.')
        return
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })

      const resolvedCity = geo?.city ?? geo?.district ?? geo?.subregion ?? 'Your location'
      setCity(resolvedCity)
      await setLocation({
        city: resolvedCity,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    } catch {
      Alert.alert('Could not detect location', 'Please try again or choose your city manually.')
    } finally {
      setDetecting(false)
    }
  }

  const handleContinue = async () => {
    if (!isValid) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await setLocation({ city: city.trim() })
    router.replace('/(auth)/late-onboarding/preferences')
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>beam ✦</Text>
          <Text style={styles.step}>Step 1 of 2</Text>
          <Text style={styles.title}>Where should we find activities?</Text>
          <Text style={styles.subtitle}>
            We&apos;ll personalize the feed first. You can log in later when you&apos;re ready to save or book.
          </Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.locationButton, detecting && styles.locationButtonDisabled]}
            onPress={handleUseLocation}
            disabled={detecting}
            activeOpacity={0.85}
          >
            <Text style={styles.locationButtonText}>
              {detecting ? 'Detecting…' : 'Use location'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>City</Text>
          <View style={styles.cityGrid}>
            {CITIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.cityChip, city === item && styles.cityChipActive]}
                onPress={() => setCity(item)}
              >
                <Text style={[styles.cityChipText, city === item && styles.cityChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!CITIES.includes(city) && (
            <TextInput
              style={styles.input}
              placeholder="Other city..."
              placeholderTextColor={colors.gray}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  header: {
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  step: {
    fontSize: fontSize.caption,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize.h1,
    fontFamily: 'Nunito-Bold',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-Regular',
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  locationButton: {
    height: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: colors.white,
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
  },
  label: {
    fontSize: fontSize.body,
    color: colors.navy,
    fontFamily: 'Nunito-SemiBold',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.avatar,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  cityChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  cityChipText: {
    fontSize: fontSize.body,
    color: colors.gray,
    fontFamily: 'Nunito-SemiBold',
  },
  cityChipTextActive: {
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.lightGray,
    fontSize: fontSize.body,
    color: colors.navy,
    fontFamily: 'Nunito-Regular',
  },
  primaryButton: {
    height: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.bodyLg,
    fontFamily: 'Nunito-Bold',
  },
})
