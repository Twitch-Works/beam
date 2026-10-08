// Shared rule for "can this teacher teach this activity?" — used by admin slot
// creation and teacher self-service slot creation.

function normalizeSkillTerm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function buildSkillIndex(values: string[]) {
  const phrases = new Set<string>()
  const tokens = new Set<string>()

  for (const value of values) {
    const normalized = normalizeSkillTerm(value)
    if (!normalized) continue
    phrases.add(normalized)
    for (const token of normalized.split(' ')) {
      if (token) tokens.add(token)
    }
  }

  return { phrases, tokens }
}

export function teacherMatchesActivitySpecialization(
  teacherSpecializations: string[],
  activityKeywords: string[],
) {
  const teacherIndex = buildSkillIndex(teacherSpecializations)
  const activityIndex = buildSkillIndex(activityKeywords)

  if (teacherIndex.phrases.size === 0) return false

  for (const phrase of teacherIndex.phrases) {
    if (activityIndex.phrases.has(phrase)) return true
  }

  for (const token of teacherIndex.tokens) {
    if (activityIndex.tokens.has(token)) return true
  }

  return false
}
