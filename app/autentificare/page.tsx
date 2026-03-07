'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/avizier')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  if (checking) return null

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabase()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      window.location.href = '/avizier'
    } catch (err: any) {
      setError(err.message || 'Email sau parola incorecta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="flex min-h-screen flex-col px-7 pt-14 pb-10"
      style={{ background: 'var(--cream)' }}
    >
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Back + wordmark */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-sm"
            style={{ background: 'var(--white)', boxShadow: 'var(--shadow-s)', color: 'var(--ink2)' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <Logo size={32} />
        </div>

        <div>
          <h1
            className="font-display text-[1.8rem] leading-[1.2] mb-1"
            style={{ color: 'var(--ink)' }}
          >
            Bun venit <em className="italic" style={{ color: 'var(--amber)' }}>înapoi</em>
          </h1>
          <p className="text-xs" style={{ color: 'var(--ink3)' }}>
            Autentifică-te pentru a continua
          </p>
        </div>

        {error && (
          <div
            className="rounded-sm px-3 py-2 text-xs"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--rose)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-[13px] pointer-events-none" style={{ color: 'var(--ink3)' }} />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-9 pr-3 py-[11px] text-sm rounded-sm outline-none transition-colors"
              style={{
                background: 'var(--cream2)',
                border: '1.5px solid var(--border)',
                color: 'var(--ink)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-[13px] pointer-events-none" style={{ color: 'var(--ink3)' }} />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Parola"
              className="w-full pl-9 pr-3 py-[11px] text-sm rounded-sm outline-none transition-colors"
              style={{
                background: 'var(--cream2)',
                border: '1.5px solid var(--border)',
                color: 'var(--ink)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div className="text-right">
            <Link
              href="/resetare-parola"
              className="text-xs hover:underline"
              style={{ color: 'var(--amber-dark)' }}
            >
              Ai uitat parola?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-[15px] rounded-md text-sm font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'var(--ink)', fontFamily: 'inherit' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Se autentifica...' : 'Intră în cont'}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--ink3)' }}>
          Nu ai cont?{' '}
          <Link
            href="/inregistrare"
            className="font-semibold hover:underline"
            style={{ color: 'var(--amber-dark)' }}
          >
            Înregistrează-te
          </Link>
        </p>
      </div>
    </main>
  )
}
