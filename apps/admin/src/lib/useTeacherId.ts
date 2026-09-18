'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from './supabase/browser'

/** The signed-in teacher's own user id — matches teacherId/userId across /teacher/* calls. */
export function useTeacherId(): string | null {
  const [teacherId, setTeacherId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (active) setTeacherId(data.user?.id ?? null)
    })
    return () => {
      active = false
    }
  }, [])

  return teacherId
}
