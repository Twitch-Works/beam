/** Beam border radius values keyed by component type */
export const radius = {
  badge:    '4px',
  input:    '8px',
  button:   '12px',
  card:     '16px',
  cardLg:   '20px',
  sheet:    '24px',
  avatar:   '50%',
} as const

export type RadiusKey = keyof typeof radius
