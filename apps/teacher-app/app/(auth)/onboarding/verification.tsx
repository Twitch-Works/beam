import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../../src/lib/AuthContext'
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/constants/theme'

export default function VerificationScreen() {
  const { user } = useAuth()
  const meta = user?.user_metadata ?? {}
  const firstName = meta.firstName ?? 'Teacher'

  const [idUploaded, setIdUploaded] = React.useState(false)
  const [certUploaded, setCertUploaded] = React.useState(false)
  const [bank, setBank] = React.useState({ holder: '', account: '', ifsc: '', bankName: '' })
  const [bankSaved, setBankSaved] = React.useState(false)

  const bankComplete = bank.holder && bank.account && bank.ifsc && bank.bankName

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Modern Status Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="hourglass-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Verification in Progress</Text>
            <Text style={styles.bannerBody}>
              Hi {firstName}! Complete the steps below. We review submissions within 1–2 business days.
            </Text>
          </View>
        </View>

        {/* High-Fidelity Stepper Checklist */}
        <View style={styles.stepperCard}>
          {/* Step 1 - Phone (Done) */}
          <View style={styles.stepItem}>
            <View style={styles.stepperCol}>
              <View style={[styles.stepCircle, styles.stepCircleDone]}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
              <View style={[styles.stepConnector, styles.stepConnectorDone]} />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={[styles.stepLabel, styles.stepLabelDone]}>Phone Verified</Text>
                <Text style={styles.stepDoneBadge}>Done</Text>
              </View>
              <Text style={styles.stepSubText}>OTP verified successfully</Text>
            </View>
          </View>

          {/* Step 2 - Government ID */}
          <View style={styles.stepItem}>
            <View style={styles.stepperCol}>
              <View style={[styles.stepCircle, idUploaded ? styles.stepCircleDone : styles.stepCirclePending]}>
                {idUploaded ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Ionicons name="card-outline" size={14} color={colors.gray} />
                )}
              </View>
              <View style={[styles.stepConnector, idUploaded ? styles.stepConnectorDone : styles.stepConnectorPending]} />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepLabel}>Government ID</Text>
                {idUploaded && <Text style={styles.stepDoneBadge}>Uploaded</Text>}
              </View>
              <Text style={styles.stepSubText}>Aadhaar, PAN, Passport, or Voter ID</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.uploadArea,
                  idUploaded && styles.uploadAreaDone,
                  pressed && styles.uploadAreaPressed,
                ]}
                onPress={() => setIdUploaded((v) => !v)}
              >
                <Ionicons
                  name={idUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={26}
                  color={idUploaded ? colors.success : colors.primary}
                />
                <View style={styles.uploadTextContainer}>
                  <Text style={[styles.uploadLabel, idUploaded && styles.uploadLabelDone]}>
                    {idUploaded ? 'govt_id_verified.pdf' : 'Tap to upload ID document'}
                  </Text>
                  <Text style={styles.uploadSub}>
                    {idUploaded ? '1.8 MB • Tap to replace' : 'JPG, PNG or PDF • Max 5 MB'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Step 3 - Teaching Certificate */}
          <View style={styles.stepItem}>
            <View style={styles.stepperCol}>
              <View style={[styles.stepCircle, certUploaded ? styles.stepCircleDone : styles.stepCirclePending]}>
                {certUploaded ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Ionicons name="ribbon-outline" size={14} color={colors.gray} />
                )}
              </View>
              <View style={[styles.stepConnector, certUploaded ? styles.stepConnectorDone : styles.stepConnectorPending]} />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepLabel}>Teaching Certificate</Text>
                {certUploaded && <Text style={styles.stepDoneBadge}>Uploaded</Text>}
              </View>
              <Text style={styles.stepSubText}>Degree, diploma, or training credential</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.uploadArea,
                  certUploaded && styles.uploadAreaDone,
                  pressed && styles.uploadAreaPressed,
                ]}
                onPress={() => setCertUploaded((v) => !v)}
              >
                <Ionicons
                  name={certUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={26}
                  color={certUploaded ? colors.success : colors.primary}
                />
                <View style={styles.uploadTextContainer}>
                  <Text style={[styles.uploadLabel, certUploaded && styles.uploadLabelDone]}>
                    {certUploaded ? 'degree_cert_verified.pdf' : 'Tap to upload certificate'}
                  </Text>
                  <Text style={styles.uploadSub}>
                    {certUploaded ? '2.4 MB • Tap to replace' : 'JPG, PNG or PDF • Max 5 MB'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Step 4 - Background Check (In Review) */}
          <View style={styles.stepItem}>
            <View style={styles.stepperCol}>
              <View style={[styles.stepCircle, styles.stepCircleActive]}>
                <Ionicons name="eye-outline" size={14} color={colors.warning} />
              </View>
              <View style={[styles.stepConnector, styles.stepConnectorPending]} />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepLabel}>Background Check</Text>
                <Text style={styles.stepActiveBadge}>In Review</Text>
              </View>
              <Text style={styles.stepSubText}>Beam verification team is reviewing records</Text>
            </View>
          </View>

          {/* Step 5 - Bank Details */}
          <View style={[styles.stepItem, { marginBottom: 0 }]}>
            <View style={styles.stepperCol}>
              <View style={[styles.stepCircle, bankSaved ? styles.stepCircleDone : styles.stepCirclePending]}>
                {bankSaved ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Ionicons name="wallet-outline" size={14} color={colors.gray} />
                )}
              </View>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepLabel}>Payout Details</Text>
                {bankSaved && <Text style={styles.stepDoneBadge}>Saved</Text>}
              </View>
              <Text style={styles.stepSubText}>Required for receiving session payouts</Text>

              {/* Enhanced Bank details form */}
              <View style={styles.formCard}>
                <Field
                  label="Account holder name"
                  value={bank.holder}
                  onChangeText={(v) => setBank((b) => ({ ...b, holder: v }))}
                  placeholder="As on bank account"
                  icon="person-outline"
                />
                <Field
                  label="Account number"
                  value={bank.account}
                  onChangeText={(v) => setBank((b) => ({ ...b, account: v }))}
                  placeholder="Enter account number"
                  keyboardType="number-pad"
                  icon="card-outline"
                />
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="IFSC code"
                      value={bank.ifsc}
                      onChangeText={(v) => setBank((b) => ({ ...b, ifsc: v.toUpperCase() }))}
                      placeholder="SBIN0001234"
                      autoCapitalize="characters"
                      icon="business-outline"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Bank name"
                      value={bank.bankName}
                      onChangeText={(v) => setBank((b) => ({ ...b, bankName: v }))}
                      placeholder="SBI"
                      icon="wallet-outline"
                    />
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    !bankComplete && styles.saveBtnDisabled,
                    pressed && bankComplete && styles.saveBtnPressed,
                  ]}
                  disabled={!bankComplete}
                  onPress={() => setBankSaved(true)}
                >
                  <Text style={styles.saveBtnText}>Save Bank Details</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Note Panel */}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            Your Beam coordinator will reach out if additional documents are needed. You can start accepting bookings immediately after verification.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            pressed && styles.doneBtnPressed,
          ]}
          onPress={() => router.replace('/(root)')}
        >
          <Text style={styles.doneBtnText}>Go to Dashboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  icon,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'number-pad' | 'default'
  autoCapitalize?: 'characters' | 'none'
  icon: keyof typeof Ionicons.prototype.props.name
}) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <View style={field.group}>
      <Text style={field.label}>{label}</Text>
      <View style={[field.container, isFocused && field.containerFocused]}>
        <Ionicons name={icon} size={16} color={isFocused ? colors.primary : colors.gray} style={field.icon} />
        <TextInput
          style={field.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  )
}

