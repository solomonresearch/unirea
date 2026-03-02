'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { BottomNav } from '@/components/BottomNav'
import { ProfileSection } from '@/components/ProfileSection'
import { MultiTagInput } from '@/components/MultiTagInput'
import { SearchSelect } from '@/components/SearchSelect'
import { HOBBY_OPTIONS } from '@/lib/hobbies'
import { COUNTRIES } from '@/lib/countries'
import { ROMANIAN_CITIES } from '@/lib/romanian-cities'
import { getCountyCode } from '@/lib/city-county-map'
import { PROFESSIONS } from '@/lib/professions'
import { DOMAINS } from '@/lib/domains'
import { SKINS, type SkinId } from '@/lib/skins'
import { useSkin } from '@/components/SkinProvider'
import { getSupabase } from '@/lib/supabase'
import {
  LogOut, Loader2, Sparkles, Briefcase, Layers,
  MapPin, Globe, Building, Heart, Mail, Phone,
  GraduationCap, Pencil, Settings, Shield,
  FlaskConical, Trash2, X,
} from 'lucide-react'

interface Profile {
  id: string
  name: string
  username: string
  email: string
  phone: string | null
  highschool: string
  graduation_year: number
  class: string | null
  profession: string[]
  domain: string[]
  company: string | null
  country: string
  city: string
  county: string | null
  hobbies: string[]
  bio: string
  avatar_url: string | null
  onboarding_completed: boolean
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function SetariPage() {
  const router = useRouter()
  const { skin, setSkin } = useSkin()
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [editBio, setEditBio] = useState('')
  const [editProfession, setEditProfession] = useState<string[]>([])
  const [editDomain, setEditDomain] = useState<string[]>([])
  const [editCompany, setEditCompany] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editHobbies, setEditHobbies] = useState<string[]>([])
  const [editPhone, setEditPhone] = useState('')
  const [editGradYear, setEditGradYear] = useState<number>(0)
  const [editClass, setEditClass] = useState('')
  const [editingGraduation, setEditingGraduation] = useState(false)
  const [savingGraduation, setSavingGraduation] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mockLoading, setMockLoading] = useState<string | null>(null)
  const [mockResult, setMockResult] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data } = await getSupabase()
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) { router.push('/autentificare'); return }

      if (!data.onboarding_completed) {
        router.push('/onboarding')
        return
      }

      setProfile(data as Profile)
      setIsAdmin(data.role === 'admin')
      setEditBio(data.bio || '')
      setEditProfession(data.profession || [])
      setEditDomain(data.domain || [])
      setEditCompany(data.company || '')
      setEditCountry(data.country || 'Romania')
      setEditCity(data.city || '')
      setEditHobbies(data.hobbies || [])
      setEditPhone(data.phone || '')
      setEditGradYear(data.graduation_year)
      setEditClass(data.class || '')
      setLoading(false)
    }
    loadProfile()
  }, [router])

  async function updateProfile(fields: Partial<Profile>) {
    if (!profile) return
    const { error } = await getSupabase()
      .from('profiles')
      .update(fields)
      .eq('id', profile.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...fields } : prev)
    }
  }

  async function handleLogout() {
    await getSupabase().auth.signOut()
    router.push('/autentificare')
  }

  async function handleMock(scope: string) {
    setMockLoading(scope)
    setMockResult(null)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch('/api/admin/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ scope }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMockResult(`${data.created} boti creati`)
    } catch (err: unknown) {
      setMockResult(err instanceof Error ? err.message : 'Eroare')
    } finally {
      setMockLoading(null)
    }
  }

  async function handleDeleteMock() {
    setMockLoading('delete')
    setMockResult(null)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch('/api/admin/mock', {
        method: 'DELETE',
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMockResult(`${data.deleted} boti stersi`)
    } catch (err: unknown) {
      setMockResult(err instanceof Error ? err.message : 'Eroare')
    } finally {
      setMockLoading(null)
    }
  }

  function toggleEditHobby(hobby: string) {
    setEditHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  if (!profile) return null

  const inputClass = "w-full rounded-sm px-3 py-[11px] text-[0.88rem] outline-none transition-colors"
  const inputStyle = {
    background: 'var(--cream2)',
    border: '1.5px solid var(--border)',
    color: 'var(--ink)',
    fontFamily: 'inherit',
  }
  const iconClass = "absolute left-3 top-[13px] pointer-events-none"

  return (
    <>
      <main className="min-h-screen pb-24" style={{ background: 'var(--cream2)' }}>
        {/* Profile Cover */}
        <div
          className="h-[90px] relative"
          style={{
            background: 'linear-gradient(130deg, #C8D8A8 0%, #E8D098 50%, #D8C0A8 100%)',
          }}
        >
          {/* Gear settings button */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="absolute top-3 right-4 w-9 h-9 flex items-center justify-center rounded-sm transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', color: 'var(--ink2)' }}
          >
            <Settings size={16} />
          </button>

          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(239,233,222,0.6))' }} />
        </div>

        {/* Avatar overlap */}
        <div className="relative mx-4" style={{ marginTop: '-28px', zIndex: 10, width: 'fit-content' }}>
          <div className="relative">
            <Avatar
              name={profile.name}
              avatarUrl={profile.avatar_url}
              userId={profile.id}
              onUpload={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : prev)}
            />
          </div>
        </div>

        {/* Profile info card */}
        <div
          className="rounded-lg border mx-4 mt-2 p-4"
          style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
        >
          <div className="flex items-start justify-between mb-0.5">
            <h1 className="font-display text-[1.3rem] leading-[1.2]" style={{ color: 'var(--ink)' }}>
              {profile.name}
            </h1>
            <span className="text-[0.65rem] font-semibold px-2 py-1 rounded-xs" style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}>
              @{profile.username}
            </span>
          </div>

          {editingGraduation ? (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <GraduationCap size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
                  <input
                    type="number"
                    value={editGradYear}
                    onChange={e => setEditGradYear(parseInt(e.target.value, 10) || 0)}
                    placeholder="Anul"
                    min={1950}
                    max={2030}
                    className={`${inputClass} pl-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    style={inputStyle}
                  />
                </div>
                <select
                  value={editClass}
                  onChange={e => setEditClass(e.target.value)}
                  className={`${inputClass} px-3`}
                  style={inputStyle}
                >
                  <option value="">Clasa</option>
                  {['A','B','C','D','E','F','G','H','I','J','K','L'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSavingGraduation(true)
                    await updateProfile({ graduation_year: editGradYear, class: editClass || null })
                    setSavingGraduation(false)
                    setEditingGraduation(false)
                  }}
                  disabled={savingGraduation || !editGradYear}
                  className="flex items-center gap-1.5 rounded-sm px-4 py-2 text-[0.75rem] font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--ink)' }}
                >
                  {savingGraduation && <Loader2 size={14} className="animate-spin" />}
                  {savingGraduation ? 'Se salvează...' : 'Salvează'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditGradYear(profile.graduation_year); setEditClass(profile.class || ''); setEditingGraduation(false) }}
                  className="rounded-sm px-4 py-2 text-[0.75rem] font-medium"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--ink2)' }}
                >
                  Anulează
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[0.7rem] flex items-center gap-1 mt-0.5" style={{ color: 'var(--ink3)' }}>
              <GraduationCap size={12} />
              {profile.highschool} · <span className="font-bold" style={{ color: 'var(--ink2)' }}>{profile.graduation_year}{profile.class || ''}</span>
              <button
                type="button"
                onClick={() => setEditingGraduation(true)}
                className="ml-0.5 transition-colors"
                style={{ color: 'var(--ink3)' }}
              >
                <Pencil size={10} />
              </button>
            </p>
          )}

          {editingLocation ? (
            <div className="mt-2 space-y-2">
              <SearchSelect
                options={COUNTRIES}
                value={editCountry}
                onChange={(v) => { setEditCountry(v); setEditCity('') }}
                placeholder="Țara"
                icon={<Globe size={15} />}
              />
              {editCountry === 'Romania' ? (
                <SearchSelect
                  options={ROMANIAN_CITIES}
                  value={editCity}
                  onChange={setEditCity}
                  placeholder="Orașul"
                  icon={<Building size={15} />}
                />
              ) : (
                <div className="relative">
                  <Building size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
                  <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Orașul" className={`${inputClass} pl-9`} style={inputStyle} />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSavingLocation(true)
                    await updateProfile({ country: editCountry, city: editCity, county: editCountry === 'Romania' ? getCountyCode(editCity) : null })
                    setSavingLocation(false)
                    setEditingLocation(false)
                  }}
                  disabled={savingLocation}
                  className="flex items-center gap-1.5 rounded-sm px-4 py-2 text-[0.75rem] font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--ink)' }}
                >
                  {savingLocation && <Loader2 size={14} className="animate-spin" />}
                  {savingLocation ? 'Se salvează...' : 'Salvează'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditCountry(profile.country || 'Romania'); setEditCity(profile.city || ''); setEditingLocation(false) }}
                  className="rounded-sm px-4 py-2 text-[0.75rem] font-medium"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--ink2)' }}
                >
                  Anulează
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[0.7rem] flex items-center gap-1 mt-0.5" style={{ color: 'var(--ink3)' }}>
              <MapPin size={12} />
              {[profile.city, profile.country].filter(Boolean).join(', ') || 'Nicio locație'}
              <button
                type="button"
                onClick={() => setEditingLocation(true)}
                className="ml-0.5 transition-colors"
                style={{ color: 'var(--ink3)' }}
              >
                <Pencil size={10} />
              </button>
            </p>
          )}

          {/* Stats row */}
          <div className="flex mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {[
              { label: 'Hobby-uri', value: profile.hobbies?.length || 0 },
              { label: 'Profesii', value: profile.profession?.length || 0 },
              { label: 'Domenii', value: profile.domain?.length || 0 },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                className="flex-1 text-center"
                style={i < arr.length - 1 ? { borderRight: '1px solid var(--border)' } : {}}
              >
                <span className="block font-display text-[1.25rem] leading-none" style={{ color: 'var(--ink)' }}>
                  {stat.value}
                </span>
                <span className="text-[0.58rem] uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Profile sections */}
        <div className="max-w-sm mx-auto px-4 pt-3 space-y-3">
          {/* Bio */}
          <ProfileSection
            title="Despre tine"
            icon={<Sparkles size={16} style={{ color: 'var(--amber)' }} />}
            editContent={
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Povestește-ne despre tine..."
                rows={4}
                className="w-full rounded-sm px-3 py-2.5 text-[0.88rem] outline-none resize-none"
                style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
              />
            }
            onSave={async () => { await updateProfile({ bio: editBio }) }}
          >
            <p className="text-[0.82rem] leading-relaxed" style={{ color: profile.bio ? 'var(--ink2)' : 'var(--ink3)' }}>
              {profile.bio || <em>Nicio descriere încă</em>}
            </p>
          </ProfileSection>

          {/* Profession & Domain */}
          <ProfileSection
            title="Profesie și Domeniu"
            icon={<Briefcase size={16} style={{ color: 'var(--amber)' }} />}
            editContent={
              <div className="space-y-2.5">
                <MultiTagInput options={PROFESSIONS} selected={editProfession} onChange={setEditProfession} placeholder="Profesii (ex: Inginer, Profesor)" icon={<Briefcase size={15} />} />
                <MultiTagInput options={DOMAINS} selected={editDomain} onChange={setEditDomain} placeholder="Domenii (ex: IT, Sănătate)" icon={<Layers size={15} />} />
                <div className="relative">
                  <Building size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
                  <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} placeholder="Companie (opțional)" className={`${inputClass} pl-9`} style={inputStyle} />
                </div>
              </div>
            }
            onSave={async () => { await updateProfile({ profession: editProfession, domain: editDomain, company: editCompany || null }) }}
          >
            {(profile.profession?.length > 0 || profile.domain?.length > 0 || profile.company) ? (
              <div className="space-y-1.5">
                {(profile.profession?.length > 0 || profile.domain?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.profession?.map(p => (
                      <span key={p} className="inline-flex items-center rounded px-2 py-0.5 text-[0.72rem] font-medium" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>{p}</span>
                    ))}
                    {profile.domain?.map(d => (
                      <span key={d} className="inline-flex items-center rounded px-2 py-0.5 text-[0.72rem] font-medium" style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)' }}>{d}</span>
                    ))}
                  </div>
                )}
                {profile.company && (
                  <p className="text-[0.75rem] flex items-center gap-1" style={{ color: 'var(--ink3)' }}>
                    <Building size={12} />
                    {profile.company}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[0.82rem] italic" style={{ color: 'var(--ink3)' }}>Nicio profesie sau domeniu</p>
            )}
          </ProfileSection>

          {/* Hobbies */}
          <ProfileSection
            title="Hobby-uri"
            icon={<Heart size={16} style={{ color: 'var(--amber)' }} />}
            editContent={
              <div className="grid grid-cols-4 gap-1">
                {HOBBY_OPTIONS.map(({ label, icon: Icon }) => {
                  const selected = editHobbies.includes(label)
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleEditHobby(label)}
                      className="flex flex-col items-center gap-0.5 rounded-xs px-0.5 py-1.5 text-[0.62rem] font-medium transition-all border"
                      style={selected ? {
                        border: '1.5px solid var(--amber)',
                        background: 'var(--amber-soft)',
                        color: 'var(--amber-dark)',
                      } : {
                        border: '1.5px solid var(--border)',
                        color: 'var(--ink3)',
                      }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  )
                })}
              </div>
            }
            onSave={async () => { await updateProfile({ hobbies: editHobbies }) }}
          >
            {profile.hobbies?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.hobbies.map(h => {
                  const hobby = HOBBY_OPTIONS.find(o => o.label === h)
                  const Icon = hobby?.icon
                  return (
                    <span key={h} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[0.72rem] font-medium" style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)' }}>
                      {Icon && <Icon size={11} />}
                      {h}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-[0.82rem] italic" style={{ color: 'var(--ink3)' }}>Niciun hobby selectat</p>
            )}
          </ProfileSection>

          {/* Contact */}
          <ProfileSection
            title="Contact"
            icon={<Mail size={16} style={{ color: 'var(--amber)' }} />}
            editContent={
              <div className="relative">
                <Phone size={15} className={iconClass} style={{ color: 'var(--ink3)' }} />
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Telefon" className={`${inputClass} pl-9`} style={inputStyle} />
              </div>
            }
            onSave={async () => { await updateProfile({ phone: editPhone || null }) }}
          >
            <div className="space-y-1.5 text-[0.82rem]" style={{ color: 'var(--ink2)' }}>
              <p className="flex items-center gap-1.5">
                <Mail size={13} style={{ color: 'var(--ink3)' }} />
                {profile.email}
              </p>
              {profile.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone size={13} style={{ color: 'var(--ink3)' }} />
                  {profile.phone}
                </p>
              )}
            </div>
          </ProfileSection>
        </div>
      </main>

      <BottomNav />

      {/* Settings overlay */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: 'var(--cream2)' }}
        >
          {/* Settings header */}
          <div
            className="flex items-center justify-between px-5 border-b"
            style={{
              paddingTop: '52px',
              paddingBottom: '14px',
              background: 'var(--cream)',
              borderColor: 'var(--border)',
            }}
          >
            <h2 className="font-display text-[1.4rem]" style={{ color: 'var(--ink)' }}>Setări</h2>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-sm"
              style={{ background: 'var(--white)', boxShadow: 'var(--shadow-s)', color: 'var(--ink2)' }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-sm mx-auto px-4 py-4 space-y-4">

              {/* Skin picker */}
              <div
                className="rounded-lg border p-4"
                style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
              >
                <p className="text-[0.64rem] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--ink3)' }}>
                  Aspect
                </p>
                <div className="flex gap-3">
                  {SKINS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSkin(s.id as SkinId)}
                      className="flex-1 flex flex-col items-center gap-2 rounded-md p-3 transition-all border-2"
                      style={skin === s.id ? {
                        border: '2px solid var(--amber)',
                        background: 'var(--amber-soft)',
                      } : {
                        border: '2px solid var(--border)',
                        background: 'transparent',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-sm border"
                        style={{
                          background: s.swatchBg,
                          borderColor: skin === s.id ? 'var(--amber)' : 'var(--border)',
                          boxShadow: 'var(--shadow-s)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="absolute bottom-1 right-1 w-3 h-3 rounded-full"
                          style={{ background: s.swatchAccent }}
                        />
                      </div>
                      <span
                        className="text-[0.72rem] font-semibold"
                        style={{ color: skin === s.id ? 'var(--amber-dark)' : 'var(--ink2)' }}
                      >
                        {s.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin panel */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-opacity hover:opacity-80"
                  style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
                >
                  <Shield size={20} style={{ color: 'var(--rose)' }} />
                  <div>
                    <p className="text-[0.82rem] font-bold" style={{ color: 'var(--ink)' }}>Panou Admin</p>
                    <p className="text-[0.72rem]" style={{ color: 'var(--ink3)' }}>Gestionează utilizatorii și rolurile</p>
                  </div>
                </button>
              )}

              {/* Mock data (admin only) */}
              {isAdmin && (
                <div
                  className="rounded-lg border p-4 space-y-3"
                  style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical size={18} style={{ color: 'var(--teal)' }} />
                    <div>
                      <p className="text-[0.82rem] font-bold" style={{ color: 'var(--ink)' }}>Date de test</p>
                      <p className="text-[0.72rem]" style={{ color: 'var(--ink3)' }}>Creează profiluri bot pentru testare</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { scope: 'class', label: 'Umple clasa (30)' },
                      { scope: 'highschool', label: 'Umple liceul (480)' },
                      { scope: 'city', label: 'Umple orașul (1440)' },
                    ].map(({ scope, label }) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => handleMock(scope)}
                        disabled={!!mockLoading}
                        className="flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-[0.75rem] font-medium disabled:opacity-50 transition-opacity"
                        style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink2)' }}
                      >
                        {mockLoading === scope ? <Loader2 size={14} className="animate-spin" /> : null}
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleMock('country')}
                      disabled={!!mockLoading}
                      className="flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-[0.75rem] font-medium disabled:opacity-50 col-span-2 transition-opacity"
                      style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink2)' }}
                    >
                      {mockLoading === 'country' ? <Loader2 size={14} className="animate-spin" /> : null}
                      Umple România (~450)
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteMock}
                      disabled={!!mockLoading}
                      className="flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-[0.75rem] font-medium disabled:opacity-50 transition-opacity"
                      style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: 'var(--rose)' }}
                    >
                      {mockLoading === 'delete' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Șterge toți boții
                    </button>
                  </div>
                  {mockResult && (
                    <p className="text-[0.75rem] text-center font-medium" style={{ color: 'var(--ink2)' }}>{mockResult}</p>
                  )}
                </div>
              )}

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-opacity hover:opacity-80"
                style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)', color: 'var(--rose)' }}
              >
                <LogOut size={18} />
                <span className="text-[0.82rem] font-semibold">Ieșire din cont</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
