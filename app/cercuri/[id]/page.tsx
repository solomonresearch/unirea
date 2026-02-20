'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { HOBBY_OPTIONS } from '@/lib/hobbies'
import { getSupabase } from '@/lib/supabase'
import {
  Loader2, ArrowLeft, Sparkles, Briefcase, Layers, Building2,
  MapPin, Heart, Mail, Phone, GraduationCap, MessageCircle,
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
  hobbies: string[]
  bio: string
  avatar_url: string | null
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function ColegProfilePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [startingChat, setStartingChat] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

      const { data } = await getSupabase()
        .from('profiles')
        .select('id, name, username, email, phone, highschool, graduation_year, class, profession, domain, company, country, city, hobbies, bio, avatar_url')
        .eq('id', params.id)
        .eq('onboarding_completed', true)
        .single()

      if (!data) { router.push('/cercuri'); return }
      setProfile(data as Profile)
      setLoading(false)
    }
    load()
  }, [router, params.id])

  async function handleStartChat() {
    if (!profile || startingChat) return
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary-700" />
      </main>
    )
  }

  if (!profile) return null

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <Logo size={28} />
          <span className="text-lg font-bold text-gray-900">Profil</span>
        </div>

        {/* Profile Hero */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-24 h-24 rounded-full overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">{getInitials(profile.name)}</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
              <GraduationCap size={12} />
              {profile.highschool} &bull; <span className="font-bold text-gray-600">{profile.graduation_year}{profile.class || ''}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
              <MapPin size={12} />
              {[profile.city, profile.country].filter(Boolean).join(', ') || 'Nicio locatie'}
            </p>
          </div>
        </div>

        {/* Send message button */}
        {currentUserId !== profile.id && (
          <button
            type="button"
            onClick={handleStartChat}
            disabled={startingChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
          >
            {startingChat ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            Trimite mesaj
          </button>
        )}

        {/* Bio */}
        {profile.bio && (
          <Section title="Despre" icon={<Sparkles size={16} className="text-primary-700" />}>
            <p className="text-sm text-gray-600">{profile.bio}</p>
          </Section>
        )}

        {/* Profession, Domain & Company */}
        {(profile.profession?.length > 0 || profile.domain?.length > 0 || profile.company) && (
          <Section title="Profesie si Domeniu" icon={<Briefcase size={16} className="text-primary-700" />}>
            {profile.company && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1.5">
                <Building2 size={12} className="text-gray-400" />
                {profile.company}
              </p>
            )}
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
          </Section>
        )}

        {/* Hobbies */}
        {profile.hobbies?.length > 0 && (
          <Section title="Hobby-uri" icon={<Heart size={16} className="text-primary-700" />}>
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
          </Section>
        )}

        {/* Contact */}
        <Section title="Contact" icon={<Mail size={16} className="text-primary-700" />}>
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
        </Section>

        <div className="h-6" />
      </div>

      <BottomNav />
    </main>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}
