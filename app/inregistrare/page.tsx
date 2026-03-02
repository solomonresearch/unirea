'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { SearchSelect } from '@/components/SearchSelect'
import { User, Mail, Phone, GraduationCap, Calendar, AtSign, Loader2, ArrowLeft, Lock, MapPin, Building } from 'lucide-react'

export default function SignupPage() {
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

  const [judete, setJudete] = useState<string[]>([])
  const [localitati, setLocalitati] = useState<string[]>([])
  const [scoli, setScoli] = useState<string[]>([])
  const [loadingScoli, setLoadingScoli] = useState(false)

  useEffect(() => {
    async function loadJudete() {
      const { data } = await getSupabase().rpc('get_judete')
      if (data) setJudete(data.map((r: { judet: string }) => r.judet))
    }
    loadJudete()
  }, [])

  useEffect(() => {
    if (!form.judet) { setLocalitati([]); return }
    setLoadingScoli(true)
    async function loadLocalitati() {
      const { data } = await getSupabase().rpc('get_localitati', { p_judet: form.judet })
      if (data) setLocalitati(data.map((r: { localitate: string }) => r.localitate))
      setLoadingScoli(false)
    }
    loadLocalitati()
  }, [form.judet])

  useEffect(() => {
    if (!form.localitate || !form.judet) { setScoli([]); return }
    setLoadingScoli(true)
    async function loadScoli() {
      const { data } = await getSupabase().rpc('get_scoli', { p_judet: form.judet, p_localitate: form.localitate })
      if (data) setScoli(data.map((r: { denumire: string }) => r.denumire))
      setLoadingScoli(false)
    }
    loadScoli()
  }, [form.judet, form.localitate])

  function updateField(field: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
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

  const inputClass = "w-full pl-9 pr-3 py-[11px] text-[0.88rem] rounded-sm outline-none transition-colors"
  const inputStyle = {
    background: 'var(--cream2)',
    border: '1.5px solid var(--border)',
    color: 'var(--ink)',
    fontFamily: 'inherit',
  }
  const iconClass = "absolute left-3 top-[13px] pointer-events-none"

  return (
    <main
      className="flex min-h-screen flex-col px-7 pt-14 pb-10"
      style={{ background: 'var(--cream)' }}
    >
      <div className="w-full max-w-sm mx-auto space-y-5">
        {/* Back + wordmark */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-sm"
            style={{ background: 'var(--white)', boxShadow: 'var(--shadow-s)', color: 'var(--ink2)' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>
            uni<span style={{ color: 'var(--amber)' }}>.</span>rea
          </span>
        </div>

        <div>
          <h1
            className="font-display text-[1.8rem] leading-[1.2] mb-1"
            style={{ color: 'var(--ink)' }}
          >
            Alătură-te <em className="italic" style={{ color: 'var(--amber)' }}>cercului</em>
          </h1>
          <p className="text-[0.77rem]" style={{ color: 'var(--ink3)' }}>
            Creează-ți contul pentru a te reconecta
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

        <form onSubmit={handleSignup} className="space-y-2.5">
          <div className="relative">
            <User size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="text" required value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Nume complet" className={inputClass} style={inputStyle} />
          </div>

          <div className="relative">
            <AtSign size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="text" required value={form.username} onChange={e => updateField('username', e.target.value)} placeholder="Utilizator" className={inputClass} style={inputStyle} />
          </div>

          <div className="relative">
            <Mail size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="email" required value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="Email" className={inputClass} style={inputStyle} />
          </div>

          <div className="relative">
            <Lock size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="password" required minLength={6} value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="Parola (min. 6 caractere)" className={inputClass} style={inputStyle} />
          </div>

          <div className="relative">
            <Phone size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Telefon (optional)" className={inputClass} style={inputStyle} />
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

          <div className="grid grid-cols-2 gap-2.5">
            <div className="relative">
              <Calendar size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
              <input type="number" required min={1950} max={currentYear} value={form.graduation_year} onChange={e => updateField('graduation_year', e.target.value)} placeholder="Anul absolvirii" className={inputClass} style={inputStyle} />
            </div>

            <div className="relative">
              <GraduationCap size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
              <select
                required
                value={form.class}
                onChange={e => updateField('class', e.target.value)}
                className={`${inputClass} appearance-none font-bold`}
                style={{ ...inputStyle, color: !form.class ? 'var(--ink3)' : 'var(--ink)' }}
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
            className="flex items-center justify-center gap-2 w-full py-[15px] rounded-md text-[0.88rem] font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'var(--ink)', fontFamily: 'inherit' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Se creează contul...' : 'Creează cont'}
          </button>
        </form>

        <p className="text-center text-[0.82rem]" style={{ color: 'var(--ink3)' }}>
          Ai deja cont?{' '}
          <Link
            href="/autentificare"
            className="font-semibold hover:underline"
            style={{ color: 'var(--amber-dark)' }}
          >
            Autentifică-te
          </Link>
        </p>
      </div>
    </main>
  )
}
