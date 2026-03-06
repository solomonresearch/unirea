'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { Loader2, Users } from 'lucide-react'

interface InviteInfo {
  conversation_id: string
  name: string
  member_count: number
  already_member: boolean
}

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/mesaje/invitatie/${code}`)
      if (!res.ok) {
        setError('Link invalid sau expirat')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.already_member) {
        router.replace(`/mesaje/${data.conversation_id}`)
        return
      }
      setInfo(data)
      setLoading(false)
    }
    load()
  }, [code, router])

  async function handleJoin() {
    if (joining || !info) return
    setJoining(true)

    const res = await fetch(`/api/mesaje/invitatie/${code}`, { method: 'POST' })
    const data = await res.json()

    if (res.ok && data.conversation_id) {
      router.replace(`/mesaje/${data.conversation_id}`)
    } else {
      setError(data.error || 'Eroare la alaturare')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--amber)]" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <Logo size={32} />
          <p className="text-sm text-[var(--ink2)]">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/mesaje')}
            className="text-sm text-[var(--amber)] font-medium hover:underline"
          >
            Inapoi la mesaje
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <Logo size={32} />

        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--amber-soft)] flex items-center justify-center">
            <Users size={28} className="text-[var(--amber)]" />
          </div>
          <h1 className="text-lg font-bold text-[var(--ink)]">{info?.name}</h1>
          <p className="text-sm text-[var(--ink2)]">
            {info?.member_count} {info?.member_count === 1 ? 'membru' : 'membri'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="w-full rounded-xl bg-[var(--amber)] py-3 text-sm font-semibold text-white hover:bg-[var(--amber-dark)] disabled:opacity-50 transition-colors"
        >
          {joining ? (
            <Loader2 size={16} className="animate-spin mx-auto" />
          ) : (
            'Alatura-te grupului'
          )}
        </button>
      </div>
    </main>
  )
}
