// Indian mobile numbers are stored inconsistently across signup paths
// (+91XXXXXXXXXX from app signup/seed, 91XXXXXXXXXX from Supabase phone auth,
// bare 10 digits). Match all forms so the same parent is always recognised.
export function indianPhoneVariants(raw: string): string[] {
  const tenDigits = raw.replace(/\D/g, '').slice(-10)
  if (tenDigits.length !== 10) return [raw.trim()]
  return [`+91${tenDigits}`, `91${tenDigits}`, tenDigits]
}
