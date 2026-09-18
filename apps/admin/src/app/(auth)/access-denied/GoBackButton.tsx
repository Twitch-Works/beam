'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export function GoBackButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    await createSupabaseBrowserClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button className="btn btn--primary" type="button" onClick={handleClick} disabled={busy}>
      {busy ? 'Signing out…' : 'Go back'}
    </button>
  )
}
