/** Beam colour palette — exact hex values, use these everywhere */
export const colors = {
  // Brand primaries
  primary:       '#1787A6',
  mint:          '#E5F7F4',
  yellow:        '#FCB857',
  coral:         '#FF7A59',
  lavender:      '#A7BBFA',

  // Neutrals
  navy:          '#1E293B',
  gray:          '#64748B',
  lightGray:     '#F8FAFC',
  border:        '#E2E8F0',
  white:         '#FFFFFF',

  // Feedback
  success:       '#22C55E',
  successDark:   '#16A34A',
  successBg:     '#F0FDF4',
  error:         '#EF4444',

  // Warning (amber)
  warning:       '#D97706',
  warningBg:     '#FFFBEB',

  // Lavender variants
  lavenderBg:    '#F5F3FF',
  lavenderDark:  '#8B5CF6',

  // Admin sidebar
  sidebarBg:     '#0F172A',
  sidebarActive: '#1E3A5F',

  // Status backgrounds
  statusUpcomingBg:    '#FEF3C7',
  statusUpcomingText:  '#92400E',
  statusConfirmedBg:   '#DCFCE7',
  statusConfirmedText: '#166534',
  statusCompletedBg:   '#E5F7F4',
  statusCompletedText: '#0F4C5C',
  statusCancelledBg:   '#FEE2E2',
  statusCancelledText: '#991B1B',
  statusRescheduledBg: '#EDE9FE',
  statusRescheduledText: '#5B21B6',
  statusPendingBg:     '#FEF3C7',
  statusPendingText:   '#92400E',
} as const

export type ColorKey = keyof typeof colors
