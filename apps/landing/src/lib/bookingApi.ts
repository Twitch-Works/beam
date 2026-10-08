// Public (no-login) booking API used by the landing page booking modal.
// Shapes mirror @beam/schemas GuestBooking* and the public catalog endpoints.

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type BookableClass = {
  id: string;
  title: string;
  description: string | null;
  ageGroup: string | null;
  sessionDurationMins: number;
  pricePerSession: string;
  imageUrl: string | null;
  categoryName: string | null;
  deliveryMode: "at_home" | "online" | null;
  locality: string | null;
  city: string | null;
  nextAvailableDate: string | null;
};

export type ClassSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  teacherFirstName: string | null;
};

export type GuestBookingInput = {
  activityId: string;
  slotId: string;
  parentName: string;
  phone: string;
  childName: string;
  childAge: number;
};

export type GuestBooking = {
  bookingId: string;
  activityTitle: string;
  scheduledAt: string;
  amount: number;
  paymentStatus: "pending" | "success" | "failed" | "refunded";
};

export type PaymentOrder = { orderId: string; amount: number; currency: string; keyId: string };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Can't reach Beam right now. Check your connection and try again.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error ?? "Something went wrong. Please try again.", res.status);
  return body as T;
}

export async function listClasses() {
  const res = await request<{ items: BookableClass[] }>("/activities?limit=50");
  return res.items;
}

export async function listSlots(activityId: string) {
  const res = await request<{ slots: Record<string, ClassSlot[]> }>(`/activities/${activityId}/slots?days=15`);
  return res.slots;
}

export function createGuestBooking(input: GuestBookingInput) {
  return request<GuestBooking>("/guest/bookings", { method: "POST", body: JSON.stringify(input) });
}

export function createPaymentOrder(bookingId: string) {
  return request<PaymentOrder>(`/guest/bookings/${bookingId}/payment-order`, { method: "POST", body: "{}" });
}

export function verifyPayment(bookingId: string, payment: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }) {
  return request<{ bookingId: string }>(`/guest/bookings/${bookingId}/verify`, { method: "POST", body: JSON.stringify(payment) });
}
