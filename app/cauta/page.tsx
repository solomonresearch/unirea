'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { SearchSelect } from '@/components/SearchSelect'
import { PROFESSIONS } from '@/lib/professions'
import { DOMAINS } from '@/lib/domains'
import { CITY_COORDINATES } from '@/lib/city-coordinates'
import { getSupabase } from '@/lib/supabase'
import type { UserMarker } from '@/components/MapView'
import {
  Loader2, Search, Briefcase, Layers, Building2,
  GraduationCap, Users, SlidersHorizontal, List, MapPin, User,
  Check, UsersRound,
} from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

const CLASS_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

interface ProfileResult {
  id: string
  name: string
  graduation_year: number
  class: string | null
  profession: string[]
  domain: string[]
  company: string | null
  city: string | null
  country: string | null
}

type ViewMode = 'list' | 'map'

export default function CautaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [highschool, setHighschool] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [profession, setProfession] = useState('')
  const [domain, setDomain] = useState('')
  const [year, setYear] = useState('')
  const [cls, setCls] = useState('')
  const [company, setCompany] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [results, setResults] = useState<ProfileResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [showGroupConfirm, setShowGroupConfirm] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await getSupabase()
        .from('profiles')
        .select('id, highschool')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/autentificare'); return }

      setCurrentUserId(profile.id)
      setHighschool(profile.highschool)
      setLoading(false)
    }
    init()
  }, [router])

  const search = useCallback(async () => {
    if (!highschool || !currentUserId) return

    setSearching(true)

    let query = getSupabase()
      .from('profiles')
      .select('id, name, graduation_year, class, profession, domain, company, city, country')
      .eq('highschool', highschool)
      .eq('onboarding_completed', true)
      .neq('id', currentUserId)

    if (name) {
      query = query.ilike('name', `%${name}%`)
    }
    if (profession) {
      query = query.contains('profession', [profession])
    }
    if (domain) {
      query = query.contains('domain', [domain])
    }
    if (year) {
      query = query.eq('graduation_year', parseInt(year, 10))
    }
    if (cls) {
      query = query.eq('class', cls)
    }
    if (company) {
      query = query.ilike('company', `%${company}%`)
    }

    const { data } = await query.order('graduation_year', { ascending: false })
    setResults(data || [])
    setSearching(false)
  }, [highschool, currentUserId, name, profession, domain, year, cls, company])

  useEffect(() => {
    if (!loading && highschool) {
      search()
    }
  }, [loading, highschool, search])

  useEffect(() => {
    setSelectedPeople(new Set())
  }, [results])

  const markers = useMemo<UserMarker[]>(() => {
    const OFFSET = 0.008
    const byCity: Record<string, ProfileResult[]> = {}

    for (const r of results) {
      if (!r.city || !CITY_COORDINATES[r.city]) continue
      if (!byCity[r.city]) byCity[r.city] = []
      byCity[r.city].push(r)
    }

    const out: UserMarker[] = []
    for (const [city, people] of Object.entries(byCity)) {
      const [baseLat, baseLng] = CITY_COORDINATES[city]
      if (people.length === 1) {
        const p = people[0]
        out.push({ id: p.id, name: p.name, city, lat: baseLat, lng: baseLng })
      } else {
        people.forEach((p, i) => {
          const angle = (2 * Math.PI * i) / people.length
          out.push({
            id: p.id,
            name: p.name,
            city,
            lat: baseLat + OFFSET * Math.cos(angle),
            lng: baseLng + OFFSET * Math.sin(angle),
          })
        })
      }
    }

    return out
  }, [results])

  const allSelected = results.length > 0 && results.every(p => selectedPeople.has(p.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedPeople(new Set())
    } else {
      setSelectedPeople(new Set(results.map(p => p.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedPeople(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCreateGroup() {
    setCreatingGroup(true)
    const members = results.filter(p => selectedPeople.has(p.id))
    const nameParts = members.slice(0, 3).map(m => m.name.split(' ')[0])
    const suffix = members.length > 3 ? `, +${members.length - 3}` : ''
    const groupName = nameParts.join(', ') + suffix

    const res = await fetch('/api/mesaje/grupuri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, member_ids: [...selectedPeople] }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/mesaje/${data.id}`)
    }
    setCreatingGroup(false)
    setShowGroupConfirm(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  const inputFieldStyle = { border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24" style={{ background: 'var(--cream2)' }}>
      <div className="w-full max-w-sm space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>Cauta</span>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--border)', background: 'var(--white)' }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={viewMode === 'list'
              ? { background: 'var(--ink)', color: 'var(--white)' }
              : { color: 'var(--ink3)' }
            }
          >
            <List size={15} />
            Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={viewMode === 'map'
              ? { background: 'var(--ink)', color: 'var(--white)' }
              : { color: 'var(--ink3)' }
            }
          >
            <MapPin size={15} />
            Harta
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--white)', boxShadow: 'var(--shadow-s)' }}>
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--ink2)' }}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={14} style={{ color: 'var(--ink3)' }} />
              Filtre
            </span>
            <SlidersHorizontal
              size={12}
              className={`transition-transform ${filtersOpen ? 'rotate-90' : ''}`}
              style={{ color: 'var(--ink3)' }}
            />
          </button>

          {filtersOpen && (
            <div className="space-y-2 px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User size={14} className="absolute left-2.5 top-2 pointer-events-none" style={{ color: 'var(--ink3)' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nume"
                    className="w-full rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none"
                    style={inputFieldStyle}
                  />
                </div>
                <div className="relative">
                  <Building2 size={14} className="absolute left-2.5 top-2 pointer-events-none" style={{ color: 'var(--ink3)' }} />
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Companie"
                    className="w-full rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none"
                    style={inputFieldStyle}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SearchSelect
                  options={['', ...PROFESSIONS]}
                  value={profession}
                  onChange={setProfession}
                  placeholder="Profesie"
                  icon={<Briefcase size={14} />}
                />
                <SearchSelect
                  options={['', ...DOMAINS]}
                  value={domain}
                  onChange={setDomain}
                  placeholder="Domeniu"
                  icon={<Layers size={14} />}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <GraduationCap size={14} className="absolute left-2.5 top-2 pointer-events-none" style={{ color: 'var(--ink3)' }} />
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="Anul"
                    min={1950}
                    max={2030}
                    className="w-full rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={inputFieldStyle}
                  />
                </div>
                <SearchSelect
                  options={['', ...CLASS_OPTIONS]}
                  value={cls}
                  onChange={setCls}
                  placeholder="Clasa"
                  icon={<Users size={14} />}
                />
              </div>
              <button
                type="button"
                onClick={search}
                className="flex w-full items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-semibold transition-colors"
                style={{ background: 'var(--ink)', color: 'var(--white)' }}
              >
                <Search size={14} />
                Cauta
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {searching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
          </div>
        ) : viewMode === 'list' ? (
          results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--ink3)' }}>
              <Users size={32} className="mb-2" />
              <p className="text-sm">Niciun rezultat</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--ink3)' }}>{results.length} {results.length === 1 ? 'rezultat' : 'rezultate'}</p>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1 text-[0.72rem] transition-colors"
                  style={{ color: 'var(--ink3)' }}
                >
                  <Check size={12} /> {allSelected ? 'Deselectează' : 'Selectează tot'}
                </button>
              </div>
              {results.map(profile => (
                <div
                  key={profile.id}
                  className="flex items-center gap-0 rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--white)',
                    border: selectedPeople.has(profile.id) ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                    boxShadow: 'var(--shadow-s)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelect(profile.id)}
                    className="flex-shrink-0 flex items-center justify-center pl-3"
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                      style={{
                        background: selectedPeople.has(profile.id) ? 'var(--ink)' : 'transparent',
                        border: selectedPeople.has(profile.id) ? 'none' : '1.5px solid var(--ink3)',
                      }}
                    >
                      {selectedPeople.has(profile.id) && <Check size={13} color="var(--white)" strokeWidth={2.5} />}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0 px-3 py-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{profile.name}</p>
                      <span className="text-xs font-bold" style={{ color: 'var(--ink3)' }}>
                        {profile.graduation_year}{profile.class || ''}
                      </span>
                    </div>
                    {(profile.profession?.length > 0 || profile.domain?.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {profile.profession?.map(p => (
                          <span key={p} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--amber-soft)', border: '1px solid var(--border)', color: 'var(--amber-dark)' }}>
                            {p}
                          </span>
                        ))}
                        {profile.domain?.map(d => (
                          <span key={d} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal)', color: 'var(--teal)' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                    {profile.company && (
                      <p className="mt-1 text-[11px] flex items-center gap-1" style={{ color: 'var(--ink3)' }}>
                        <Building2 size={11} />
                        {profile.company}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="h-[400px] rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {markers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ background: 'var(--white)', color: 'var(--ink3)' }}>
                <MapPin size={32} className="mb-2" />
                <p className="text-sm">Niciun coleg cu locatie cunoscuta</p>
              </div>
            ) : (
              <MapView markers={markers} />
            )}
          </div>
        )}
      </div>

      {/* Floating group creation button */}
      {selectedPeople.size > 0 && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-6">
          <button
            type="button"
            onClick={() => setShowGroupConfirm(true)}
            className="flex items-center gap-2 rounded-sm px-5 py-3 text-[0.82rem] font-bold shadow-lg transition-transform active:scale-95"
            style={{ background: 'var(--ink)', color: 'var(--white)' }}
          >
            <UsersRound size={16} />
            Creează grup ({selectedPeople.size})
          </button>
        </div>
      )}

      {/* Group creation confirmation dialog */}
      {showGroupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div
            className="w-full max-w-xs rounded-lg p-6 space-y-4"
            style={{ background: 'var(--white)', boxShadow: 'var(--shadow-l)' }}
          >
            <p className="text-[0.92rem] font-bold text-center" style={{ color: 'var(--ink)' }}>
              Creează grup?
            </p>
            <p className="text-[0.75rem] text-center" style={{ color: 'var(--ink2)' }}>
              {selectedPeople.size} {selectedPeople.size === 1 ? 'persoană selectată' : 'persoane selectate'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowGroupConfirm(false)}
                className="flex-1 rounded-sm py-2.5 text-[0.82rem] font-semibold transition-colors"
                style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
              >
                Nu
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="flex-1 rounded-sm py-2.5 text-[0.82rem] font-semibold transition-opacity disabled:opacity-60"
                style={{ background: 'var(--ink)', color: 'var(--white)' }}
              >
                {creatingGroup ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Da'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