const field = StyleSheet.create({
  group: { gap: 4, marginBottom: spacing.sm },
  label: { color: colors.navy, fontSize: fontSize.caption, fontWeight: fontWeight.bold },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  icon: { marginRight: 6 },
  input: {
    flex: 1,
    height: '100%',
    color: colors.navy,
    fontSize: fontSize.body,
    paddingVertical: 0,
  },
})

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FBFD' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.navy, fontSize: fontSize.h3, fontWeight: fontWeight.bold },
  headerSpacer: { width: 36 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.2xl },

  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.warningBg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.yellow,
    padding: spacing.md,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerText: { flex: 1, gap: 2 },
  bannerTitle: { color: colors.statusUpcomingText, fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
  bannerBody: { color: colors.statusUpcomingText, fontSize: fontSize.caption, lineHeight: 18 },

  stepperCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardLg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stepperCol: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleDone: {
    backgroundColor: colors.success,
  },
  stepCirclePending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: colors.yellow,
  },
  stepConnector: {
    width: 2,
    position: 'absolute',
    top: 30,
    bottom: -24,
    zIndex: 1,
  },
  stepConnectorDone: {
    backgroundColor: colors.success,
  },
  stepConnectorPending: {
    backgroundColor: colors.border,
  },

  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  stepLabelDone: {
    color: colors.gray,
  },
  stepSubText: {
    fontSize: fontSize.caption,
    color: colors.gray,
  },
  stepDoneBadge: {
    color: colors.statusConfirmedText,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    backgroundColor: colors.statusConfirmedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.badge,
  },
  stepActiveBadge: {
    color: colors.statusUpcomingText,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    backgroundColor: colors.statusUpcomingBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.badge,
  },

  uploadArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    marginTop: spacing.xs,
  },
  uploadAreaDone: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
    borderStyle: 'solid',
  },
  uploadAreaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  uploadTextContainer: {
    flex: 1,
    gap: 2,
  },
  uploadLabel: {
    color: colors.navy,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  uploadLabelDone: {
    color: colors.successDark,
  },
  uploadSub: {
    color: colors.gray,
    fontSize: fontSize.caption,
  },

  formCard: {
    marginTop: spacing.xs,
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: {
    backgroundColor: colors.border,
  },
  saveBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveBtnText: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },

  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: '#F5FDFD',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(23, 135, 166, 0.2)',
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
    color: colors.primary,
    fontSize: fontSize.caption,
    lineHeight: 18,
    fontWeight: fontWeight.semibold,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  doneBtnPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  doneBtnText: {
    color: colors.white,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
  },
})
