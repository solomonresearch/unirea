'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { SearchSelect } from '@/components/SearchSelect'
import { User, Phone, GraduationCap, Calendar, AtSign, Loader2, MapPin, Building } from 'lucide-react'

export default function CompletareProfilPage() {
  return (
    <Suspense>
      <CompletareProfilInner />
    </Suspense>
  )
}

function CompletareProfilInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refUsername = searchParams.get('ref') || ''
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [referrerId, setReferrerId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    username: '',
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
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profile) {
        router.replace('/avizier')
        return
      }

      setUserId(user.id)
      setGoogleEmail(user.email || '')
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setGoogleName(fullName)
      setForm(prev => ({ ...prev, name: fullName }))
      setChecking(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setError('')
    setLoading(true)

    try {
      const supabase = getSupabase()

      // Check username uniqueness
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', form.username.trim().toLowerCase())
        .limit(1)

      if (existing && existing.length > 0) {
        setError('Acest username este deja folosit')
        setLoading(false)
        return
      }

      const profileData: Record<string, unknown> = {
        id: userId,
        name: form.name,
        username: form.username.trim().toLowerCase(),
        email: googleEmail,
        phone: form.phone || null,
        highschool: form.highschool,
        graduation_year: parseInt(form.graduation_year),
        class: form.class,
      }
      if (referrerId) profileData.referred_by = referrerId

      const { error: profileError } = await supabase.from('profiles').insert(profileData)
      if (profileError) throw profileError

      // Increment referrer's invite_count
      if (referrerId) {
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

      window.location.href = '/onboarding'
    } catch (err: any) {
      setError(err.message || 'A apărut o eroare')
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
        <div>
          <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>
            uni<span style={{ color: 'var(--amber)' }}>.</span>rea
          </span>
        </div>

        <div>
          <h1
            className="font-display text-[1.8rem] leading-[1.2] mb-1"
            style={{ color: 'var(--ink)' }}
          >
            Completează-ți <em className="italic" style={{ color: 'var(--amber)' }}>profilul</em>
          </h1>
          <p className="text-xs" style={{ color: 'var(--ink3)' }}>
            Conectat ca <strong>{googleEmail}</strong>. Mai avem nevoie de câteva detalii.
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

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="relative">
            <User size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="text" required value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Nume complet" className={inputClass} style={inputStyle} />
          </div>

          <div className="relative">
            <AtSign size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="text" required value={form.username} onChange={e => updateField('username', e.target.value)} placeholder="Utilizator" className={inputClass} style={inputStyle} />
          </div>

          <div className="relative">
            <Phone size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
            <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Telefon (opțional)" className={inputClass} style={inputStyle} />
          </div>

          {/* Section divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xxs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Școala ta</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <SearchSelect
              options={judete}
              value={form.judet}
              onChange={v => updateField('judet', v)}
              placeholder="Județul"
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
            placeholder={loadingScoli ? 'Se încarcă...' : 'Liceul'}
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
            {loading ? 'Se salvează...' : 'Finalizează înregistrarea'}
          </button>
        </form>
      </div>
    </main>
  )
}
