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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary-700" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-lg font-bold text-gray-900">Cauta</span>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-700 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={15} />
            Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-primary-700 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin size={15} />
            Harta
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-700"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-gray-400" />
              Filtre
            </span>
            <SlidersHorizontal
              size={12}
              className={`text-gray-400 transition-transform ${filtersOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {filtersOpen && (
            <div className="space-y-2 px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User size={14} className="absolute left-2.5 top-2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nume"
                    className="w-full rounded-lg border border-gray-300 pl-8 pr-2 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div className="relative">
                  <Building2 size={14} className="absolute left-2.5 top-2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Companie"
                    className="w-full rounded-lg border border-gray-300 pl-8 pr-2 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
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
                  <GraduationCap size={14} className="absolute left-2.5 top-2 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="Anul"
                    min={1950}
                    max={2030}
                    className="w-full rounded-lg border border-gray-300 pl-8 pr-2 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
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
            <Loader2 size={20} className="animate-spin text-primary-700" />
          </div>
        ) : viewMode === 'list' ? (
          results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users size={32} className="mb-2" />
              <p className="text-sm">Niciun rezultat</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">{results.length} {results.length === 1 ? 'rezultat' : 'rezultate'}</p>
              {results.map(profile => (
                <div
                  key={profile.id}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                    <span className="text-xs font-bold text-gray-500">
                      {profile.graduation_year}{profile.class || ''}
                    </span>
                  </div>
                  {(profile.profession?.length > 0 || profile.domain?.length > 0) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {profile.profession?.map(p => (
                        <span key={p} className="inline-flex items-center rounded-md bg-primary-50 border border-primary-200 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                          {p}
                        </span>
                      ))}
                      {profile.domain?.map(d => (
                        <span key={d} className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.company && (
                    <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
                      <Building2 size={11} />
                      {profile.company}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200">
            {markers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
                <MapPin size={32} className="mb-2" />
                <p className="text-sm">Niciun coleg cu locatie cunoscuta</p>
              </div>
            ) : (
              <MapView markers={markers} />
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
