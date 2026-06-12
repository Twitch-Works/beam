import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, spacing, radius, fontSize, shadows } from '@/constants/theme'
import { Avatar } from '@/components/Avatar'
import { parentApi } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import type { Booking as ApiBooking } from '@/lib/api'

function formatScheduled(iso: string | null) {
  if (!iso) return { weekday: '', date: '—', time: '—' }
  const d = new Date(iso)
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    date:    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    time:    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase(),
  }
}

export function isLiveBooking(booking: ApiBooking): boolean {
  if (!booking.scheduledAt || booking.status !== 'confirmed') return false
  const sessionStart = new Date(booking.scheduledAt).getTime()
  const now = Date.now()
  return now >= sessionStart - 60 * 60 * 1000 && now <= sessionStart + 2 * 60 * 60 * 1000
}

function RatingModal({ booking, onClose, onSubmitted }: { booking: ApiBooking; onClose: () => void; onSubmitted: () => void }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Select a rating', 'Please tap a star to rate your session.'); return }
    if (!user) return
    setSubmitting(true)
    try {
      await parentApi.bookings.submitFeedback(booking.id, user.id, rating, comment.trim() || undefined)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSubmitted()
    } catch (err: any) {
      Alert.alert('Could not submit', err?.message ?? 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={ratingStyles.backdrop}>
        <View style={ratingStyles.sheet}>
          <Text style={ratingStyles.title}>Rate your session</Text>
          <Text style={ratingStyles.subtitle}>{booking.activityTitle ?? 'Session'}</Text>

          <View style={ratingStyles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRating(n) }} hitSlop={8}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={36} color={n <= rating ? '#FCB857' : colors.border} />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={ratingStyles.input}
            placeholder="Share what you loved (optional)"
            placeholderTextColor={colors.gray}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[ratingStyles.submitBtn, (submitting || rating === 0) && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting
              ? <ActivityIndicator color={colors.white} />
              : <Text style={ratingStyles.submitText}>Submit Rating</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={ratingStyles.cancelBtn} onPress={onClose}>
            <Text style={ratingStyles.cancelText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

interface BookingCardProps {
  booking: ApiBooking
}

export const BookingCard = React.memo(function BookingCard({ booking }: BookingCardProps) {
  const [showRating, setShowRating] = useState(false)
  const [rated, setRated] = useState(false)
  const teacherName = booking.teacherFirstName
    ? `${booking.teacherFirstName} ${booking.teacherLastName ?? ''}`.trim()
    : '—'
  const { weekday, date, time } = formatScheduled(booking.scheduledAt)
  const live = isLiveBooking(booking)
  const locationLabel = booking.sessionType === 'home' ? 'Home' : 'Online'

  return (
    <View style={styles.card}>
      {/* Live strip */}
      {live && (
        <View style={styles.liveStrip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE · Teacher on the way · 12 min away</Text>
        </View>
      )}

      {/* Card body */}
      <View style={styles.cardBody}>
        <Image
          source={booking.activityImage ? { uri: booking.activityImage } : require('../../../assets/images/icon.png')}
          style={styles.thumb}
          contentFit="cover"
        />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{booking.activityTitle ?? '—'}</Text>

          <View style={styles.metaRow}>
            {booking.teacherFirstName ? (
              <Avatar firstName={booking.teacherFirstName} lastName={booking.teacherLastName} size={18} colorIndex={0} />
            ) : (
              <Ionicons name="person-circle-outline" size={18} color={colors.gray} />
            )}
            <Text style={styles.teacherText}>{teacherName}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.gray} />
            <Text style={styles.metaText}>{weekday}, {date}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="time-outline" size={13} color={colors.gray} />
            <Text style={styles.metaText}>{time}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.gray} />
            <Text style={styles.metaText}>{locationLabel} · Bandra West</Text>
          </View>
        </View>
      </View>

      {/* ── Actions by status ── */}

      {/* Live: full-width Track button */}
      {live && (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          activeOpacity={0.88}
        >
          <Ionicons name="navigate" size={16} color={colors.white} />
          <Text style={styles.trackBtnText}>Track Session</Text>
        </TouchableOpacity>
      )}

      {/* Upcoming (not live): Reschedule + Support */}
      {!live && (booking.status === 'pending' || booking.status === 'confirmed') && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert('Reschedule', 'Rescheduling coming soon.') }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnTextTeal}>Reschedule</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert('Support', 'Email us at support@beam.app') }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnTextGray}>Support</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Completed: Rate (amber) + Book Again (mint) */}
      {showRating && (
        <RatingModal
          booking={booking}
          onClose={() => setShowRating(false)}
          onSubmitted={() => { setShowRating(false); setRated(true) }}
        />
      )}

      {booking.status === 'completed' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rateBtn]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (!rated) setShowRating(true) }}
            activeOpacity={rated ? 1 : 0.8}
            disabled={rated}
          >
            <Ionicons name={rated ? 'star' : 'star-outline'} size={14} color="#92400E" />
            <Text style={styles.rateBtnText}>{rated ? 'Rated' : 'Rate'}</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          {booking.activityId && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.bookAgainBtn]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/(root)/slots/${booking.activityId}`) }}
              activeOpacity={0.8}
            >
              <Text style={styles.bookAgainBtnText}>Book Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Cancelled: Refund Status (coral) */}
      {booking.status === 'cancelled' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.refundBtn]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert('Refund', 'Your refund is being processed (3–5 business days).') }}
            activeOpacity={0.8}
          >
            <Text style={styles.refundBtnText}>Refund Status</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },

  liveStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  liveText: { fontSize: fontSize.caption, fontFamily: 'Nunito-Bold', color: colors.white, letterSpacing: 0.3 },

  cardBody: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  thumb: {
    width: 80, height: 80,
    borderRadius: radius.button,
    backgroundColor: colors.lightGray,
  },
  info: { flex: 1, gap: 5 },
  title: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.navy, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  teacherText: { fontSize: fontSize.caption, fontFamily: 'Nunito-SemiBold', color: colors.navy },
  metaText: { fontSize: fontSize.caption, fontFamily: 'Nunito-Regular', color: colors.gray },
  metaDot: { color: colors.border, fontSize: fontSize.caption },

  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
  },
  trackBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-Bold', color: colors.white },

  // Shared action row
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionDivider: { width: 1, backgroundColor: colors.border },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.md,
  },
  actionBtnTextTeal: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  actionBtnTextGray: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },

  // Completed variants
  rateBtn: { backgroundColor: '#FEF3C7' },
  rateBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: '#92400E' },
  bookAgainBtn: { backgroundColor: colors.mint },
  bookAgainBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.primary },

  // Cancelled variant
  refundBtn: { backgroundColor: '#FEE2E2' },
  refundBtnText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: '#FF7A59' },
})

const ratingStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  title: { fontSize: fontSize.h2, fontFamily: 'Nunito-Bold', color: colors.navy, textAlign: 'center' },
  subtitle: { fontSize: fontSize.body, fontFamily: 'Nunito-Regular', color: colors.gray, textAlign: 'center', marginTop: -spacing.sm },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    fontSize: fontSize.body,
    fontFamily: 'Nunito-Regular',
    color: colors.navy,
    minHeight: 80,
    backgroundColor: colors.lightGray,
  },
  submitBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: fontSize.bodyLg, fontFamily: 'Nunito-Bold', color: colors.white },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { fontSize: fontSize.body, fontFamily: 'Nunito-SemiBold', color: colors.gray },
})
