'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { SearchSelect } from '@/components/SearchSelect'
import { ROMANIAN_COUNTIES } from '@/lib/romanian-counties'
import { ROMANIAN_CITIES } from '@/lib/romanian-cities'
import { User, Mail, Phone, GraduationCap, Calendar, AtSign, Loader2, ArrowLeft, Lock, MapPin, Building } from 'lucide-react'

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
    judet: '',
    localitate: '',
    highschool: '',
    graduation_year: '',
    class: '',
  })

  const [judete, setJudete] = useState<string[]>(ROMANIAN_COUNTIES)
  const [localitati, setLocalitati] = useState<string[]>([])
  const [scoli, setScoli] = useState<string[]>([])
  const [scoliRpcFailed, setScoliRpcFailed] = useState(false)
  const [loadingScoli, setLoadingScoli] = useState(false)

  // Load judete on mount — fall back to hardcoded list if RPC unavailable
  useEffect(() => {
    async function loadJudete() {
      try {
        const { data } = await getSupabase().rpc('get_judete')
        if (data && data.length > 0) {
          setJudete(data.map((r: { judet: string }) => r.judet))
        }
      } catch {
        // keep ROMANIAN_COUNTIES already set as initial state
      }
    }
    loadJudete()
  }, [])

  // Load localitati when judet changes
  useEffect(() => {
    if (!form.judet) { setLocalitati([]); return }
    setLoadingScoli(true)
    async function loadLocalitati() {
      const { data } = await getSupabase().rpc('get_localitati', { p_judet: form.judet })
      if (data && data.length > 0) {
        setLocalitati(data.map((r: { localitate: string }) => r.localitate))
      } else {
        setLocalitati(ROMANIAN_CITIES)
      }
      setLoadingScoli(false)
    }
    loadLocalitati()
  }, [form.judet])

  // Load scoli when localitate changes
  useEffect(() => {
    if (!form.localitate || !form.judet) { setScoli([]); setScoliRpcFailed(false); return }
    setLoadingScoli(true)
    async function loadScoli() {
      const { data } = await getSupabase().rpc('get_scoli', { p_judet: form.judet, p_localitate: form.localitate })
      if (data && data.length > 0) {
        setScoli(data.map((r: { denumire: string }) => r.denumire))
        setScoliRpcFailed(false)
      } else {
        setScoli([])
        setScoliRpcFailed(true)
      }
      setLoadingScoli(false)
    }
    loadScoli()
  }, [form.judet, form.localitate])

  function updateField(field: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Reset dependent fields
      if (field === 'judet') { next.localitate = ''; next.highschool = '' }
      if (field === 'localitate') { next.highschool = '' }
      return next
    })
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
        class: form.class,
      })

      if (profileError) throw profileError

      window.location.href = '/avizier'
    } catch (err: any) {
      setError(err.message || 'A aparut o eroare')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const inputClass = "w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
  const iconClass = "absolute left-3 top-2.5 text-gray-400 pointer-events-none"

  return (
    <main className="flex min-h-screen flex-col items-center px-5 py-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <Logo size={28} />
          <h1 className="text-lg font-bold text-gray-900">Inregistrare</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-2.5">
          <div className="relative">
            <User size={15} className={iconClass} />
            <input type="text" required value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Nume complet" className={inputClass} />
          </div>

          <div className="relative">
            <AtSign size={15} className={iconClass} />
            <input type="text" required value={form.username} onChange={e => updateField('username', e.target.value)} placeholder="Utilizator" className={inputClass} />
          </div>

          <div className="relative">
            <Mail size={15} className={iconClass} />
            <input type="email" required value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="Email" className={inputClass} />
          </div>

          <div className="relative">
            <Lock size={15} className={iconClass} />
            <input type="password" required minLength={6} value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="Parola (min. 6 caractere)" className={inputClass} />
          </div>

          <div className="relative">
            <Phone size={15} className={iconClass} />
            <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Telefon (optional)" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <SearchSelect
              options={judete}
              value={form.judet}
              onChange={v => updateField('judet', v)}
              placeholder="Judetul"
              icon={<MapPin size={15} />}
              required
            />

            <SearchSelect
              options={localitati}
              value={form.localitate}
              onChange={v => updateField('localitate', v)}
              placeholder="Localitatea"
              disabled={!form.judet}
              icon={<Building size={15} />}
              required
            />
          </div>

          {scoliRpcFailed ? (
            <div className="relative">
              <GraduationCap size={15} className={iconClass} />
              <input
                type="text"
                required
                value={form.highschool}
                onChange={e => updateField('highschool', e.target.value)}
                placeholder="Liceul (scrie numele)"
                className={`${inputClass} font-bold`}
              />
            </div>
          ) : (
            <SearchSelect
              options={scoli}
              value={form.highschool}
              onChange={v => updateField('highschool', v)}
              placeholder={loadingScoli ? 'Se incarca...' : 'Liceul'}
              disabled={!form.localitate}
              icon={<GraduationCap size={15} />}
              required
              bold
            />
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="relative">
              <Calendar size={15} className={iconClass} />
              <input type="number" required min={1950} max={currentYear} value={form.graduation_year} onChange={e => updateField('graduation_year', e.target.value)} placeholder="Anul absolvirii" className={inputClass} />
            </div>

            <div className="relative">
              <GraduationCap size={15} className={iconClass} />
              <select
                required
                value={form.class}
                onChange={e => updateField('class', e.target.value)}
                className={`${inputClass} appearance-none font-bold ${!form.class ? 'text-gray-400' : 'text-gray-900'}`}
              >
                <option value="" disabled>Clasa</option>
                {['A','B','C','D','E','F','G','H','I','J','K','L'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
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
