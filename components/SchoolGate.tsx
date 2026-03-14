'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { InviteSection } from '@/components/InviteSection'
import { LogOut, Loader2, Users, Lock } from 'lucide-react'

interface SchoolGateProps {
  children: ReactNode
}

export function SchoolGate({ children }: SchoolGateProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'active' | 'waitlist'>('loading')
  const [username, setUsername] = useState('')
  const [highschool, setHighschool] = useState('')
  const [signupCount, setSignupCount] = useState(0)

  useEffect(() => {
    async function check() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, highschool, invite_count')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/autentificare'); return }

      setUsername(profile.username)
      setHighschool(profile.highschool)

      // Check if school is active
      const { data: isActive } = await supabase.rpc('check_school_active', { school_name: profile.highschool })

      if (isActive) {
        setStatus('active')
        return
      }

      // Get waitlist count
      const { data: waitlist } = await supabase
        .from('waitlist_schools')
        .select('signup_count')
        .eq('highschool', profile.highschool)
        .single()

      setSignupCount(waitlist?.signup_count ?? 0)
      setStatus('waitlist')
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

  const remaining = Math.max(0, 50 - signupCount)

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
            Liceul tău este pe lista de așteptare
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink2)' }}>
            {highschool}
          </p>
        </div>

        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: 'var(--white)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-center gap-2">
            <Users size={18} style={{ color: 'var(--amber-dark)' }} />
            <span className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
              {signupCount}
            </span>
            <span className="text-sm" style={{ color: 'var(--ink3)' }}>/ 50</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--cream2)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (signupCount / 50) * 100)}%`, background: 'var(--amber)' }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--ink3)' }}>
            {signupCount} {signupCount === 1 ? 'coleg așteaptă' : 'colegi așteaptă'}. Mai {remaining === 1 ? 'este necesar' : 'sunt necesari'} <strong style={{ color: 'var(--ink)' }}>{remaining}</strong> pentru activare.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--ink2)' }}>
            Invită-ți colegii pentru a debloca platforma:
          </p>
          <InviteSection username={username} highschool={highschool} />
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
