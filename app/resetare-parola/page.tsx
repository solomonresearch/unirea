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

  const inputClass = "w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
  const iconClass = "absolute left-3 top-2.5 text-gray-400"

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/autentificare" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <Logo size={28} />
          <h1 className="text-lg font-bold text-gray-900">Resetare parola</h1>
        </div>

        {sent ? (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
            Verifica-ti emailul pentru linkul de resetare.
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-500">
              Introdu adresa de email asociata contului tau si iti vom trimite un link de resetare.
            </p>

            <form onSubmit={handleReset} className="space-y-2.5">
              <div className="relative">
                <Mail size={15} className={iconClass} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Se trimite...' : 'Trimite linkul de resetare'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500">
          Ti-ai amintit parola?{' '}
          <Link href="/autentificare" className="text-primary-700 font-medium hover:underline">
            Autentifica-te
          </Link>
        </p>
      </div>
    </main>
  )
}
