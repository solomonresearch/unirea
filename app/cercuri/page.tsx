'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import {
  Loader2, GraduationCap, MapPin, Heart, Music, Briefcase, Building2,
  Users, MessageCircle, ChevronRight, X,
} from 'lucide-react'
import Link from 'next/link'

type Mode = 'personal' | 'professional'
type CircleKey = 'highschool' | 'location' | 'hobbies' | 'interests' | 'profession' | 'background'

interface CircleConfig {
  label: string
  icon: typeof GraduationCap
  color: string
  bgColor: string
  borderColor: string
  shared: boolean
  mode?: Mode
  getDescription: (info: UserInfo) => string
}

interface UserInfo {
  highschool: string
  graduation_year: number
  city: string
  country: string
  hobbies: string[]
  profession: string[]
  domain: string[]
  company: string | null
}

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
  country: string
  hobbies: string[]
  profession: string[]
  domain: string[]
  company: string | null
  bio: string | null
  overlap_score: number
}

const CIRCLE_CONFIG: Record<CircleKey, CircleConfig> = {
  highschool: {
    label: 'Liceu',
    icon: GraduationCap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    shared: true,
    getDescription: (u) => `${u.highschool} '${String(u.graduation_year).slice(-2)}`,
  },
  location: {
    label: 'Locatie',
    icon: MapPin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    shared: true,
    getDescription: (u) => [u.city, u.country].filter(Boolean).join(', '),
  },
  hobbies: {
    label: 'Hobby-uri',
    icon: Heart,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    shared: false,
    mode: 'personal',
    getDescription: (u) => u.hobbies?.slice(0, 3).join(', ') || 'Adauga hobby-uri',
  },
  interests: {
    label: 'Interese',
    icon: Music,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    shared: false,
    mode: 'personal',
    getDescription: (u) => u.domain?.slice(0, 3).join(', ') || 'Adauga interese',
  },
  profession: {
    label: 'Profesie',
    icon: Briefcase,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    shared: false,
    mode: 'professional',
    getDescription: (u) => u.profession?.slice(0, 3).join(', ') || 'Adauga profesii',
  },
  background: {
    label: 'Background',
    icon: Building2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    shared: false,
    mode: 'professional',
    getDescription: (u) => [u.company, ...(u.domain || [])].filter(Boolean).slice(0, 3).join(', ') || 'Adauga background',
  },
}

const PERSONAL_CIRCLES: CircleKey[] = ['highschool', 'location', 'hobbies', 'interests']
const PROFESSIONAL_CIRCLES: CircleKey[] = ['highschool', 'location', 'profession', 'background']

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

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

      const { data: result, error } = await supabase.rpc('get_circles_data', { p_user_id: user.id })
      if (error) { console.error(error); setLoading(false); return }
      setData(result as CirclesData)
      setLoading(false)
    }
    init()
  }, [router])

  const visibleCircles = mode === 'personal' ? PERSONAL_CIRCLES : PROFESSIONAL_CIRCLES

  const switchMode = (newMode: Mode) => {
    const shared = activeFilters.filter(f => CIRCLE_CONFIG[f].shared)
    setActiveFilters(shared)
    setMode(newMode)
    setPeople([])
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

    if (!error && result) {
      setPeople(result as Person[])
    }
    setLoadingPeople(false)
  }, [activeFilters, currentUserId])

  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  const getIntersectionLabel = (): string | null => {
    if (activeFilters.length < 2) return null
    const sorted = [...activeFilters].sort()
    const key = sorted.join('+')
    const labels: Record<string, string> = {
      'highschool+location': 'Colegi din oras',
      'highschool+hobbies': 'Colegi cu hobby-uri comune',
      'hobbies+location': 'Vecini cu hobby-uri comune',
      'interests+location': 'Vecini cu interese comune',
      'highschool+hobbies+location': 'Cercul interior',
      'highschool+profession': 'Colegi in acelasi domeniu',
      'location+profession': 'Colegi locali',
      'background+location': 'Vecini cu background similar',
      'background+profession': 'Aceeasi cariera',
      'highschool+location+profession': 'Retea puternica',
    }
    return labels[key] || `${activeFilters.length} cercuri combinate`
  }

  if (loading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary-700" />
      </main>
    )
  }

  const intersectionLabel = getIntersectionLabel()

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-lg font-bold text-gray-900">Cercuri</span>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchMode('personal')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === 'personal'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => switchMode('professional')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === 'professional'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profesional
          </button>
        </div>

        {/* Circle chips */}
        <div className="flex flex-wrap gap-2">
          {visibleCircles.map(key => {
            const cfg = CIRCLE_CONFIG[key]
            const Icon = cfg.icon
            const count = data.circles[key] || 0
            const active = activeFilters.includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFilter(key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                  active
                    ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon size={14} />
                {cfg.label}
                <span className={`text-[10px] ${active ? 'opacity-80' : 'text-gray-400'}`}>
                  {count}
                </span>
                {active && <X size={12} className="ml-0.5" />}
              </button>
            )
          })}
        </div>

        {/* Intersection label */}
        {intersectionLabel && (
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 border border-primary-200 px-3 py-2">
            <Users size={14} className="text-primary-700" />
            <span className="text-xs font-medium text-primary-700">{intersectionLabel}</span>
            <span className="text-xs text-primary-500 ml-auto">{people.length} persoane</span>
          </div>
        )}

        {/* Content */}
        {activeFilters.length === 0 ? (
          <div className="space-y-2">
            {visibleCircles.map(key => {
              const cfg = CIRCLE_CONFIG[key]
              const Icon = cfg.icon
              const count = data.circles[key] || 0
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter(key)}
                  className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-gray-300 transition-colors"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${cfg.bgColor}`}>
                    <Icon size={20} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{cfg.label}</p>
                    <p className="text-xs text-gray-500 truncate">{cfg.getDescription(data.user_info)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : loadingPeople ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-primary-700" />
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} strokeWidth={1} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Nicio persoana gasita</p>
            <p className="text-xs text-gray-300 mt-1">Incearca alte cercuri</p>
          </div>
        ) : (
          <div className="space-y-2">
            {people.map(person => (
              <PersonCard key={person.id} person={person} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

function PersonCard({ person, currentUserId }: { person: Person; currentUserId: string }) {
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
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white hover:border-primary-200 transition-colors">
      <Link href={`/cercuri/${person.id}`} className="flex-1 min-w-0 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            {person.avatar_url ? (
              <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-700">{getInitials(person.name)}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{person.name}</p>
            <p className="text-xs text-gray-400">@{person.username}</p>
            {(person.profession?.length > 0 || person.company) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {person.company && (
                  <span className="text-[10px] text-gray-500">{person.company}</span>
                )}
                {person.profession?.slice(0, 2).map(p => (
                  <span key={p} className="inline-flex rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleMessage}
        disabled={startingChat}
        className="flex-shrink-0 mr-4 rounded-full p-2.5 text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {startingChat ? <Loader2 size={20} strokeWidth={2.5} className="animate-spin" /> : <MessageCircle size={20} strokeWidth={2.5} />}
      </button>
    </div>
  )
}
