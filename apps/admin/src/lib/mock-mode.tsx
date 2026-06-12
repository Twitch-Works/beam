'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'beam_admin_mock_mode'

type MockModeCtx = { mockMode: boolean; toggleMockMode: () => void }
const MockModeContext = createContext<MockModeCtx>({ mockMode: false, toggleMockMode: () => {} })

export function MockModeProvider({ children }: { children: React.ReactNode }) {
  const [mockMode, setMockMode] = useState(false)

  useEffect(() => {
    setMockMode(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  function toggleMockMode() {
    setMockMode(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <MockModeContext.Provider value={{ mockMode, toggleMockMode }}>
      {children}
    </MockModeContext.Provider>
  )
}

export function useMockMode() {
  return useContext(MockModeContext)
}
