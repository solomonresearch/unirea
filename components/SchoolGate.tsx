'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { LogOut, Loader2, Lock } from 'lucide-react'

interface SchoolGateProps {
  children: ReactNode
}

export function SchoolGate({ children }: SchoolGateProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'active' | 'inactive'>('loading')
  const [highschool, setHighschool] = useState('')

  useEffect(() => {
    async function check() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('highschool')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/autentificare'); return }

      setHighschool(profile.highschool)

      const { data: school } = await supabase
        .from('schools')
        .select('enabled')
        .eq('denumire_lunga_unitate', profile.highschool)
        .single()

      setStatus(school?.enabled === true ? 'active' : 'inactive')
    }
    check()
  }, [router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </div>
    )
  }

  if (status === 'active') return <>{children}</>

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--cream)' }}
    >
      <div className="w-full max-w-sm space-y-6 text-center">
        <div
          className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}
        >
          <Lock size={28} style={{ color: 'var(--amber-dark)' }} />
        </div>

        <div className="space-y-2">
          <h1
            className="font-display text-2xl"
            style={{ color: 'var(--ink)' }}
          >
            Școala ta nu este activă
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink2)' }}>
            {highschool}
          </p>
          <p className="text-xs" style={{ color: 'var(--ink3)' }}>
            Un administrator trebuie să activeze școala ta pentru a accesa platforma.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            await getSupabase().auth.signOut()
            router.push('/autentificare')
          }}
          className="flex items-center justify-center gap-2 mx-auto text-xs transition-colors"
          style={{ color: 'var(--ink3)' }}
        >
          <LogOut size={13} />
          Deconectare
        </button>
      </div>
    </main>
  )
}
