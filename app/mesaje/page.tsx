'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { Loader2, MessageCircle, Plus, Search, X } from 'lucide-react'

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
    user_id: string
  } | null
  unread_count: number
}

interface SearchResult {
  id: string
  name: string
  username: string
  avatar_url: string | null
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
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [startingChat, setStartingChat] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)

      if (!participations || participations.length === 0) {
        setLoading(false)
        return
      }

      const conversationIds = participations.map(p => p.conversation_id)
      const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]))

      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles(id, name, username, avatar_url)')
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id)

      const { data: allMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, user_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      const unreadCounts = new Map<string, number>()
      for (const cid of conversationIds) {
        const lastRead = lastReadMap.get(cid) || '1970-01-01'
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', cid)
          .neq('user_id', user.id)
          .gt('created_at', lastRead)
        unreadCounts.set(cid, count || 0)
      }

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
            user_id: lastMsg.user_id,
          } : null,
          unread_count: unreadCounts.get(cid) || 0,
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setSearching(true)
      const supabase = getSupabase()
      const q = searchQuery.trim()

      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .eq('onboarding_completed', true)
        .neq('id', currentUserId)
        .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10)

      setSearchResults((data || []) as SearchResult[])
      setSearching(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery, currentUserId])

  async function handleStartChat(otherUserId: string) {
    if (startingChat) return
    setStartingChat(otherUserId)
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
        .eq('user_id', otherUserId)
        .in('conversation_id', convoIds)

      if (theirConvos && theirConvos.length > 0) {
        router.push(`/mesaje/${theirConvos[0].conversation_id}`)
        return
      }
    }

    const newId = crypto.randomUUID()
    const { error } = await supabase.from('conversations').insert({ id: newId })
    if (error) { setStartingChat(null); return }

    await supabase.from('conversation_participants').insert([
      { conversation_id: newId, user_id: currentUserId },
      { conversation_id: newId, user_id: otherUserId },
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

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-sm font-bold text-gray-900">Mesaje</span>
          </div>
          <button
            type="button"
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]) }}
            className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {showSearch ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>

        {/* New conversation search */}
        {showSearch && (
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cauta un coleg..."
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 outline-none"
              />
            </div>
            {searching && (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            )}
            {!searching && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4">Niciun rezultat</p>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleStartChat(user.id)}
                    disabled={startingChat === user.id}
                    className="flex items-center gap-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 hover:border-primary-200 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-700">{getInitials(user.name)}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                    {startingChat === user.id && <Loader2 size={14} className="animate-spin text-gray-400 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversation list */}
        {conversations.length === 0 && !showSearch ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">Niciun mesaj inca</p>
            <p className="text-xs text-gray-300 mt-1">Apasa + pentru a incepe o conversatie</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(convo => {
              const hasUnread = convo.unread_count > 0
              return (
                <Link
                  key={convo.id}
                  href={`/mesaje/${convo.id}`}
                  className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors ${
                    hasUnread ? 'border-primary-200' : 'border-gray-200 hover:border-primary-200'
                  }`}
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
                      <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                        {convo.other_user.name}
                      </p>
                      {convo.last_message && (
                        <span className={`text-[10px] flex-shrink-0 ml-2 ${hasUnread ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                          {relativeTime(convo.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {convo.last_message ? convo.last_message.content : 'Niciun mesaj'}
                      </p>
                      {hasUnread && (
                        <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary-700 px-1 text-[9px] font-bold text-white">
                          {convo.unread_count > 99 ? '99+' : convo.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
