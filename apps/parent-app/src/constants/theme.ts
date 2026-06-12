/** Beam design tokens adapted for React Native (numeric values) */

export const colors = {
  primary:     '#1787A6',
  mint:        '#E5F7F4',
  yellow:      '#FCB857',
  coral:       '#FF7A59',
  lavender:    '#A7BBFA',
  navy:        '#1E293B',
  gray:        '#64748B',
  lightGray:   '#F8FAFC',
  border:      '#E2E8F0',
  white:       '#FFFFFF',
  success:     '#22C55E',
  error:       '#EF4444',

  statusUpcomingBg:      '#FEF3C7',
  statusUpcomingText:    '#92400E',
  statusConfirmedBg:     '#DCFCE7',
  statusConfirmedText:   '#166534',
  statusCompletedBg:     '#E5F7F4',
  statusCompletedText:   '#0F4C5C',
  statusCancelledBg:     '#FEE2E2',
  statusCancelledText:   '#991B1B',
  statusPendingBg:        '#FEF3C7',
  statusPendingText:      '#92400E',
  statusRescheduledBg:    '#EDE9FE',
  statusRescheduledText:  '#5B21B6',
} as const

export const spacing = {
  xs:   4,
  sm:   8,
  mds:  12,
  md:   16,
  lg:   24,
  xl:   32,
  '2xl': 48,
  '3xl': 64,
} as const

export const radius = {
  badge:   4,
  input:   8,
  button:  12,
  card:    16,
  cardLg:  20,
  sheet:   24,
  avatar:  9999,
} as const

export const fontSize = {
  display: 36,
  h1:      28,
  h2:      22,
  h3:      18,
  bodyLg:  16,
  body:    14,
  caption: 12,
  micro:   11,
} as const

export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
  button: {
    shadowColor: '#1787A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 4,
  },
} as const

export const TAB_BAR_HEIGHT = 83
