import { useCallback } from 'react'
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize, spacing } from '@/constants/theme'
import {
  buildCheckoutHtml,
  parseCheckoutMessage,
  type RazorpayOrder,
  type RazorpayResult,
} from '@/lib/razorpay'

type Props = {
  /** Non-null opens the sheet; null keeps it closed. */
  order: RazorpayOrder | null
  onResult: (result: RazorpayResult) => void
}

/**
 * Full-screen Razorpay Standard Web Checkout in a WebView. Works in Expo Go and
 * dev/release builds alike (no native SDK). Emits exactly one `onResult`.
 */
export function RazorpayCheckout({ order, onResult }: Props) {
  const insets = useSafeAreaInsets()

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const result = parseCheckoutMessage(event.nativeEvent.data)
      if (result) onResult(result)
    },
    [onResult],
  )

  return (
    <Modal
      visible={order != null}
      animationType="slide"
      onRequestClose={() => onResult({ status: 'cancelled' })}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <TouchableOpacity
            onPress={() => onResult({ status: 'cancelled' })}
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={colors.navy} />
          </TouchableOpacity>
          <Text style={styles.barTitle}>Secure payment</Text>
          <View style={styles.barSpacer} />
        </View>

        {order != null ? (
          <WebView
            source={{
              html: buildCheckoutHtml(order),
              baseUrl: 'https://checkout.razorpay.com',
            }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onMessage={handleMessage}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            style={styles.web}
          />
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.mds,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barTitle: { fontSize: fontSize.h3, fontFamily: 'Nunito-Bold', color: colors.navy },
  barSpacer: { width: 24 },
  web: { flex: 1, backgroundColor: '#F6F4EF' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F4EF',
  },
})
