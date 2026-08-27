import { useQueries } from '@tanstack/react-query'
import { parentApi, type Slot } from '@/lib/api'

export type ActivitySlotPreview = {
  nextSlot: Slot | null
}

function toSlotDate(slot: Slot) {
  return new Date(`${slot.date}T${slot.startTime}`)
}

export function useActivitySlotPreviews(activityIds: string[], days = 7) {
  const from = new Date().toISOString().slice(0, 10)

  const results = useQueries({
    queries: activityIds.map((activityId) => ({
      queryKey: ['activity-slot-preview', activityId, from, days],
      queryFn: async (): Promise<ActivitySlotPreview> => {
        const response = await parentApi.activities.slots(activityId, from, days)
        const nextSlot =
          Object.values(response.slots)
            .flat()
            .filter((slot) => slot.isAvailable)
            .sort((a, b) => toSlotDate(a).getTime() - toSlotDate(b).getTime())[0] ?? null

        return { nextSlot }
      },
      enabled: !!activityId,
      staleTime: 1000 * 60,
    })),
  })

  return activityIds.reduce<Record<string, ActivitySlotPreview | undefined>>((acc, activityId, index) => {
    acc[activityId] = results[index]?.data
    return acc
  }, {})
}
