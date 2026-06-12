/** Beam typography scale */
export const fontSize = {
  display: '36px',
  h1:      '28px',
  h2:      '22px',
  h3:      '18px',
  bodyLg:  '16px',
  body:    '14px',
  caption: '12px',
  micro:   '11px',
} as const

export const fontWeight = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const

/** Web apps: Nunito Rounded for parent/teacher, DM Sans for admin UI, DM Mono for admin metrics */
export const fontFamily = {
  brand:   "'Nunito', 'Nunito Rounded', sans-serif",
  admin:   "'DM Sans', sans-serif",
  mono:    "'DM Mono', monospace",
} as const
