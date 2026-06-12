/** Beam shadow definitions */
export const shadows = {
  card:   '0 2px 12px rgba(0,0,0,0.08)',
  modal:  '0 8px 32px rgba(0,0,0,0.16)',
  button: '0 4px 12px rgba(23,135,166,0.30)',
  tabBar: '0 -1px 8px rgba(0,0,0,0.06)',
} as const

export type ShadowKey = keyof typeof shadows
