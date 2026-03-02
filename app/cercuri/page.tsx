'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { Loader2, MessageCircle, ChevronRight, Users, X, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { VennCanvas } from '@/components/circles/VennCanvas'
import { CircleSummary } from '@/components/circles/ModeToggle'
import { CircleChips } from '@/components/circles/CircleChips'
import {
  type CircleKey, type UserInfo,
  CIRCLE_CONFIG, CIRCLE_COLORS, ALL_CIRCLES, ALL_POSITIONS, ALL_DOTS,
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

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function CercuriPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<CircleKey[]>([])
  const [data, setData] = useState<CirclesData | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
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

  const intersectionCounts = {
    ...(data?.personal_intersections || {}),
    ...(data?.professional_intersections || {}),
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
      'highschool+location': 'Colegi din oraș',
      'highschool+hobbies': 'Colegi cu hobby-uri comune',
      'hobbies+location': 'Vecini cu hobby-uri comune',
      'interests+location': 'Vecini cu interese comune',
      'hobbies+interests': 'Hobby-uri & interese comune',
      'highschool+hobbies+location': 'Cercul interior ✨',
      'highschool+profession': 'Colegi în același domeniu',
      'location+profession': 'Colegi locali',
      'background+location': 'Vecini cu background similar',
      'background+profession': 'Aceeași carieră',
      'highschool+location+profession': 'Rețea puternică ✨',
    }
    return labels[key] || `${activeFilters.length} cercuri combinate`
  }

  if (loading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  const intersectionLabel = getIntersectionLabel()

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--cream)' }}>
      {/* Sticky topbar */}
      <header
        className="sticky top-0 z-50 px-5 border-b"
        style={{
          background: 'var(--cream)',
          borderColor: 'var(--border)',
          paddingTop: '44px',
          paddingBottom: '14px',
        }}
      >
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            <h1
              className="font-display text-[1.6rem] leading-none"
              style={{ color: 'var(--ink)' }}
            >
              Cercuri
            </h1>
            <p className="text-[0.7rem] mt-0.5" style={{ color: 'var(--ink2)' }}>
              Descoperă conexiunile tale
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClassmates(prev => !prev)}
            className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[0.72rem] font-semibold transition-all"
            style={showClassmates ? {
              background: 'var(--amber-soft)',
              border: '1.5px solid var(--amber)',
              color: 'var(--amber-dark)',
            } : {
              background: 'var(--white)',
              border: '1.5px solid var(--border)',
              color: 'var(--ink2)',
              boxShadow: 'var(--shadow-s)',
            }}
          >
            <GraduationCap size={14} />
            Clasa
          </button>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-4 py-4 space-y-4">
        {/* Classmates section */}
        {showClassmates && (
          <div
            className="rounded-lg p-4 border space-y-3"
            style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
          >
            {userClass && (
              <>
                <p
                  className="text-[0.62rem] font-bold uppercase tracking-widest flex items-center gap-1.5"
                  style={{ color: 'var(--ink3)' }}
                >
                  <Users size={12} />
                  Clasa {userClass} · {data?.user_info.graduation_year}
                </p>
                {classmates.length === 0 ? (
                  <p className="text-[0.78rem] italic py-2 text-center" style={{ color: 'var(--ink3)' }}>
                    Niciun coleg din clasa ta încă
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

            <p
              className="text-[0.62rem] font-bold uppercase tracking-widest flex items-center gap-1.5"
              style={{ color: 'var(--ink3)' }}
            >
              <GraduationCap size={12} />
              Promoția {data?.user_info.graduation_year}
            </p>
            {yearmates.length === 0 ? (
              <p className="text-[0.78rem] italic py-2 text-center" style={{ color: 'var(--ink3)' }}>
                Niciun coleg din promoție încă
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

        {/* Circle summary */}
        <CircleSummary />

        {/* Venn Canvas */}
        <VennCanvas
          circles={ALL_CIRCLES}
          positions={ALL_POSITIONS}
          dots={ALL_DOTS}
          activeFilters={activeFilters}
          counts={intersectionCounts}
        />

        {/* Filter Chips */}
        <CircleChips
          circles={ALL_CIRCLES}
          activeFilters={activeFilters}
          counts={data.circles}
          onToggle={toggleFilter}
        />

        {/* Intersection label */}
        {intersectionLabel && (
          <div
            className="flex items-center gap-2 rounded-sm px-3 py-2.5"
            style={{ background: 'var(--amber-soft)', border: '1px solid rgba(232,150,58,0.3)' }}
          >
            <Users size={14} style={{ color: 'var(--amber-dark)' }} />
            <span className="text-[0.75rem] font-semibold" style={{ color: 'var(--amber-dark)' }}>{intersectionLabel}</span>
            <span className="text-[0.72rem] ml-auto" style={{ color: 'var(--amber)' }}>{people.length} persoane</span>
          </div>
        )}

        {/* Content: circle cards or people list */}
        {activeFilters.length === 0 ? (
          <div className="space-y-2">
            <p
              className="text-[0.64rem] font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink3)' }}
            >
              Cercurile tale
            </p>
            {ALL_CIRCLES.map(key => {
              const cfg = CIRCLE_CONFIG[key]
              const count = data.circles[key] || 0
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter(key)}
                  className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors"
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-s)',
                  }}
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-sm"
                    style={{ background: 'var(--cream2)' }}
                  >
                    <span className="text-lg">{cfg.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-bold" style={{ color: 'var(--ink)' }}>{cfg.label}</p>
                    <p className="text-[0.68rem] truncate" style={{ color: 'var(--ink2)' }}>
                      {cfg.getDescription(data.user_info)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.82rem] font-bold" style={{ color: 'var(--ink2)' }}>{count}</span>
                    <ChevronRight size={16} style={{ color: 'var(--ink3)' }} />
                  </div>
                </button>
              )
            })}

            {/* Intersection preview cards */}
            {ALL_DOTS.filter(d => (intersectionCounts[d.key] || 0) > 0).length > 0 && (
              <>
                <p
                  className="text-[0.64rem] font-bold uppercase tracking-widest pt-2"
                  style={{ color: 'var(--ink3)' }}
                >
                  Suprapuneri
                </p>
                {ALL_DOTS.filter(d => (intersectionCounts[d.key] || 0) > 0).map(dot => {
                  const count = intersectionCounts[dot.key] || 0
                  const is3Plus = dot.circles.length >= 3
                  return (
                    <button
                      key={dot.key}
                      type="button"
                      onClick={() => setActiveFilters(dot.circles as CircleKey[])}
                      className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors"
                      style={{
                        background: 'var(--white)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-s)',
                      }}
                    >
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-sm"
                        style={{ background: 'var(--amber-soft)' }}
                      >
                        <span className="text-lg">{is3Plus ? '✨' : '🔗'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.82rem] font-bold" style={{ color: 'var(--ink)' }}>{dot.label}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[0.68rem]" style={{ color: 'var(--ink2)' }}>
                            {count} persoane
                          </span>
                          <span className="text-[0.68rem]" style={{ color: 'var(--border)' }}>·</span>
                          {dot.circles.map(c => (
                            <span key={c} className="text-[0.68rem]">{CIRCLE_CONFIG[c as CircleKey].emoji}</span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--ink3)' }} />
                    </button>
                  )
                })}
              </>
            )}
          </div>
        ) : loadingPeople ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} strokeWidth={1} className="mx-auto mb-2" style={{ color: 'var(--ink3)' }} />
            <p className="text-[0.82rem]" style={{ color: 'var(--ink3)' }}>Nicio persoană găsită</p>
            <p className="text-[0.72rem] mt-1" style={{ color: 'var(--ink3)' }}>Încearcă alte cercuri</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p
                className="text-[0.64rem] font-bold uppercase tracking-widest"
                style={{ color: 'var(--ink3)' }}
              >
                {activeFilters.length >= 2 ? 'Suprapunere' : CIRCLE_CONFIG[activeFilters[0]].label}
              </p>
              <button
                type="button"
                onClick={() => setActiveFilters([])}
                className="flex items-center gap-1 text-[0.72rem] transition-colors"
                style={{ color: 'var(--ink3)' }}
              >
                <X size={12} /> Șterge filtrele
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
    const loc = person.county ? `${person.city}, ${person.county}` : person.city
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
        <span className="text-[0.68rem]" style={{ color: 'var(--ink2)' }}>{person.company}</span>
      </div>
    )
  }

  if (tags.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {person.company && showDefault && (
        <span className="text-[0.68rem]" style={{ color: 'var(--ink2)' }}>{person.company}</span>
      )}
      {tags.map(t => (
        <span
          key={t.label}
          className="inline-flex rounded px-1.5 py-0.5 text-[0.62rem] font-medium"
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

  const bg = avatarColor(person.name)

  return (
    <div
      className="flex items-center gap-0 rounded-lg overflow-hidden"
      style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
    >
      <Link href={`/cercuri/${person.id}`} className="flex-1 min-w-0 px-4 py-3">
        <div className="flex items-start gap-3">
          <div
            className="w-[46px] h-[46px] rounded-md flex items-center justify-center text-white text-[0.82rem] font-bold flex-shrink-0"
            style={{ background: person.avatar_url ? 'transparent' : bg }}
          >
            {person.avatar_url
              ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover rounded-md" />
              : getInitials(person.name)
            }
          </div>
          <div className="min-w-0">
            <p className="text-[0.82rem] font-bold" style={{ color: 'var(--ink)' }}>{person.name}</p>
            <p className="text-[0.66rem]" style={{ color: 'var(--ink2)' }}>@{person.username}</p>
            <PersonTags person={person} activeFilters={activeFilters} />
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleMessage}
        disabled={startingChat}
        className="flex-shrink-0 mr-3 rounded-sm px-3 py-2 transition-opacity disabled:opacity-50"
        style={{ background: 'var(--ink)', color: 'var(--white)' }}
      >
        {startingChat
          ? <Loader2 size={15} className="animate-spin" />
          : <MessageCircle size={15} />
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
    <div className="flex items-center gap-3 rounded-sm px-3 py-2" style={{ background: 'var(--cream2)' }}>
      <Link href={`/cercuri/${person.id}`} className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.82rem] font-bold" style={{ color: 'var(--ink)' }}>{person.name}</p>
            <p className="text-[0.68rem]" style={{ color: 'var(--ink2)' }}>@{person.username}</p>
          </div>
          <span className="text-[0.72rem] font-bold" style={{ color: 'var(--ink2)' }}>
            {person.graduation_year}{person.class || ''}
          </span>
        </div>
        {(person.profession?.length > 0 || person.domain?.length > 0) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {person.profession?.slice(0, 2).map(p => (
              <span
                key={p}
                className="inline-flex rounded px-1.5 py-0.5 text-[0.62rem] font-medium"
                style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}
              >
                {p}
              </span>
            ))}
            {person.domain?.slice(0, 2).map(d => (
              <span
                key={d}
                className="inline-flex rounded px-1.5 py-0.5 text-[0.62rem] font-medium"
                style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)' }}
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
        style={{ color: 'var(--ink3)' }}
      >
        {startingChat
          ? <Loader2 size={16} className="animate-spin" />
          : <MessageCircle size={16} />
        }
      </button>
    </div>
  )
}
