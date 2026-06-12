import React, { useState, useCallback, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

interface LocationSheetProps {
  visible: boolean
  onClose: () => void
  onLocationSet: (lat: number, lng: number, city: string) => void
}

export function LocationSheet({ visible, onClose, onLocationSet }: LocationSheetProps) {
  const [detecting, setDetecting] = useState(false)
  const [detected, setDetected] = useState<{ lat: number; lng: number; city: string } | null>(null)

  const detect = useCallback(async () => {
    setDetecting(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to show activities near you.')
        setDetecting(false)
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
      const city = geo?.city ?? geo?.district ?? geo?.subregion ?? 'Your location'
      setDetected({ lat: pos.coords.latitude, lng: pos.coords.longitude, city })
    } catch {
      Alert.alert('Could not detect location', 'Please try again.')
    }
    setDetecting(false)
  }, [])

  useEffect(() => {
    if (visible) {
      setDetected(null)
      detect()
    }
  }, [visible, detect])

  const handleUse = useCallback(async () => {
    if (!detected) return
    await supabase.auth.updateUser({
      data: { city: detected.city, lat: detected.lat, lng: detected.lng },
    })
    onLocationSet(detected.lat, detected.lng, detected.city)
    onClose()
  }, [detected, onLocationSet, onClose])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Detect Your City</Text>
        {detecting ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.detText}>Detecting your location…</Text>
          </View>
        ) : detected ? (
          <View style={styles.detectedBox}>
            <Ionicons name="location" size={32} color={colors.primary} />
            <Text style={styles.city}>{detected.city}</Text>
            <Text style={styles.coords}>
              {detected.lat.toFixed(4)}°N, {detected.lng.toFixed(4)}°E
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.useBtn, (!detected || detecting) && styles.useBtnOff]}
          onPress={handleUse}
          disabled={!detected || detecting}
          activeOpacity={0.85}
        >
          <Text style={styles.useBtnText}>Use this location</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  detText: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray },
  detectedBox: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  city: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.navy },
  coords: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
  useBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  useBtnOff: { opacity: 0.5 },
  useBtnText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
  cancel: { paddingVertical: spacing.sm },
  cancelText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
})
