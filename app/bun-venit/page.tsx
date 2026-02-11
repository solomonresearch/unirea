'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { LogOut, Loader2 } from 'lucide-react'

interface Profile {
  name: string
  username: string
  highschool: string
  graduation_year: number
}

export default function WelcomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/autentificare')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('name, username, highschool, graduation_year')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-700" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="text-lg font-bold text-gray-900">Unirea</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Iesire
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4 shadow-sm">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Bun venit{profile ? `, ${profile.name}` : ''}!
            </h1>
            <p className="text-gray-500 text-sm">
              Te-ai conectat cu succes la Unirea
            </p>
          </div>

          {profile && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Utilizator</span>
                <span className="font-medium text-gray-900">@{profile.username}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Liceu</span>
                <span className="font-medium text-gray-900">{profile.highschool}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Promotia</span>
                <span className="font-medium text-gray-900">{profile.graduation_year}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
