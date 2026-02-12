'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { SearchSelect } from '@/components/SearchSelect'
import { PROFESSIONS } from '@/lib/professions'
import { DOMAINS } from '@/lib/domains'
import { getSupabase } from '@/lib/supabase'
import {
  Loader2, Search, Briefcase, Layers, Building2,
  GraduationCap, Users, SlidersHorizontal,
} from 'lucide-react'

const CLASS_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

interface ProfileResult {
  id: string
  name: string
  graduation_year: number
  class: string | null
  profession: string[]
  domain: string[]
  company: string | null
}

export default function CautaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [highschool, setHighschool] = useState<string | null>(null)

  const [profession, setProfession] = useState('')
  const [domain, setDomain] = useState('')
  const [year, setYear] = useState('')
  const [cls, setCls] = useState('')
  const [company, setCompany] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)

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
      .select('id, name, graduation_year, class, profession, domain, company')
      .eq('highschool', highschool)
      .eq('onboarding_completed', true)
      .neq('id', currentUserId)

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
  }, [highschool, currentUserId, profession, domain, year, cls, company])

  useEffect(() => {
    if (!loading && highschool) {
      search()
    }
  }, [loading, highschool, search])

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

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-400" />
              Filtre
            </span>
            <SlidersHorizontal
              size={14}
              className={`text-gray-400 transition-transform ${filtersOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {filtersOpen && (
            <div className="space-y-2.5 px-4 pb-4">
              <div className="grid grid-cols-2 gap-2.5">
                <SearchSelect
                  options={['', ...PROFESSIONS]}
                  value={profession}
                  onChange={setProfession}
                  placeholder="Profesie"
                  icon={<Briefcase size={15} />}
                />
                <SearchSelect
                  options={['', ...DOMAINS]}
                  value={domain}
                  onChange={setDomain}
                  placeholder="Domeniu"
                  icon={<Layers size={15} />}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative">
                  <GraduationCap size={15} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="Anul"
                    min={1950}
                    max={2030}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <SearchSelect
                  options={['', ...CLASS_OPTIONS]}
                  value={cls}
                  onChange={setCls}
                  placeholder="Clasa"
                  icon={<Users size={15} />}
                />
              </div>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Companie"
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={search}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
              >
                <Search size={16} />
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
        ) : results.length === 0 ? (
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
        )}
      </div>

      <BottomNav />
    </main>
  )
}
