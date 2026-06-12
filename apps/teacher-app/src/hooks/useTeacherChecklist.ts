import React from 'react'
import { mockChecklistGroups } from '../data/mockTeacher'
import type { TeacherChecklist } from '../types/teacher'

export function useTeacherChecklist() {
  const [data, setData] = React.useState<TeacherChecklist>({ groups: mockChecklistGroups })

  const toggleItem = React.useCallback((itemId: string) => {
    setData((current) => ({
      groups: current.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => (
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )),
      })),
    }))
  }, [])

  return {
    data,
    isError: false,
    isLoading: false,
    refetch: () => setData({ groups: mockChecklistGroups }),
    toggleItem,
  }
}
