'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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

  const inputClass = "w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
  const iconClass = "absolute left-3 top-2.5 text-gray-400"

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <Logo size={28} />
          <h1 className="text-lg font-bold text-gray-900">Autentificare</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-2.5">
          <div className="relative">
            <Mail size={15} className={iconClass} />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
          </div>

          <div className="relative">
            <Lock size={15} className={iconClass} />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Parola" className={inputClass} />
          </div>

          <div className="text-right">
            <Link href="/resetare-parola" className="text-xs text-primary-700 hover:underline">
              Ai uitat parola?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Se autentifica...' : 'Intra in cont'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Nu ai cont?{' '}
          <Link href="/inregistrare" className="text-primary-700 font-medium hover:underline">
            Inregistreaza-te
          </Link>
        </p>
      </div>
    </main>
  )
}
