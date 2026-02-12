'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Users, GraduationCap, Building2, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface ColleagueProfile {
  id: string
  name: string
  username: string
  graduation_year: number
  class: string | null
  profession: string[]
  domain: string[]
  company: string | null
}

interface CurrentUser {
  id: string
  highschool: string
  graduation_year: number
  class: string | null
}

export default function ColegiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [classmates, setClassmates] = useState<ColleagueProfile[]>([])
  const [yearmates, setYearmates] = useState<ColleagueProfile[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await getSupabase()
        .from('profiles')
        .select('id, highschool, graduation_year, class')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/autentificare'); return }
      setCurrentUser(profile as CurrentUser)

      const { data: yearData } = await getSupabase()
        .from('profiles')
        .select('id, name, username, graduation_year, class, profession, domain, company')
        .eq('highschool', profile.highschool)
        .eq('graduation_year', profile.graduation_year)
        .eq('onboarding_completed', true)
        .neq('id', profile.id)
        .order('name')

      const all = (yearData || []) as ColleagueProfile[]

      if (profile.class) {
        setClassmates(all.filter(p => p.class === profile.class))
        setYearmates(all.filter(p => p.class !== profile.class))
      } else {
        setYearmates(all)
      }

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary-700" />
      </main>
    )
  }

  if (!currentUser) return null

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <div className="min-w-0">
            <span className="text-sm font-bold leading-tight text-gray-900">Colegi</span>
            <p className="text-[10px] leading-tight text-gray-400 truncate">
              {currentUser.highschool} &bull; <span className="font-bold text-gray-600">{currentUser.graduation_year}</span>{currentUser.class && <> &bull; <span className="font-bold text-gray-600">{currentUser.class}</span></>}
            </p>
          </div>
        </div>

        {/* Classmates section */}
        {currentUser.class && (
          <section>
            <h2 className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Users size={14} />
              Clasa {currentUser.class} &bull; {currentUser.graduation_year}
            </h2>
            {classmates.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">Niciun coleg din clasa ta inca</p>
            ) : (
              <div className="space-y-2">
                {classmates.map(p => (
                  <ProfileCard key={p.id} profile={p} currentUserId={currentUser.id} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Year mates section */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <GraduationCap size={14} />
            Promotia {currentUser.graduation_year}
          </h2>
          {yearmates.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center">Niciun coleg din promotie inca</p>
          ) : (
            <div className="space-y-2">
              {yearmates.map(p => (
                <ProfileCard key={p.id} profile={p} currentUserId={currentUser.id} />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  )
}

function ProfileCard({ profile, currentUserId }: { profile: ColleagueProfile; currentUserId: string }) {
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
        .eq('user_id', profile.id)
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
      { conversation_id: newId, user_id: profile.id },
    ])

    router.push(`/mesaje/${newId}`)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white hover:border-primary-200 transition-colors">
      <Link href={`/colegi/${profile.id}`} className="flex-1 min-w-0 px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-400">@{profile.username}</p>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {profile.graduation_year}{profile.class || ''}
          </span>
        </div>
        {profile.company && (
          <p className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
            <Building2 size={11} className="text-gray-400" />
            {profile.company}
          </p>
        )}
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
