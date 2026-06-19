// Centralised badge label + CSS class maps for all entity statuses.
// Import from here instead of defining locally per page.

export const BOOKING_STATUS_BADGE: Record<'confirmed' | 'completed' | 'cancelled' | 'pending' | 'rescheduled' | 'in_progress', { label: string; cls: string }> = {
  confirmed:   { label: 'Confirmed',   cls: 'badge badge--confirmed' },
  completed:   { label: 'Completed',   cls: 'badge badge--completed' },
  cancelled:   { label: 'Cancelled',   cls: 'badge badge--cancelled' },
  in_progress: { label: 'In Progress', cls: 'badge badge--upcoming' },
  pending:     { label: 'Pending',     cls: 'badge badge--pending' },
  rescheduled: { label: 'Rescheduled', cls: 'badge badge--rescheduled' },
}

export const TEACHER_VERIFY_BADGE: Record<'verified' | 'pending' | 'rejected', { label: string; cls: string }> = {
  verified: { label: 'Verified', cls: 'badge badge--confirmed' },
  pending:  { label: 'Pending',  cls: 'badge badge--pending' },
  rejected: { label: 'Rejected', cls: 'badge badge--cancelled' },
}

export const TEACHER_STATUS_BADGE: Record<'active' | 'inactive' | 'suspended', { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'badge badge--completed' },
  inactive:  { label: 'Inactive',  cls: 'badge badge--cancelled' },
  suspended: { label: 'Suspended', cls: 'badge badge--pending' },
}

export const USER_STATUS_BADGE: Record<'active' | 'inactive' | 'suspended', { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'badge badge--confirmed' },
  inactive:  { label: 'Inactive',  cls: 'badge badge--cancelled' },
  suspended: { label: 'Suspended', cls: 'badge badge--pending' },
}

export const ACTIVITY_STATUS_BADGE: Record<'published' | 'draft' | 'archived', { label: string; cls: string }> = {
  published: { label: 'Published', cls: 'badge badge--confirmed' },
  draft:     { label: 'Draft',     cls: 'badge badge--pending' },
  archived:  { label: 'Archived',  cls: 'badge badge--cancelled' },
}

export const PAYMENT_STATUS_BADGE: Record<'success' | 'failed' | 'refunded' | 'pending', { label: string; cls: string }> = {
  success:  { label: 'Success',  cls: 'badge badge--confirmed' },
  failed:   { label: 'Failed',   cls: 'badge badge--cancelled' },
  refunded: { label: 'Refunded', cls: 'badge badge--rescheduled' },
  pending:  { label: 'Pending',  cls: 'badge badge--pending' },
}

export const PAYOUT_STATUS_BADGE: Record<'queued' | 'dispatched' | 'settled' | 'failed', { label: string; cls: string }> = {
  queued:     { label: 'Queued',     cls: 'badge badge--pending' },
  dispatched: { label: 'Dispatched', cls: 'badge badge--upcoming' },
  settled:    { label: 'Settled',    cls: 'badge badge--confirmed' },
  failed:     { label: 'Failed',     cls: 'badge badge--cancelled' },
}

export const DISPUTE_STATUS_BADGE: Record<'open' | 'under_review' | 'resolved' | 'rejected', { label: string; cls: string }> = {
  open:         { label: 'Open',         cls: 'badge badge--cancelled' },
  under_review: { label: 'Under Review', cls: 'badge badge--pending' },
  resolved:     { label: 'Resolved',     cls: 'badge badge--confirmed' },
  rejected:     { label: 'Rejected',     cls: 'badge badge--cancelled' },
}

export const SOS_STATUS_BADGE: Record<'active' | 'acknowledged' | 'resolved', { label: string; cls: string; dot: string }> = {
  active:       { label: 'Active',       cls: 'badge badge--cancelled', dot: '#DC2626' },
  acknowledged: { label: 'Acknowledged', cls: 'badge badge--pending',   dot: '#B45309' },
  resolved:     { label: 'Resolved',     cls: 'badge badge--confirmed',  dot: '#166534' },
}
