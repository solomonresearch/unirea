'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { Lock, Loader2, ArrowLeft } from 'lucide-react'

export default function ConfirmResetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.')
      return
    }

    if (password.length < 6) {
      setError('Parola trebuie sa aiba cel putin 6 caractere.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabase()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      router.push('/avizier')
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
          <h1 className="text-lg font-bold text-gray-900">Parola noua</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-2.5">
          <div className="relative">
            <Lock size={15} className={iconClass} />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Parola noua" className={inputClass} />
          </div>

          <div className="relative">
            <Lock size={15} className={iconClass} />
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirma parola" className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Se actualizeaza...' : 'Actualizeaza parola'}
          </button>
        </form>
      </div>
    </main>
  )
}
