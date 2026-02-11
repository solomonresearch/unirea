'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { User, Mail, Phone, GraduationCap, Calendar, AtSign, Loader2, ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    highschool: '',
    graduation_year: '',
  })

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabase()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error('Eroare la crearea contului')

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone || null,
        highschool: form.highschool,
        graduation_year: parseInt(form.graduation_year),
      })

      if (profileError) throw profileError

      router.push('/bun-venit')
    } catch (err: any) {
      setError(err.message || 'A aparut o eroare')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <Logo size={32} />
          <h1 className="text-xl font-bold text-gray-900">Inregistrare</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Nume complet</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Ion Popescu"
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Nume de utilizator</label>
            <div className="relative">
              <AtSign size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                value={form.username}
                onChange={e => updateField('username', e.target.value)}
                placeholder="ionpopescu"
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="ion@exemplu.ro"
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Parola</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={e => updateField('password', e.target.value)}
              placeholder="Minim 6 caractere"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Numar de telefon</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="07xx xxx xxx"
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Liceul</label>
            <div className="relative">
              <GraduationCap size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                value={form.highschool}
                onChange={e => updateField('highschool', e.target.value)}
                placeholder="Colegiul National..."
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Anul absolvirii</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="number"
                required
                min={1950}
                max={currentYear}
                value={form.graduation_year}
                onChange={e => updateField('graduation_year', e.target.value)}
                placeholder="2020"
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary-700 px-4 py-3.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Se creeaza contul...' : 'Creeaza cont'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Ai deja cont?{' '}
          <Link href="/autentificare" className="text-primary-700 font-medium hover:underline">
            Autentificare
          </Link>
        </p>
      </div>
    </main>
  )
}
