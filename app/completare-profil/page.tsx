'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { SearchSelect } from '@/components/SearchSelect'
import { User, Phone, GraduationCap, Calendar, AtSign, Loader2, MapPin, Building, X } from 'lucide-react'

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
  const [loadingScoli, setLoadingScoli] = useState(false)
  const [reqModalOpen, setReqModalOpen] = useState(false)
  const [reqSchool, setReqSchool] = useState('')
  const [reqEmail, setReqEmail] = useState('')
  const [reqMessage, setReqMessage] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqSuccess, setReqSuccess] = useState(false)
  const [reqError, setReqError] = useState('')

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
    if (!form.localitate || !form.judet) { setScoli([]); return }
    setLoadingScoli(true)
    async function loadScoli() {
      const { data } = await getSupabase().rpc('get_scoli', { p_judet: form.judet, p_localitate: form.localitate })
      if (data) {
        setScoli(data.map((r: { denumire: string }) => r.denumire))
      }
      setLoadingScoli(false)
    }
    loadScoli()
  }, [form.judet, form.localitate])

  async function handleSchoolRequest(e: React.FormEvent) {
    e.preventDefault()
    setReqLoading(true)
    setReqError('')
    const res = await fetch('/api/school-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_name: reqSchool, email: reqEmail, message: reqMessage || undefined }),
    })
    if (res.ok) {
      setReqSuccess(true)
    } else {
      setReqError('A apărut o eroare. Încearcă din nou.')
    }
    setReqLoading(false)
  }

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
        signup_source: referrerId ? 'google_referral' : 'google',
      }
      if (referrerId) profileData.referred_by = referrerId

      const { error: profileError } = await supabase.from('profiles').insert(profileData)
      if (profileError) throw profileError

      // Record referral edge + increment referrer's invite_count
      if (referrerId && userId) {
        await supabase.from('referrals').insert({
          referrer_id: referrerId,
          referred_id: userId,
        })
        await supabase.rpc('increment_invite_count', { user_id: referrerId })
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
    <>
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

          {form.localitate && scoli.length === 0 && !loadingScoli && (
            <p className="text-xxs" style={{ color: 'var(--ink3)' }}>
              Nu găsești liceul?{' '}
              <button
                type="button"
                onClick={() => { setReqSchool(''); setReqEmail(googleEmail); setReqMessage(''); setReqSuccess(false); setReqError(''); setReqModalOpen(true) }}
                className="underline font-semibold"
                style={{ color: 'var(--amber-dark)' }}
              >
                Solicită adăugarea
              </button>
            </p>
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

    {reqModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-5"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={e => { if (e.target === e.currentTarget) setReqModalOpen(false) }}
      >
        <div
          className="w-full max-w-sm rounded-xl p-5 space-y-4"
          style={{ background: 'var(--white)', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base" style={{ color: 'var(--ink)' }}>Solicită adăugarea școlii</h2>
            <button
              type="button"
              onClick={() => setReqModalOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-sm"
              style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
            >
              <X size={15} />
            </button>
          </div>

          {reqSuccess ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Cerere trimisă!</p>
              <p className="text-xs" style={{ color: 'var(--ink3)' }}>Un administrator va analiza solicitarea ta în curând.</p>
              <button
                type="button"
                onClick={() => setReqModalOpen(false)}
                className="mt-2 px-4 py-2 rounded-md text-xs font-semibold"
                style={{ background: 'var(--ink)', color: 'var(--white)' }}
              >
                Închide
              </button>
            </div>
          ) : (
            <form onSubmit={handleSchoolRequest} className="space-y-3">
              <input
                type="text"
                required
                value={reqSchool}
                onChange={e => setReqSchool(e.target.value)}
                placeholder="Numele școlii"
                className="w-full px-3 py-2.5 text-sm rounded-md outline-none"
                style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
              />
              <input
                type="email"
                required
                value={reqEmail}
                onChange={e => setReqEmail(e.target.value)}
                placeholder="Email-ul tău"
                className="w-full px-3 py-2.5 text-sm rounded-md outline-none"
                style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
              />
              <textarea
                value={reqMessage}
                onChange={e => setReqMessage(e.target.value)}
                placeholder="Mesaj opțional..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-md outline-none resize-none"
                style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
              />
              {reqError && <p className="text-xs" style={{ color: 'var(--rose)' }}>{reqError}</p>}
              <button
                type="submit"
                disabled={reqLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'var(--ink)', fontFamily: 'inherit' }}
              >
                {reqLoading && <Loader2 size={15} className="animate-spin" />}
                {reqLoading ? 'Se trimite...' : 'Trimite cererea'}
              </button>
            </form>
          )}
        </div>
      </div>
    )}
    </>
  )
}
