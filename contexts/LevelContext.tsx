'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export const LEVELS = [
  {
    short: 'HS',
    label: 'LICEU',
    inst:  'Colegiul Unirea',
    color: '#6B4FE8',
    soft:  'rgba(107,79,232,0.12)',
    grad:  'linear-gradient(135deg,#7B62F0,#5A3FD0)',
    tabs:  ['Liceu', 'Promoție', 'Clasă'],
  },
  {
    short: 'F',
    label: 'FACULTATE',
    inst:  'Facultatea ta',
    color: '#2D9B6F',
    soft:  'rgba(45,155,111,0.12)',
    grad:  'linear-gradient(135deg,#2D9B6F,#1A6B4A)',
    tabs:  ['Promo', 'An', 'Grupă'],
  },
  {
    short: 'M',
    label: 'MASTER',
    inst:  'Masterul tău',
    color: '#C94F7A',
    soft:  'rgba(201,79,122,0.12)',
    grad:  'linear-gradient(135deg,#C94F7A,#8B2A50)',
    tabs:  ['Promo', 'An 1', 'Grupă'],
  },
] as const

export type Level = typeof LEVELS[number]

interface LevelContextValue {
  levelIndex: number
  level: Level
  setLevelIndex: (i: number) => void
  switchLevel: (i: number) => void
}

const LevelContext = createContext<LevelContextValue | null>(null)

const NON_LICEU_ROUTES: Record<number, string> = {
  1: '/facultate',
  2: '/master',
}

export function LevelProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [levelIndex, setLevelIndexState] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('unirea-level')
    if (stored !== null) {
      const i = parseInt(stored, 10)
      if (i >= 0 && i < LEVELS.length) setLevelIndexState(i)
    }
    setMounted(true)
  }, [])

  const setLevelIndex = useCallback((i: number) => {
    setLevelIndexState(i)
    localStorage.setItem('unirea-level', String(i))
  }, [])

  const switchLevel = useCallback((i: number) => {
    if (i === 0) {
      // Update immediately — staying within liceu pages, no flash risk
      setLevelIndex(i)
      router.push('/avizier')
    } else {
      // Navigate first; the landing page sets levelIndex on mount
      // Updating here would cause the current page to briefly render
      // the new level's tab labels before navigation completes
      router.push(NON_LICEU_ROUTES[i])
    }
  }, [setLevelIndex, router])

  const level = LEVELS[mounted ? levelIndex : 0]

  return (
    <LevelContext.Provider value={{ levelIndex: mounted ? levelIndex : 0, level, setLevelIndex, switchLevel }}>
      {children}
    </LevelContext.Provider>
  )
}

export function useLevelContext() {
  const ctx = useContext(LevelContext)
  if (!ctx) throw new Error('useLevelContext must be used within LevelProvider')
  return ctx
}
