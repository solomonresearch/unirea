'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabase()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/resetare-parola/confirmare`,
      })

      if (resetError) throw resetError

      setSent(true)
    } catch (err: any) {
      setError(err.message || 'A aparut o eroare. Incearca din nou.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5" style={{ background: 'var(--cream2)' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/autentificare" style={{ color: 'var(--ink3)' }}>
            <ArrowLeft size={18} />
          </Link>
          <Logo size={28} />
          <h1 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Resetare parola</h1>
        </div>

        {sent ? (
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal)', color: 'var(--teal)' }}>
            Verifica-ti emailul pentru linkul de resetare.
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C' }}>
                {error}
              </div>
            )}

            <p className="text-sm" style={{ color: 'var(--ink3)' }}>
              Introdu adresa de email asociata contului tau si iti vom trimite un link de resetare.
            </p>

            <form onSubmit={handleReset} className="space-y-2.5">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-2.5" style={{ color: 'var(--ink3)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full rounded-sm px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                style={{ background: 'var(--ink)', color: 'var(--white)' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Se trimite...' : 'Trimite linkul de resetare'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm" style={{ color: 'var(--ink3)' }}>
          Ti-ai amintit parola?{' '}
          <Link href="/autentificare" className="font-medium hover:underline" style={{ color: 'var(--amber-dark)' }}>
            Autentifica-te
          </Link>
        </p>
      </div>
    </main>
  )
}
