'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { Loader2, MessageCircle, ChevronRight, Users, X, Calendar, Search, Check, UsersRound } from 'lucide-react'
import { TopBar } from '@/components/TopBar'
import Link from 'next/link'
import { VennCanvas } from '@/components/circles/VennCanvas'
import { CircleChips } from '@/components/circles/CircleChips'
import {
  type CircleKey, type UserInfo,
  CIRCLE_CONFIG, CIRCLE_COLORS, ALL_CIRCLES, ALL_POSITIONS, ALL_DOTS,
} from '@/components/circles/circleConfig'
import { SchoolGate } from '@/components/SchoolGate'
import { MentorshipSuggestions, type MentorSuggestion } from '@/components/mentorship/MentorshipSuggestions'

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
  const [generationFilter, setGenerationFilter] = useState(false)
  const [userGradYear, setUserGradYear] = useState<number>(0)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [showGroupConfirm, setShowGroupConfirm] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [mentorshipRole, setMentorshipRole] = useState<'mentor' | 'mentee' | 'both' | null>(null)
  // When role=both, mentorSuggestions = mentors for me; menteeSuggestions = mentees I can help
  const [mentorSuggestions, setMentorSuggestions] = useState<MentorSuggestion[]>([])
  const [menteeSuggestions, setMenteeSuggestions] = useState<MentorSuggestion[]>([])

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('highschool, graduation_year, class, avatar_url, name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserGradYear(profile.graduation_year)
        setUserAvatar(profile.avatar_url)
        setUserName(profile.name || '')
      }

      const { data: result, error } = await supabase.rpc('get_circles_data', { p_user_id: user.id })
      if (error) { console.error(error); setLoading(false); return }
      setData(result as CirclesData)
      setLoading(false)

      // Load mentorship suggestions (non-blocking)
      const { data: myMentorship } = await supabase
        .from('mentorship_profiles')
        .select('mentor_active, mentee_active')
        .eq('user_id', user.id)
        .maybeSingle()

      const isMentor = myMentorship?.mentor_active ?? false
      const isMentee = myMentorship?.mentee_active ?? false

      if (!isMentor && !isMentee) return

      const role = isMentor && isMentee ? 'both' : isMentor ? 'mentor' : 'mentee'
      setMentorshipRole(role)

      // Fetch ranked suggestions from the API in parallel where applicable
      const fetches: Promise<void>[] = []

      if (isMentee) {
        fetches.push(
          fetch('/api/mentorship/suggestions?for=mentors')
            .then(r => r.json())
            .then(({ suggestions }) => setMentorSuggestions(suggestions ?? []))
            .catch(() => {})
        )
      }

      if (isMentor) {
        fetches.push(
          fetch('/api/mentorship/suggestions?for=mentees')
            .then(r => r.json())
            .then(({ suggestions }) => setMenteeSuggestions(suggestions ?? []))
            .catch(() => {})
        )
      }

      await Promise.all(fetches)
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

  useEffect(() => {
    setSelectedPeople(new Set())
  }, [activeFilters, generationFilter])

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

  const filteredPeople = generationFilter && userGradYear
    ? people.filter(p => Math.abs(p.graduation_year - userGradYear) <= 2)
    : people

  const allSelected = filteredPeople.length > 0 && filteredPeople.every(p => selectedPeople.has(p.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedPeople(new Set())
    } else {
      setSelectedPeople(new Set(filteredPeople.map(p => p.id)))
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
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreatingGroup(false); return }

    const members = filteredPeople.filter(p => selectedPeople.has(p.id))
    const nameParts = members.slice(0, 3).map(m => m.name.split(' ')[0])
    const suffix = members.length > 3 ? `, +${members.length - 3}` : ''
    const groupName = nameParts.join(', ') + suffix

    const newId = crypto.randomUUID()
    const inviteCode = crypto.randomUUID().slice(0, 8)
    const { error } = await supabase.from('conversations').insert({
      id: newId,
      is_group: true,
      name: groupName,
      invite_code: inviteCode,
    })
    if (error) { setCreatingGroup(false); return }

    await supabase.from('conversation_participants').insert(
      [user.id, ...selectedPeople].map(uid => ({ conversation_id: newId, user_id: uid }))
    )

    router.push(`/mesaje/${newId}`)
    setCreatingGroup(false)
    setShowGroupConfirm(false)
  }

  const intersectionLabel = getIntersectionLabel()

  return (
    <SchoolGate>
    <main className="min-h-screen pb-24" style={{ background: 'var(--cream)' }}>
      <TopBar
        title="Cercuri"
        institutionName={data?.user_info.highschool}
        userAvatar={userAvatar}
        userName={userName}
        rightSlot={
          <Link
            href="/cauta"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xxs font-semibold"
            style={{ background: 'var(--white)', border: '1.5px solid var(--border)', color: 'var(--ink3)', boxShadow: 'var(--shadow-s)' }}
          >
            <Search size={14} strokeWidth={1.75} />
            Cauta
          </Link>
        }
      />

      <div className="max-w-sm mx-auto px-4 py-4 space-y-3">
        {/* Mentorship suggestions */}
        {mentorshipRole && (
          mentorshipRole === 'both' ? (
            <div className="space-y-3">
              <MentorshipSuggestions role="mentee" suggestions={mentorSuggestions} />
              <MentorshipSuggestions role="mentor" suggestions={menteeSuggestions} />
            </div>
          ) : mentorshipRole === 'mentee' ? (
            <MentorshipSuggestions role="mentee" suggestions={mentorSuggestions} />
          ) : (
            <MentorshipSuggestions role="mentor" suggestions={menteeSuggestions} />
          )
        )}

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
          generationFilter={generationFilter}
          onGenerationToggle={() => setGenerationFilter(prev => !prev)}
        />

        {/* Intersection label */}
        {intersectionLabel && (
          <div
            className="flex items-center gap-2 rounded-sm px-3 py-2.5"
            style={{ background: 'var(--amber-soft)', border: '1px solid rgba(232,150,58,0.3)' }}
          >
            <Users size={14} style={{ color: 'var(--amber-dark)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--amber-dark)' }}>{intersectionLabel}</span>
            <span className="text-xxs ml-auto" style={{ color: 'var(--amber)' }}>{filteredPeople.length} persoane</span>
          </div>
        )}

        {/* Content: intersection cards or people list */}
        {activeFilters.length === 0 ? (
          <div className="space-y-2">
            {ALL_DOTS.filter(d => (intersectionCounts[d.key] || 0) > 0).length > 0 && (
              <>
                <p
                  className="text-2xs font-bold uppercase tracking-widest"
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
                        <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{dot.label}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xxs" style={{ color: 'var(--ink2)' }}>
                            {count} persoane
                          </span>
                          <span className="text-xxs" style={{ color: 'var(--border)' }}>·</span>
                          {dot.circles.map(c => (
                            <span key={c} className="text-xxs">{CIRCLE_CONFIG[c as CircleKey].emoji}</span>
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
        ) : filteredPeople.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} strokeWidth={1} className="mx-auto mb-2" style={{ color: 'var(--ink3)' }} />
            <p className="text-xs" style={{ color: 'var(--ink3)' }}>Nicio persoană găsită</p>
            <p className="text-xxs mt-1" style={{ color: 'var(--ink3)' }}>Încearcă alte cercuri</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p
                className="text-2xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--ink3)' }}
              >
                {activeFilters.length >= 2 ? 'Suprapunere' : CIRCLE_CONFIG[activeFilters[0]].label}
              </p>
              <div className="flex items-center gap-3">
                {filteredPeople.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1 text-xxs transition-colors"
                    style={{ color: 'var(--ink3)' }}
                  >
                    <Check size={12} /> {allSelected ? 'Deselectează' : 'Selectează tot'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveFilters([])}
                  className="flex items-center gap-1 text-xxs transition-colors"
                  style={{ color: 'var(--ink3)' }}
                >
                  <X size={12} /> Șterge filtrele
                </button>
              </div>
            </div>
            {filteredPeople.map(person => (
              <PersonCard
                key={person.id}
                person={person}
                currentUserId={currentUserId}
                activeFilters={activeFilters}
                selected={selectedPeople.has(person.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating group creation button */}
      {selectedPeople.size > 0 && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-6">
          <button
            type="button"
            onClick={() => setShowGroupConfirm(true)}
            className="flex items-center gap-2 rounded-sm px-5 py-3 text-xs font-bold shadow-lg transition-transform active:scale-95"
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
            <p className="text-sm font-bold text-center" style={{ color: 'var(--ink)' }}>
              Creează grup?
            </p>
            <p className="text-xs text-center" style={{ color: 'var(--ink2)' }}>
              {selectedPeople.size} {selectedPeople.size === 1 ? 'persoană selectată' : 'persoane selectate'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowGroupConfirm(false)}
                className="flex-1 rounded-sm py-2.5 text-xs font-semibold transition-colors"
                style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
              >
                Nu
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="flex-1 rounded-sm py-2.5 text-xs font-semibold transition-opacity disabled:opacity-60"
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
    </SchoolGate>
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
        <span className="text-xxs" style={{ color: 'var(--ink2)' }}>{person.company}</span>
      </div>
    )
  }

  if (tags.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {person.company && showDefault && (
        <span className="text-xxs" style={{ color: 'var(--ink2)' }}>{person.company}</span>
      )}
      {tags.map(t => (
        <span
          key={t.label}
          className="inline-flex rounded px-1.5 py-0.5 text-2xs font-medium"
          style={{ background: t.bg, color: t.color }}
        >
          {t.label}
        </span>
      ))}
    </div>
  )
}

function PersonCard({ person, currentUserId, activeFilters, selected, onSelect }: {
  person: Person
  currentUserId: string
  activeFilters: CircleKey[]
  selected: boolean
  onSelect: (id: string) => void
}) {
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
      style={{
        background: 'var(--white)',
        border: selected ? '1.5px solid var(--ink)' : '1px solid var(--border)',
        boxShadow: 'var(--shadow-s)',
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(person.id)}
        className="flex-shrink-0 flex items-center justify-center pl-3"
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{
            background: selected ? 'var(--ink)' : 'transparent',
            border: selected ? 'none' : '1.5px solid var(--ink3)',
          }}
        >
          {selected && <Check size={13} color="var(--white)" strokeWidth={2.5} />}
        </div>
      </button>
      <div className="flex-1 min-w-0 px-3 py-3">
        <div className="flex items-start gap-3">
          <div
            className="w-[46px] h-[46px] rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: person.avatar_url ? 'transparent' : bg }}
          >
            {person.avatar_url
              ? <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover rounded-md" />
              : getInitials(person.name)
            }
          </div>
          <div className="min-w-0">
            <Link href={`/profil/${person.username}`} className="text-xs font-bold hover:underline" style={{ color: 'var(--ink)' }}>{person.name}</Link>
            <Link href={`/profil/${person.username}`} className="block text-2xs hover:underline" style={{ color: 'var(--ink2)' }}>@{person.username}</Link>
            <PersonTags person={person} activeFilters={activeFilters} />
          </div>
        </div>
      </div>
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

