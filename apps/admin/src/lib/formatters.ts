/** Format number in Indian numbering (lakh/crore grouping) with ₹ prefix */
export function formatInr(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

/** Compact INR — e.g. 2458000 → ₹24.58L */
export function formatInrCompact(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(2)}L`
  if (amount >= 1_000)      return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${amount}`
}

/** e.g. 12485 → "12,485" (Indian grouping, no ₹) */
export function formatCount(n: number): string {
  return n.toLocaleString('en-IN')
}
