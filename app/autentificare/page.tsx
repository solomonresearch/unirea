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
    async function check() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (user) {
        const { data: profile } = await getSupabase()
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        if (profile) {
          router.replace('/avizier')
        } else {
          router.replace('/completare-profil')
        }
      } else {
        setChecking(false)
      }
    }
    check()
  }, [router])

  if (checking) return null

  async function handleGoogleLogin() {
    const supabase = getSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

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

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xxs" style={{ color: 'var(--ink3)' }}>sau</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full py-[13px] rounded-md text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--white)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuă cu Google
        </button>

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
