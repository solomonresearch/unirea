'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Shield, ChevronDown } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'

interface User {
  id: string
  name: string
  username: string
  email: string
  role: string
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  moderator: 'Moderator',
  user: 'Utilizator',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  moderator: 'bg-yellow-100 text-yellow-700',
  user: 'bg-gray-100 text-gray-600',
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data: { session } } = await getSupabase().auth.getSession()
      if (cancelled) return
      if (!session) { router.push('/autentificare'); return }
      setCurrentUserId(session.user.id)

      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (cancelled) return
      if (res.status === 401) { router.push('/avizier'); return }

      const data = await res.json()
      if (cancelled) return
      setUsers(data.users || [])
      setLoading(false)
    }
    init()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function changeRole(userId: string, newRole: string) {
    setUpdatingId(userId)
    const { data: { session } } = await getSupabase().auth.getSession()
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ userId, role: newRole }),
    })

    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
    setUpdatingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-sm mx-auto px-6 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            <h1 className="text-xl font-bold">Admin</h1>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {users.length} utilizatori înregistrați
        </p>

        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.name || 'Fără nume'}</p>
                  <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                </div>

                {user.id === currentUserId ? (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                ) : (
                  <div className="relative">
                    <select
                      value={user.role}
                      onChange={e => changeRole(user.id, e.target.value)}
                      disabled={updatingId === user.id}
                      className={`appearance-none text-xs font-medium px-3 py-1 pr-7 rounded-full cursor-pointer ${ROLE_COLORS[user.role]} ${updatingId === user.id ? 'opacity-50' : ''}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="user">Utilizator</option>
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
