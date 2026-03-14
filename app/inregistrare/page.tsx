'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { SearchSelect } from '@/components/SearchSelect'
import { User, Mail, Phone, GraduationCap, Calendar, AtSign, Loader2, ArrowLeft, Lock, MapPin, Building } from 'lucide-react'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageInner />
    </Suspense>
  )
}

function SignupPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refUsername = searchParams.get('ref') || ''
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [referrerId, setReferrerId] = useState<string | null>(null)
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
  const [scoliTopMap, setScoliTopMap] = useState<Record<string, boolean>>({})
  const [loadingScoli, setLoadingScoli] = useState(false)
  const isTopSchool = form.highschool ? (scoliTopMap[form.highschool] ?? true) : true

  useEffect(() => {
    async function check() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (user) {
        // Check if profile exists — Google users might not have one yet
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

  useEffect(() => {
    if (!refUsername || checking) return
    async function lookupReferrer() {
      const { data } = await getSupabase()
        .from('profiles')
        .select('id')
        .eq('username', refUsername.toLowerCase())
        .single()
      if (data) setReferrerId(data.id)
    }
    lookupReferrer()
  }, [refUsername, checking])

  useEffect(() => {
    if (checking) return
    async function loadJudete() {
      const { data } = await getSupabase().rpc('get_judete')
      if (data) setJudete(data.map((r: { judet: string }) => r.judet))
    }
    loadJudete()
  }, [checking])

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
    if (!form.localitate || !form.judet) { setScoli([]); setScoliTopMap({}); return }
    setLoadingScoli(true)
    async function loadScoli() {
      const { data } = await getSupabase().rpc('get_scoli', { p_judet: form.judet, p_localitate: form.localitate })
      if (data) {
        setScoli(data.map((r: { denumire: string }) => r.denumire))
        const topMap: Record<string, boolean> = {}
        data.forEach((r: { denumire: string; top_school?: boolean }) => { topMap[r.denumire] = !!r.top_school })
        setScoliTopMap(topMap)
      }
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

  async function handleGoogleSignup() {
    const supabase = getSupabase()
    const callbackUrl = refUsername
      ? `${window.location.origin}/auth/callback?ref=${encodeURIComponent(refUsername)}`
      : `${window.location.origin}/auth/callback`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
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

      const profileData: Record<string, unknown> = {
        id: data.user.id,
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone || null,
        highschool: form.highschool,
        graduation_year: parseInt(form.graduation_year),
        class: form.class,
        signup_source: referrerId ? 'referral' : 'direct',
      }
      if (referrerId) profileData.referred_by = referrerId

      const { error: profileError } = await supabase.from('profiles').insert(profileData)
      if (profileError) throw profileError

      // Record referral edge + increment referrer's invite_count
      if (referrerId) {
        await supabase.from('referrals').insert({
          referrer_id: referrerId,
          referred_id: data.user.id,
        })
        await supabase.rpc('increment_invite_count', { user_id: referrerId })
      }

      // Upsert waitlist_schools for non-top schools
      if (!isTopSchool) {
        const { data: existing } = await supabase
          .from('waitlist_schools')
          .select('signup_count')
          .eq('highschool', form.highschool)
          .single()

        if (existing) {
          const newCount = existing.signup_count + 1
          await supabase
            .from('waitlist_schools')
            .update({
              signup_count: newCount,
              ...(newCount >= 50 ? { activated_at: new Date().toISOString() } : {}),
            })
            .eq('highschool', form.highschool)
        } else {
          await supabase.from('waitlist_schools').insert({ highschool: form.highschool, signup_count: 1 })
        }
      }

      window.location.href = '/avizier'
    } catch (err: any) {
      setError(err.message || 'A aparut o eroare')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  const currentYear = new Date().getFullYear()

  const inputClass = "w-full pl-9 pr-3 py-[11px] text-sm rounded-sm outline-none transition-colors"
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
          <p className="text-xs" style={{ color: 'var(--ink3)' }}>
            Creează-ți contul pentru a te reconecta
          </p>
        </div>

        {/* Google sign-up */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="flex items-center justify-center gap-3 w-full py-[13px] rounded-md text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--white)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Înregistrează-te cu Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xxs" style={{ color: 'var(--ink3)' }}>sau cu email</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
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

          {/* Section divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xxs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Scoala ta</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
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

          {form.highschool && !isTopSchool && (
            <div className="rounded-sm px-3 py-2.5 text-xs" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
              Liceul tău este pe <strong>lista de așteptare</strong>. Te poți înregistra, dar platforma se activează când 50 de colegi se alătură.
            </div>
          )}

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

          <label className="flex items-start gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[var(--ink)] flex-shrink-0"
            />
            <span className="text-xxs leading-relaxed" style={{ color: 'var(--ink3)' }}>
              Am citit și accept{' '}
              <Link
                href="/termeni"
                target="_blank"
                className="font-semibold underline"
                style={{ color: 'var(--amber-dark)' }}
              >
                Termenii și Condițiile
              </Link>
              , inclusiv politica de confidențialitate (GDPR). Înțeleg că platforma este în versiune beta și că datele pot fi pierdute.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="flex items-center justify-center gap-2 w-full py-[15px] rounded-md text-sm font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'var(--ink)', fontFamily: 'inherit' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Se creează contul...' : 'Creează cont'}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--ink3)' }}>
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
