import { colors, fontWeight, spacing } from '@beam/ui-tokens'

export { colors, fontWeight, spacing }

export const radius = {
  badge: 4,
  input: 8,
  button: 12,
  card: 16,
  cardLg: 20,
  sheet: 24,
  avatar: 9999,
} as const

export const fontSize = {
  display: 36,
  h1: 28,
  h2: 22,
  h3: 18,
  bodyLg: 16,
  body: 14,
  caption: 12,
  micro: 11,
} as const

export const fontFamily = {
  regular: 'Nunito',
} as const

export const heroOverlay = {
  circle1:     'rgba(255,255,255,0.08)',
  circle2:     'rgba(255,255,255,0.07)',
  label:       'rgba(255,255,255,0.75)',
  trend:       'rgba(255,255,255,0.85)',
  icon:        'rgba(255,255,255,0.9)',
  statLabel:   'rgba(255,255,255,0.65)',
  statLabelMd: 'rgba(255,255,255,0.7)',
  statBg:      'rgba(255,255,255,0.15)',
  badge:       'rgba(255,255,255,0.2)',
  timerPause:  'rgba(255,255,255,0.2)',
  timerResume: 'rgba(255,255,255,0.3)',
  slotSub:     'rgba(255,255,255,0.8)',
} as const

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
} as const
