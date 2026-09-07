import { colors } from '@/constants/theme'

export type RazorpaySuccess = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type RazorpayResult =
  | { status: 'success'; data: RazorpaySuccess }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string }

export type RazorpayOrder = {
  keyId: string
  orderId: string
  amount: number // paise
  currency: string
  description: string
  prefill?: { name?: string; email?: string; contact?: string }
}

/**
 * Razorpay Standard Web Checkout runs inside a WebView (checkout.js) so it works
 * in Expo Go *and* dev/release builds — no native module. This builds the page
 * that boots the checkout and relays the outcome via `postMessage`.
 */
export function buildCheckoutHtml(order: RazorpayOrder): string {
  const options = {
    key: order.keyId,
    order_id: order.orderId,
    amount: String(order.amount),
    currency: order.currency,
    name: 'Beam',
    description: order.description,
    prefill: order.prefill ?? {},
    theme: { color: colors.primary },
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F6F4EF">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    (function () {
      function post(msg) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }
      if (typeof Razorpay === 'undefined') {
        post({ event: 'failed', message: 'Could not load Razorpay. Check your connection and try again.' });
        return;
      }
      var options = ${JSON.stringify(options)};
      options.modal = {
        escape: true,
        backdropclose: false,
        ondismiss: function () { post({ event: 'dismiss' }); }
      };
      options.handler = function (response) { post({ event: 'success', data: response }); };
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          var desc = response && response.error && response.error.description;
          post({ event: 'failed', message: desc || 'Payment failed. Please try again.' });
        });
        rzp.open();
      } catch (e) {
        post({ event: 'failed', message: (e && e.message) || 'Could not start Razorpay checkout.' });
      }
    })();
  </script>
</body>
</html>`
}

/** Parse a `postMessage` payload from the checkout page into a normalised result. */
export function parseCheckoutMessage(raw: string): RazorpayResult | null {
  let msg: { event?: string; message?: string; data?: Partial<RazorpaySuccess> }
  try {
    msg = JSON.parse(raw)
  } catch {
    return null
  }
  if (!msg || typeof msg !== 'object') return null

  if (msg.event === 'dismiss') return { status: 'cancelled' }
  if (msg.event === 'failed') {
    return { status: 'failed', message: msg.message || 'Payment failed. Please try again.' }
  }
  if (msg.event === 'success' && msg.data) {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = msg.data
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      return {
        status: 'success',
        data: { razorpay_payment_id, razorpay_order_id, razorpay_signature },
      }
    }
    return { status: 'failed', message: 'The payment response was incomplete. Please try again.' }
  }
  return null
}
