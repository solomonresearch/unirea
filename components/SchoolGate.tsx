'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { LogOut, Loader2, Lock, Users } from 'lucide-react'

interface SchoolGateProps {
  children: ReactNode
}

interface SchoolStats {
  waitingCount: number
  threshold: number
  remaining: number
}

export function SchoolGate({ children }: SchoolGateProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'active' | 'inactive'>('loading')
  const [highschool, setHighschool] = useState('')
  const [stats, setStats] = useState<SchoolStats | null>(null)

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

      if (school?.enabled === true) {
        setStatus('active')
      } else {
        setStatus('inactive')
        // Fetch stats for the waiting screen
        const res = await fetch(`/api/school-status?highschool=${encodeURIComponent(profile.highschool)}`)
        if (res.ok) {
          const data = await res.json()
          setStats({ waitingCount: data.waitingCount, threshold: data.threshold, remaining: data.remaining })
        }
      }
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
            Liceul tău nu e activ încă
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--ink2)' }}>
            {highschool}
          </p>
        </div>

        {stats ? (
          <div
            className="rounded-xl px-5 py-4 space-y-1 text-left"
            style={{ background: 'var(--cream2)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} style={{ color: 'var(--amber-dark)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--ink2)' }}>Sala de așteptare</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--ink)' }}>
              În momentul de față sunt{' '}
              <strong>{stats.waitingCount}</strong> colegi care așteaptă,
              iar în total sunt <strong>{stats.threshold}</strong> necesari.
            </p>
            <p className="text-sm" style={{ color: 'var(--ink)' }}>
              Așadar, încă{' '}
              <strong style={{ color: 'var(--amber-dark)' }}>{stats.remaining}</strong>
              {' '}— și aplicația devine activă și pentru liceul tău!
            </p>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--ink3)' }}>
            Se încarcă statisticile...
          </p>
        )}

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
