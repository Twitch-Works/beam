declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    key: string
    amount: string
    name: string
    order_id: string
    currency?: string
    description?: string
    prefill?: { name?: string; email?: string; contact?: string }
    theme?: { color?: string }
    method?: { upi?: boolean; card?: boolean; netbanking?: boolean; wallet?: boolean }
    [key: string]: unknown
  }

  interface RazorpaySuccessResponse {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }

  interface RazorpayErrorResponse {
    code: string
    description: string
    source?: string
    step?: string
    reason?: string
    [key: string]: unknown
  }

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpaySuccessResponse>
  }

  export default RazorpayCheckout
}
