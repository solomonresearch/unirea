'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { Loader2, MessageCircle, ChevronRight, Users, X, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { VennCanvas } from '@/components/circles/VennCanvas'
import { ModeToggle } from '@/components/circles/ModeToggle'
import { CircleChips } from '@/components/circles/CircleChips'
import {
  type Mode, type CircleKey, type UserInfo,
  CIRCLE_CONFIG, CIRCLE_COLORS, PERSONAL_CIRCLES, PROFESSIONAL_CIRCLES,
  INTERSECTION_DOTS,
} from '@/components/circles/circleConfig'

interface CirclesData {
  circles: Record<string, number>
  personal_intersections: Record<string, number>
  professional_intersections: Record<string, number>
  user_info: UserInfo
}

interface Person {
  id: string
  name: string
  username: string
  avatar_url: string | null
  highschool: string
  graduation_year: number
  city: string
  county: string | null
  country: string
  hobbies: string[]
  profession: string[]
  domain: string[]
  company: string | null
  bio: string | null
  overlap_score: number
}

interface Classmate {
  id: string
  name: string
  username: string
  graduation_year: number
  class: string | null
  profession: string[]
  domain: string[]
  company: string | null
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function CercuriPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('personal')
  const [activeFilters, setActiveFilters] = useState<CircleKey[]>([])
  const [data, setData] = useState<CirclesData | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [vennOpacity, setVennOpacity] = useState(1)
  const [showClassmates, setShowClassmates] = useState(false)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [yearmates, setYearmates] = useState<Classmate[]>([])
  const [userClass, setUserClass] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('highschool, graduation_year, class')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserClass(profile.class)

        const { data: yearData } = await supabase
          .from('profiles')
          .select('id, name, username, graduation_year, class, profession, domain, company')
          .eq('highschool', profile.highschool)
          .eq('graduation_year', profile.graduation_year)
          .eq('onboarding_completed', true)
          .neq('id', user.id)
          .order('name')

