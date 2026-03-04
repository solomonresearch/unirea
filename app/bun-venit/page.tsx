'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Fireworks } from '@/components/Fireworks'
import { getSupabase } from '@/lib/supabase'
import { LogOut, Loader2, Briefcase, MapPin, Heart } from 'lucide-react'

interface Profile {
  name: string
  username: string
  highschool: string
  graduation_year: number
  onboarding_completed: boolean
  profession: string[] | null
  country: string | null
  city: string | null
  hobbies: string[] | null
  bio: string | null
}

export default function WelcomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFireworks, setShowFireworks] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowFireworks(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/autentificare')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('name, username, highschool, graduation_year, onboarding_completed, profession, country, city, hobbies, bio')
        .eq('id', user.id)
        .single()

      if (data && !data.onboarding_completed) {
        setRedirecting(true)
        setTimeout(() => router.push('/onboarding'), 4500)
        setProfile(data)
        setLoading(false)
        return
      }

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  async function handleLogout() {
    await getSupabase().auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-8" style={{ background: 'var(--cream2)' }}>
      {showFireworks && <Fireworks duration={4000} />}
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>uni<span style={{ color: 'var(--amber)' }}>.</span>rea</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm transition-colors"
            style={{ color: 'var(--ink2)', border: '1px solid var(--border)', background: 'var(--white)' }}
          >
            <LogOut size={16} />
            Iesire
          </button>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-m)' }}>
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
              Bun venit{profile ? `, ${profile.name}` : ''}!
            </h1>
            <p className="text-sm" style={{ color: 'var(--ink3)' }}>
              {redirecting
                ? 'Te redirectionam sa iti completezi profilul...'
                : 'Te-ai conectat cu succes la Unirea'}
            </p>
          </div>

          {profile && (
            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--ink3)' }}>Utilizator</span>
                <span className="font-medium" style={{ color: 'var(--ink)' }}>@{profile.username}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--ink3)' }}>Liceu</span>
                <span className="font-medium" style={{ color: 'var(--ink)' }}>{profile.highschool}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--ink3)' }}>Promotia</span>
                <span className="font-medium" style={{ color: 'var(--ink)' }}>{profile.graduation_year}</span>
              </div>
              {profile.profession && profile.profession.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1" style={{ color: 'var(--ink3)' }}><Briefcase size={12} /> Profesie</span>
                  <span className="font-medium text-right" style={{ color: 'var(--ink)' }}>{profile.profession.join(', ')}</span>
                </div>
              )}
              {(profile.city || profile.country) && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1" style={{ color: 'var(--ink3)' }}><MapPin size={12} /> Locatie</span>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {profile.hobbies && profile.hobbies.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1" style={{ color: 'var(--ink3)' }}><Heart size={12} /> Hobby-uri</span>
                  <span className="font-medium text-right" style={{ color: 'var(--ink)' }}>{profile.hobbies.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
