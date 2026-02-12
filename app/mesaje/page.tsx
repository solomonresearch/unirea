'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { Loader2, MessageCircle } from 'lucide-react'

interface Conversation {
  id: string
  other_user: {
    id: string
    name: string
    username: string
    avatar_url: string | null
  }
  last_message: {
    content: string
    created_at: string
  } | null
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'acum'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `acum ${m} ${m === 1 ? 'minut' : 'minute'}`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `acum ${h} ${h === 1 ? 'ora' : 'ore'}`
  }
  if (diff < 172800) return 'ieri'
  if (diff < 2592000) {
    const d = Math.floor(diff / 86400)
    return `acum ${d} zile`
  }
  const mo = Math.floor(diff / 2592000)
  return `acum ${mo} ${mo === 1 ? 'luna' : 'luni'}`
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function MesajePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (!participations || participations.length === 0) {
        setLoading(false)
        return
      }

      const conversationIds = participations.map(p => p.conversation_id)

      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles(id, name, username, avatar_url)')
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id)

      const { data: allMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      const convos: Conversation[] = conversationIds.map(cid => {
        const participant = allParticipants?.find(p => p.conversation_id === cid)
        const lastMsg = allMessages?.find(m => m.conversation_id === cid)
        const profile = participant?.profiles as any

        return {
          id: cid,
          other_user: profile ? {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          } : { id: '', name: 'Utilizator', username: '', avatar_url: null },
          last_message: lastMsg ? {
            content: lastMsg.content,
            created_at: lastMsg.created_at,
          } : null,
        }
      })

      convos.sort((a, b) => {
        if (!a.last_message && !b.last_message) return 0
        if (!a.last_message) return 1
        if (!b.last_message) return -1
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
      })

      setConversations(convos)
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

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-sm font-bold text-gray-900">Mesaje</span>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">Niciun mesaj inca</p>
            <p className="text-xs text-gray-300 mt-1">Trimite un mesaj unui coleg din profilul sau</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(convo => (
              <Link
                key={convo.id}
                href={`/mesaje/${convo.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {convo.other_user.avatar_url ? (
                    <img src={convo.other_user.avatar_url} alt={convo.other_user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-700">{getInitials(convo.other_user.name)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">{convo.other_user.name}</p>
                    {convo.last_message && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{relativeTime(convo.last_message.created_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {convo.last_message ? convo.last_message.content : 'Niciun mesaj'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