        const all = (yearData || []) as Classmate[]
        if (profile.class) {
          setClassmates(all.filter(p => p.class === profile.class))
          setYearmates(all.filter(p => p.class !== profile.class))
        } else {
          setYearmates(all)
        }
      }

      const { data: result, error } = await supabase.rpc('get_circles_data', { p_user_id: user.id })
      if (error) { console.error(error); setLoading(false); return }
      setData(result as CirclesData)
      setLoading(false)
    }
    init()
  }, [router])

  const visibleCircles = mode === 'personal' ? PERSONAL_CIRCLES : PROFESSIONAL_CIRCLES
  const intersectionCounts = mode === 'personal'
    ? data?.personal_intersections || {}
    : data?.professional_intersections || {}

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return
    setVennOpacity(0.2)
    setTimeout(() => {
      const shared = activeFilters.filter(f => CIRCLE_CONFIG[f].shared)
      setActiveFilters(shared)
      setMode(newMode)
      setPeople([])
      setTimeout(() => setVennOpacity(1), 50)
    }, 200)
  }

  const toggleFilter = (key: CircleKey) => {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  const fetchPeople = useCallback(async () => {
    if (activeFilters.length === 0 || !currentUserId) {
      setPeople([])
      return
    }
    setLoadingPeople(true)
    const primary = activeFilters[0]
    const intersect = activeFilters.slice(1)

    const { data: result, error } = await getSupabase().rpc('get_circle_people', {
      p_user_id: currentUserId,
      p_circle_type: primary,
      p_intersect_with: intersect,
      p_limit: 50,
      p_offset: 0,
    })

    if (!error && result) setPeople(result as Person[])
    setLoadingPeople(false)
  }, [activeFilters, currentUserId])

  useEffect(() => { fetchPeople() }, [fetchPeople])

  const getIntersectionLabel = (): string | null => {
    if (activeFilters.length < 2) return null
    const sorted = [...activeFilters].sort()
    const key = sorted.join('+')
    const labels: Record<string, string> = {
      'highschool+location': 'Colegi din oras',
      'highschool+hobbies': 'Colegi cu hobby-uri comune',
      'hobbies+location': 'Vecini cu hobby-uri comune',
      'interests+location': 'Vecini cu interese comune',
      'highschool+hobbies+location': 'Cercul interior ✨',
      'highschool+profession': 'Colegi in acelasi domeniu',
      'location+profession': 'Colegi locali',
      'background+location': 'Vecini cu background similar',
      'background+profession': 'Aceeasi cariera',
      'highschool+location+profession': 'Retea puternica ✨',
    }
    return labels[key] || `${activeFilters.length} cercuri combinate`
  }

  if (loading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: '#0D0F14' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: '#FF6B4A' }} />
      </main>
    )
  }

  const intersectionLabel = getIntersectionLabel()
  const dots = INTERSECTION_DOTS[mode]

  return (
    <main className="min-h-screen pb-24" style={{ background: '#0D0F14' }}>
      <style>{`
        @keyframes chipPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>

      <div className="max-w-sm mx-auto px-5 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Cercurile mele</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Descopera unde se suprapun lumile tale
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClassmates(prev => !prev)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: showClassmates ? 'rgba(255,107,74,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${showClassmates ? 'rgba(255,107,74,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: showClassmates ? '#FF6B4A' : 'rgba(255,255,255,0.45)',
            }}
          >
            <GraduationCap size={14} />
            Clasa
          </button>
        </div>

        {/* Classmates section */}
        {showClassmates && (
          <div className="space-y-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,107,74,0.05)', border: '1px solid rgba(255,107,74,0.1)' }}
          >
            {userClass && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px' }}
                >
                  <Users size={12} />
                  Clasa {userClass} &bull; {data?.user_info.graduation_year}
                </p>
                {classmates.length === 0 ? (
                  <p className="text-xs italic py-2 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Niciun coleg din clasa ta inca
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {classmates.map(p => (
                      <ClassmateRow key={p.id} person={p} currentUserId={currentUserId} />
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px' }}
            >
              <GraduationCap size={12} />
              Promotia {data?.user_info.graduation_year}
            </p>
            {yearmates.length === 0 ? (
              <p className="text-xs italic py-2 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Niciun coleg din promotie inca
              </p>
            ) : (
              <div className="space-y-1.5">
                {yearmates.map(p => (
                  <ClassmateRow key={p.id} person={p} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode Toggle */}
        <ModeToggle mode={mode} onSwitch={switchMode} />

        {/* Venn Canvas */}
        <div
          className="transition-all duration-200"
          style={{ opacity: vennOpacity, transform: vennOpacity < 1 ? 'scale(0.97)' : 'scale(1)' }}
        >
          <VennCanvas
            mode={mode}
            activeFilters={activeFilters}
            counts={intersectionCounts}
          />
        </div>

        {/* Filter Chips */}
        <CircleChips
          circles={visibleCircles}
          activeFilters={activeFilters}
          counts={data.circles}
          onToggle={toggleFilter}
        />

        {/* Intersection label */}
        {intersectionLabel && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)' }}
          >
            <Users size={14} style={{ color: '#FFD700' }} />
            <span className="text-xs font-semibold" style={{ color: '#FFD700' }}>{intersectionLabel}</span>
            <span className="text-xs ml-auto" style={{ color: 'rgba(255,215,0,0.6)' }}>{people.length} persoane</span>
          </div>
        )}

        {/* Content: circle cards or people list */}
        {activeFilters.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '1.2px' }}
            >
              {mode === 'personal' ? 'Cercurile tale personale' : 'Cercurile tale profesionale'}
            </p>
            {visibleCircles.map(key => {
              const cfg = CIRCLE_CONFIG[key]
              const count = data.circles[key] || 0
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter(key)}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg relative"
                    style={{ background: `${cfg.color}18` }}
                  >
                    <span className="text-lg">{cfg.emoji}</span>
                    {cfg.shared && (
                      <span className="absolute -bottom-0.5 -right-0.5 text-[8px]">🔄</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: '#fff' }}>{cfg.label}</p>
                      {cfg.shared && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: 'rgba(255,184,74,0.15)', color: '#FFB84A' }}
                        >
                          COMUN
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {cfg.getDescription(data.user_info)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{count}</span>
                    <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                </button>
              )
            })}

            {/* Intersection preview cards */}
            {dots.filter(d => (intersectionCounts[d.key] || 0) > 0).length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider pt-2"
                  style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '1.2px' }}
                >
                  Suprapuneri
                </p>
                {dots.filter(d => (intersectionCounts[d.key] || 0) > 0).map(dot => {
                  const count = intersectionCounts[dot.key] || 0
                  const is3Plus = dot.circles.length >= 3
                  return (
                    <button
                      key={dot.key}
                      type="button"
                      onClick={() => setActiveFilters(dot.circles as CircleKey[])}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg"
                        style={{ background: `${dot.color}18` }}
                      >
                        <span className="text-lg">{is3Plus ? '✨' : '🔗'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#fff' }}>{dot.label}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {count} persoane
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                          {dot.circles.map(c => (
                            <span key={c} className="text-xs">{CIRCLE_CONFIG[c as CircleKey].emoji}</span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.15)' }} />
                    </button>
                  )
                })}
              </>
            )}
          </div>
        ) : loadingPeople ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: '#FF6B4A' }} />
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} strokeWidth={1} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Nicio persoana gasita</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Incearca alte cercuri</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '1.2px' }}
              >
                {activeFilters.length >= 2 ? 'Suprapunere' : CIRCLE_CONFIG[activeFilters[0]].label}
              </p>
              <button
                type="button"
                onClick={() => setActiveFilters([])}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                <X size={12} /> Sterge filtrele
              </button>
            </div>
            {people.map(person => (
              <PersonCard key={person.id} person={person} currentUserId={currentUserId} activeFilters={activeFilters} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

function tagStyle(circleKey: CircleKey) {
  const c = CIRCLE_COLORS[circleKey]
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  return { bg: `rgba(${r},${g},${b},0.12)`, color: c }
}

function PersonTags({ person, activeFilters }: { person: Person; activeFilters: CircleKey[] }) {
  const tags: { label: string; bg: string; color: string }[] = []

  const showLocation = activeFilters.includes('location')
  const showHobbies = activeFilters.includes('hobbies')
  const showProfession = activeFilters.includes('profession')
  const showBackground = activeFilters.includes('background')
  const showInterests = activeFilters.includes('interests')
  const showDefault = !showLocation && !showHobbies && !showProfession && !showBackground && !showInterests

  if (showLocation) {
    const s = tagStyle('location')
    const loc = person.county
      ? `${person.city}, ${person.county}`
      : person.city
    if (loc) tags.push({ label: loc, ...s })
  }
  if (showHobbies) {
    const s = tagStyle('hobbies')
    person.hobbies?.slice(0, 3).forEach(h => tags.push({ label: h, ...s }))
  }
  if (showProfession || showDefault) {
    const s = tagStyle('profession')
    person.profession?.slice(0, 2).forEach(p => tags.push({ label: p, ...s }))
  }
  if (showInterests) {
    const s = tagStyle('interests')
    person.domain?.slice(0, 2).forEach(d => tags.push({ label: d, ...s }))
  }
  if (showBackground) {
    const s = tagStyle('background')
    person.domain?.slice(0, 2).forEach(d => tags.push({ label: d, ...s }))
    if (person.company) tags.push({ label: person.company, ...s })
  }

  if (tags.length === 0 && !showDefault && person.company) {
    return (
      <div className="mt-1">
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{person.company}</span>
      </div>
    )
  }

  if (tags.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {person.company && showDefault && (
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{person.company}</span>
      )}
      {tags.map(t => (
        <span key={t.label} className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: t.bg, color: t.color }}
        >
          {t.label}
        </span>
      ))}
    </div>
  )
}

function PersonCard({ person, currentUserId, activeFilters }: { person: Person; currentUserId: string; activeFilters: CircleKey[] }) {
  const router = useRouter()
  const [startingChat, setStartingChat] = useState(false)

  async function handleMessage(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (startingChat) return
    setStartingChat(true)
    const supabase = getSupabase()

    const { data: myConvos } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    if (myConvos && myConvos.length > 0) {
      const convoIds = myConvos.map(c => c.conversation_id)
      const { data: theirConvos } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', person.id)
        .in('conversation_id', convoIds)

      if (theirConvos && theirConvos.length > 0) {
        router.push(`/mesaje/${theirConvos[0].conversation_id}`)
        return
      }
    }

    const newId = crypto.randomUUID()
    const { error } = await supabase.from('conversations').insert({ id: newId })
    if (error) { setStartingChat(false); return }

    await supabase.from('conversation_participants').insert([
      { conversation_id: newId, user_id: currentUserId },
      { conversation_id: newId, user_id: person.id },
    ])

    router.push(`/mesaje/${newId}`)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl transition-colors"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <Link href={`/cercuri/${person.id}`} className="flex-1 min-w-0 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            {person.avatar_url ? (
              <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: 'rgba(255,107,74,0.15)' }}
              >
                <span className="text-xs font-bold" style={{ color: '#FF6B4A' }}>{getInitials(person.name)}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>{person.name}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>@{person.username}</p>
            <PersonTags person={person} activeFilters={activeFilters} />
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleMessage}
        disabled={startingChat}
        className="flex-shrink-0 mr-3 rounded-full p-2.5 transition-colors disabled:opacity-50"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        {startingChat
          ? <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
          : <MessageCircle size={18} strokeWidth={2.5} />
        }
      </button>
    </div>
  )
}

function ClassmateRow({ person, currentUserId }: { person: Classmate; currentUserId: string }) {
  const router = useRouter()
  const [startingChat, setStartingChat] = useState(false)

  async function handleMessage(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (startingChat) return
    setStartingChat(true)
    const supabase = getSupabase()

    const { data: myConvos } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    if (myConvos && myConvos.length > 0) {
      const convoIds = myConvos.map(c => c.conversation_id)
      const { data: theirConvos } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', person.id)
        .in('conversation_id', convoIds)

      if (theirConvos && theirConvos.length > 0) {
        router.push(`/mesaje/${theirConvos[0].conversation_id}`)
        return
      }
    }

    const newId = crypto.randomUUID()
    const { error } = await supabase.from('conversations').insert({ id: newId })
    if (error) { setStartingChat(false); return }

    await supabase.from('conversation_participants').insert([
      { conversation_id: newId, user_id: currentUserId },
      { conversation_id: newId, user_id: person.id },
    ])

    router.push(`/mesaje/${newId}`)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <Link href={`/cercuri/${person.id}`} className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>{person.name}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>@{person.username}</p>
          </div>
          <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {person.graduation_year}{person.class || ''}
          </span>
        </div>
        {(person.profession?.length > 0 || person.domain?.length > 0) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {person.profession?.slice(0, 2).map(p => (
              <span key={p} className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: 'rgba(123,97,255,0.12)', color: '#7B61FF' }}
              >
                {p}
              </span>
            ))}
            {person.domain?.slice(0, 2).map(d => (
              <span key={d} className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: 'rgba(74,156,255,0.12)', color: '#4A9CFF' }}
              >
                {d}
              </span>
            ))}
          </div>
        )}
      </Link>
      <button
        type="button"
        onClick={handleMessage}
        disabled={startingChat}
        className="flex-shrink-0 rounded-full p-2 transition-colors disabled:opacity-50"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {startingChat
          ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
          : <MessageCircle size={16} strokeWidth={2.5} />
        }
      </button>
    </div>
  )
}
