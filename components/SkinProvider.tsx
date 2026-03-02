'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { type SkinId, DEFAULT_SKIN, isSkinId } from '@/lib/skins'
import { getSupabase } from '@/lib/supabase'

interface SkinContextValue {
  skin: SkinId
  setSkin: (id: SkinId) => Promise<void>
}

const SkinContext = createContext<SkinContextValue>({
  skin: DEFAULT_SKIN,
  setSkin: async () => {},
})

export function useSkin() {
  return useContext(SkinContext)
}

export function SkinProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkinState] = useState<SkinId>(DEFAULT_SKIN)

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('skin')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          const val = data?.skin
          if (isSkinId(val)) setSkinState(val)
        })
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', skin)
  }, [skin])

  const setSkin = useCallback(async (id: SkinId) => {
    setSkinState(id)
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ skin: id }).eq('id', user.id)
  }, [])

  return (
    <SkinContext.Provider value={{ skin, setSkin }}>
      {children}
    </SkinContext.Provider>
  )
}
