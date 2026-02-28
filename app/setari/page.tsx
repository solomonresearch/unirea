'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
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
import { getSupabase } from '@/lib/supabase'
import {
  LogOut, Loader2, Sparkles, Briefcase, Layers,
  MapPin, Globe, Building, Heart, Mail, Phone,
  GraduationCap, Pencil, User, Settings, Shield,
  FlaskConical, Trash2,
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

type Tab = 'profil' | 'setari'

export default function SetariPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('profil')
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
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary-700" />
      </main>
    )
  }

  if (!profile) return null

  const inputClass = "w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
  const iconClass = "absolute left-3 top-2.5 text-gray-400 pointer-events-none"

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-bold text-gray-900">Unirea</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut size={16} />
            Iesire
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profil'
                ? 'border-primary-700 text-primary-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <User size={16} />
            Profil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('setari')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'setari'
                ? 'border-primary-700 text-primary-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Settings size={16} />
            Setari
          </button>
        </div>

        {/* Profil Tab */}
        {activeTab === 'profil' && (
          <div className="space-y-3">
            {/* Profile Hero */}
            <div className="flex flex-col items-center text-center space-y-2">
              <Avatar
                name={profile.name}
                avatarUrl={profile.avatar_url}
                userId={profile.id}
                onUpload={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : prev)}
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                {editingGraduation ? (
                  <div className="mt-2 space-y-2 text-left">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <GraduationCap size={15} className={iconClass} />
                        <input
                          type="number"
                          value={editGradYear}
                          onChange={e => setEditGradYear(parseInt(e.target.value, 10) || 0)}
                          placeholder="Anul"
                          min={1950}
                          max={2030}
                          className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                      </div>
                      <select
                        value={editClass}
                        onChange={e => setEditClass(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                      >
                        <option value="">Clasa</option>
                        {['A','B','C','D','E','F','G','H','I','J','K','L'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setSavingGraduation(true)
                          await updateProfile({ graduation_year: editGradYear, class: editClass || null })
                          setSavingGraduation(false)
                          setEditingGraduation(false)
                        }}
                        disabled={savingGraduation || !editGradYear}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
                      >
                        {savingGraduation && <Loader2 size={14} className="animate-spin" />}
                        {savingGraduation ? 'Se salveaza...' : 'Salveaza'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditGradYear(profile.graduation_year)
                          setEditClass(profile.class || '')
                          setEditingGraduation(false)
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Anuleaza
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                    <GraduationCap size={12} />
                    {profile.highschool} &bull; <span className="font-bold text-gray-600">{profile.graduation_year}{profile.class || ''}</span>
                    <button
                      type="button"
                      onClick={() => setEditingGraduation(true)}
                      className="text-gray-300 hover:text-primary-700 transition-colors ml-0.5"
                    >
                      <Pencil size={11} />
                    </button>
                  </p>
                )}

                {editingLocation ? (
                  <div className="mt-2 space-y-2 text-left">
                    <SearchSelect
                      options={COUNTRIES}
                      value={editCountry}
                      onChange={(v) => { setEditCountry(v); setEditCity('') }}
                      placeholder="Tara"
                      icon={<Globe size={15} />}
                    />
                    {editCountry === 'Romania' ? (
                      <SearchSelect
                        options={ROMANIAN_CITIES}
                        value={editCity}
                        onChange={setEditCity}
                        placeholder="Orasul"
                        icon={<Building size={15} />}
                      />
                    ) : (
                      <div className="relative">
                        <Building size={15} className={iconClass} />
                        <input
                          type="text"
                          value={editCity}
                          onChange={e => setEditCity(e.target.value)}
                          placeholder="Orasul"
                          className={inputClass}
                        />
                      </div>
                    )}
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setSavingLocation(true)
                          await updateProfile({ country: editCountry, city: editCity, county: editCountry === 'Romania' ? getCountyCode(editCity) : null })
                          setSavingLocation(false)
                          setEditingLocation(false)
                        }}
                        disabled={savingLocation}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
                      >
                        {savingLocation && <Loader2 size={14} className="animate-spin" />}
                        {savingLocation ? 'Se salveaza...' : 'Salveaza'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditCountry(profile.country || 'Romania')
                          setEditCity(profile.city || '')
                          setEditingLocation(false)
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Anuleaza
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                    <MapPin size={12} />
                    {[profile.city, profile.country].filter(Boolean).join(', ') || 'Nicio locatie'}
                    <button
                      type="button"
                      onClick={() => setEditingLocation(true)}
                      className="text-gray-300 hover:text-primary-700 transition-colors ml-0.5"
                    >
                      <Pencil size={11} />
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Bio Section */}
            <ProfileSection
              title="Despre tine"
              icon={<Sparkles size={16} className="text-primary-700" />}
              editContent={
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Povesteste-ne despre tine..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                />
              }
              onSave={async () => {
                await updateProfile({ bio: editBio })
              }}
            >
              <p className="text-sm text-gray-600">
                {profile.bio || <span className="text-gray-400 italic">Nicio descriere inca</span>}
              </p>
            </ProfileSection>

            {/* Profession & Domain */}
            <ProfileSection
              title="Profesie si Domeniu"
              icon={<Briefcase size={16} className="text-primary-700" />}
              editContent={
                <div className="space-y-2.5">
                  <MultiTagInput
                    options={PROFESSIONS}
                    selected={editProfession}
                    onChange={setEditProfession}
                    placeholder="Profesii (ex: Inginer, Profesor)"
                    icon={<Briefcase size={15} />}
                  />
                  <MultiTagInput
                    options={DOMAINS}
                    selected={editDomain}
                    onChange={setEditDomain}
                    placeholder="Domenii (ex: IT, Sanatate)"
                    icon={<Layers size={15} />}
                  />
                  <div className="relative">
                    <Building size={15} className={iconClass} />
                    <input
                      type="text"
                      value={editCompany}
                      onChange={e => setEditCompany(e.target.value)}
                      placeholder="Companie (optional)"
                      className={inputClass}
                    />
                  </div>
                </div>
              }
              onSave={async () => {
                await updateProfile({ profession: editProfession, domain: editDomain, company: editCompany || null })
              }}
            >
              {(profile.profession?.length > 0 || profile.domain?.length > 0 || profile.company) ? (
                <div className="space-y-1.5">
                  {(profile.profession?.length > 0 || profile.domain?.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.profession?.map(p => (
                        <span key={p} className="inline-flex items-center rounded-md bg-primary-50 border border-primary-200 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {p}
                        </span>
                      ))}
                      {profile.domain?.map(d => (
                        <span key={d} className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.company && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Building size={12} className="text-gray-400" />
                      {profile.company}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Nicio profesie sau domeniu</p>
              )}
            </ProfileSection>

            {/* Hobbies */}
            <ProfileSection
              title="Hobby-uri"
              icon={<Heart size={16} className="text-primary-700" />}
              editContent={
                <div className="grid grid-cols-4 gap-1">
                  {HOBBY_OPTIONS.map(({ label, icon: Icon }) => {
                    const selected = editHobbies.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleEditHobby(label)}
                        className={`flex flex-col items-center gap-0.5 rounded-md border px-0.5 py-1.5 text-[10px] font-medium transition-all ${
                          selected
                            ? 'border-primary-700 bg-primary-50 text-primary-700 shadow-sm'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              }
              onSave={async () => {
                await updateProfile({ hobbies: editHobbies })
              }}
            >
              {profile.hobbies?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.hobbies.map(h => {
                    const hobby = HOBBY_OPTIONS.find(o => o.label === h)
                    const Icon = hobby?.icon
                    return (
                      <span key={h} className="inline-flex items-center gap-1 rounded-md bg-primary-50 border border-primary-200 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {Icon && <Icon size={12} />}
                        {h}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Niciun hobby selectat</p>
              )}
            </ProfileSection>

            {/* Contact */}
            <ProfileSection
              title="Contact"
              icon={<Mail size={16} className="text-primary-700" />}
              editContent={
                <div className="relative">
                  <Phone size={15} className={iconClass} />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="Telefon"
                    className={inputClass}
                  />
                </div>
              }
              onSave={async () => {
                await updateProfile({ phone: editPhone || null })
              }}
            >
              <div className="space-y-1.5 text-sm text-gray-600">
                <p className="flex items-center gap-1.5">
                  <Mail size={14} className="text-gray-400" />
                  {profile.email}
                </p>
                {profile.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-400" />
                    {profile.phone}
                  </p>
                )}
              </div>
            </ProfileSection>
          </div>
        )}

        {/* Setari Tab */}
        {activeTab === 'setari' && (
          <div className="space-y-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="w-full flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <Shield size={20} className="text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Panou Admin</p>
                  <p className="text-xs text-gray-500">Gestioneaza utilizatorii si rolurile</p>
                </div>
              </button>
            )}

            {isAdmin && (
              <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FlaskConical size={18} className="text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date de test</p>
                    <p className="text-xs text-gray-500">Creeaza profiluri bot pentru testare</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMock('class')}
                    disabled={!!mockLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {mockLoading === 'class' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Umple clasa (30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMock('highschool')}
                    disabled={!!mockLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {mockLoading === 'highschool' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Umple liceul (480)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMock('city')}
                    disabled={!!mockLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {mockLoading === 'city' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Umple orasul (1440)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMock('country')}
                    disabled={!!mockLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors col-span-2"
                  >
                    {mockLoading === 'country' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Umple Romania (~450)
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteMock}
                    disabled={!!mockLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {mockLoading === 'delete' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Sterge toti botii
                  </button>
                </div>
                {mockResult && (
                  <p className="text-xs text-center text-gray-600 font-medium">{mockResult}</p>
                )}
              </div>
            )}

            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Settings size={40} strokeWidth={1} />
              <p className="mt-3 text-sm">Mai multe setari in curand</p>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>

      <BottomNav />
    </main>
  )
}
