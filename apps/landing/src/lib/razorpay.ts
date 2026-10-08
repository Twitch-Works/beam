// Razorpay Standard Checkout (web). Loads checkout.js on demand.

type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | null = null;

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load the payment page. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export type CheckoutResult =
  | { status: "paid"; razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }
  | { status: "dismissed" }
  | { status: "failed"; message: string };

export async function openCheckout(params: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  description: string;
  prefill: { name: string; contact: string };
  themeColor: string;
}): Promise<CheckoutResult> {
  await loadCheckout();
  return new Promise((resolve) => {
    let settled = false;
    let lastFailure: string | null = null;
    const settle = (r: CheckoutResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const rzp = new window.Razorpay!({
      key: params.keyId,
      order_id: params.orderId,
      amount: params.amountPaise,
      currency: "INR",
      name: "Beam",
      description: params.description,
      prefill: { name: params.prefill.name, contact: `+91${params.prefill.contact}` },
      theme: { color: params.themeColor },
      handler: (r: RazorpaySuccess) =>
        settle({
          status: "paid",
          razorpayPaymentId: r.razorpay_payment_id,
          razorpayOrderId: r.razorpay_order_id,
          razorpaySignature: r.razorpay_signature,
        }),
      // A failed attempt keeps Razorpay open so the parent can retry another method —
      // only report the failure if they close it without paying.
      modal: { ondismiss: () => settle(lastFailure ? { status: "failed", message: lastFailure } : { status: "dismissed" }) },
    });
    rzp.on("payment.failed", (r) => {
      lastFailure = (r as { error?: { description?: string } })?.error?.description ?? "Payment failed. Please try again.";
    });
    rzp.open();
  });
}
