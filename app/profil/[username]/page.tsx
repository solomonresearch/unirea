'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { BottomNav } from '@/components/BottomNav'
import { Logo } from '@/components/Logo'
import { NotificationBell } from '@/components/NotificationBell'
import Link from 'next/link'
import {
  Loader2, GraduationCap, MapPin, Briefcase, Layers,
  Building2, Heart, Sparkles, UserX, ArrowLeft, MessageCircle, Search,
} from 'lucide-react'

interface PublicProfile {
  id: string
  name: string
  username: string
  avatar_url: string | null
  highschool: string
  graduation_year: number
  class: string | null
  bio: string | null
  profession: string[]
  domain: string[]
  company: string | null
  city: string | null
  country: string | null
  hobbies: string[]
  archived_at: string | null
}

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: me } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single()
        if (me) {
          setCurrentUserAvatar(me.avatar_url)
          setCurrentUserName(me.name)
        }
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, highschool, graduation_year, class, bio, profession, domain, company, city, country, hobbies, archived_at')
        .eq('username', username)
        .eq('onboarding_completed', true)
        .single()

      if (!data) {
        setNotFound(true)
      } else {
        setProfile(data as PublicProfile)
      }
      setLoading(false)
    }
    load()
  }, [username])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: 'var(--cream2)' }}>
        <UserX size={48} style={{ color: 'var(--ink3)' }} />
        <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--ink)' }}>Profilul nu a fost găsit</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--ink3)' }}>Utilizatorul @{username} nu există.</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold"
          style={{ background: 'var(--ink)', color: 'var(--white)' }}
        >
          <ArrowLeft size={14} />
          Înapoi
        </button>
        <BottomNav />
      </main>
    )
  }

  if (!profile) return null

  // Archived account
  if (profile.archived_at) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: 'var(--cream2)' }}>
        <UserX size={48} style={{ color: 'var(--ink3)' }} />
        <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--ink)' }}>Cont dezactivat</p>
        <p className="mt-1 text-xs text-center" style={{ color: 'var(--ink3)' }}>
          Acest utilizator nu mai are un cont activ.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold"
          style={{ background: 'var(--ink)', color: 'var(--white)' }}
        >
          <ArrowLeft size={14} />
          Înapoi
        </button>
        <BottomNav />
      </main>
    )
  }

  // If viewing own profile, redirect to setari
  if (currentUserId && currentUserId === profile.id) {
    router.replace('/setari')
    return null
  }

  const ini = getInitials(profile.name)
  const location = [profile.city, profile.country].filter(Boolean).join(', ')

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24" style={{ background: 'var(--cream2)' }}>
      <div className="w-full max-w-sm space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} style={{ color: 'var(--ink3)' }}>
            <ArrowLeft size={20} />
          </button>
          <Logo size={28} />
          <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>Profil</span>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/cauta"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xxs font-semibold"
              style={{ background: 'var(--white)', border: '1.5px solid var(--border)', color: 'var(--ink3)', boxShadow: 'var(--shadow-s)' }}
            >
              <Search size={14} strokeWidth={1.75} />
              Cauta
            </Link>
            <NotificationBell />
            <Link href="/setari" className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden" style={{ border: '2px solid var(--border)' }}>
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt={currentUserName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xxs font-bold" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
                  {getInitials(currentUserName || '?')}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Profile card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
        >
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: profile.avatar_url ? 'transparent' : avatarColor(profile.name) }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{ini}</span>
              )}
            </div>

            {/* Name & username */}
            <h1 className="mt-3 text-base font-bold" style={{ color: 'var(--ink)' }}>{profile.name}</h1>
            <p className="text-xxs" style={{ color: 'var(--ink3)' }}>@{profile.username}</p>

            {/* School info */}
            <p className="text-xxs flex items-center gap-1 mt-1.5" style={{ color: 'var(--ink3)' }}>
              <GraduationCap size={12} />
              {profile.highschool} · <span className="font-bold" style={{ color: 'var(--ink2)' }}>{profile.graduation_year}{profile.class || ''}</span>
            </p>

            {/* Location */}
            {location && (
              <p className="text-xxs flex items-center gap-1 mt-0.5" style={{ color: 'var(--ink3)' }}>
                <MapPin size={12} />
                {location}
              </p>
            )}

            {/* Stats */}
            <div className="flex w-full mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              {[
                { label: 'Hobby-uri', value: profile.hobbies?.length || 0 },
                { label: 'Profesii', value: profile.profession?.length || 0 },
                { label: 'Domenii', value: profile.domain?.length || 0 },
              ].map((stat, i, arr) => (
                <div
                  key={stat.label}
                  className="flex-1 text-center"
                  style={i < arr.length - 1 ? { borderRight: '1px solid var(--border)' } : {}}
                >
                  <span className="block font-display text-[1.25rem] leading-none" style={{ color: 'var(--ink)' }}>
                    {stat.value}
                  </span>
                  <span className="text-3xs uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: 'var(--amber)' }} />
              <span className="text-xxs font-bold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Despre</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>{profile.bio}</p>
          </div>
        )}

        {/* Profession & Domain */}
        {(profile.profession?.length > 0 || profile.domain?.length > 0) && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={14} style={{ color: 'var(--amber)' }} />
              <span className="text-xxs font-bold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Profesie și Domeniu</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
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
          </div>
        )}

        {/* Company */}
        {profile.company && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
          >
            <div className="flex items-center gap-2">
              <Building2 size={14} style={{ color: 'var(--amber)' }} />
              <span className="text-xxs font-bold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Companie</span>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--ink2)' }}>{profile.company}</p>
          </div>
        )}

        {/* Hobbies */}
        {profile.hobbies?.length > 0 && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Heart size={14} style={{ color: 'var(--amber)' }} />
              <span className="text-xxs font-bold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Hobby-uri</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.hobbies.map(h => (
                <span key={h} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--cream2)', border: '1px solid var(--border)', color: 'var(--ink2)' }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Message button */}
        {currentUserId && (
          <button
            type="button"
            onClick={async () => {
              const supabase = getSupabase()
              // Check if DM conversation already exists
              const { data: myConvos } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', currentUserId)

              if (myConvos) {
                const { data: theirConvos } = await supabase
                  .from('conversation_participants')
                  .select('conversation_id')
                  .eq('user_id', profile.id)
                  .in('conversation_id', myConvos.map(c => c.conversation_id))

                if (theirConvos) {
                  for (const tc of theirConvos) {
                    const { data: conv } = await supabase
                      .from('conversations')
                      .select('id, is_group')
                      .eq('id', tc.conversation_id)
                      .eq('is_group', false)
                      .single()
                    if (conv) {
                      router.push(`/mesaje/${conv.id}`)
                      return
                    }
                  }
                }
              }

              // Create new DM
              const newId = crypto.randomUUID()
              await supabase.from('conversations').insert({ id: newId, is_group: false })
              await supabase.from('conversation_participants').insert([
                { conversation_id: newId, user_id: currentUserId },
                { conversation_id: newId, user_id: profile.id },
              ])
              router.push(`/mesaje/${newId}`)
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: 'var(--ink)', color: 'var(--white)', boxShadow: 'var(--shadow-s)' }}
          >
            <MessageCircle size={16} />
            Trimite mesaj
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
