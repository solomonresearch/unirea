'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/autentificare')
      } else {
        setChecked(true)
      }
    })
  }, [router])

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--cream)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </div>
    )
  }

  return <>{children}</>
}
