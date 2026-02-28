'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { Loader2, MessageCircle, Plus, Search, X, Users } from 'lucide-react'

interface Conversation {
  id: string
  is_group: boolean
  name: string | null
  other_user: {
    id: string
    name: string
    username: string
    avatar_url: string | null
  } | null
  members: { id: string; name: string }[]
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
  const [showMenu, setShowMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [startingChat, setStartingChat] = useState<string | null>(null)
  const [showGroupCreate, setShowGroupCreate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupMemberQuery, setGroupMemberQuery] = useState('')
  const [groupMemberResults, setGroupMemberResults] = useState<SearchResult[]>([])
  const [selectedMembers, setSelectedMembers] = useState<SearchResult[]>([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)

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

      // Fetch conversation metadata (name, is_group)
      const { data: convMeta } = await supabase
        .from('conversations')
        .select('id, name, is_group')
        .in('id', conversationIds)

      const metaMap = new Map((convMeta || []).map(c => [c.id, c]))

      // Fetch all participants with profiles
      const { data: allParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles(id, name, username, avatar_url)')
        .in('conversation_id', conversationIds)

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
        const meta = metaMap.get(cid)
        const isGroup = meta?.is_group || false
        const participants = (allParticipants || []).filter(p => p.conversation_id === cid)
        const otherParticipants = participants.filter(p => p.user_id !== user.id)
        const lastMsg = allMessages?.find(m => m.conversation_id === cid)

        if (isGroup) {
          return {
            id: cid,
            is_group: true,
            name: meta?.name || 'Grup',
            other_user: null,
            members: participants.map(p => {
              const profile = p.profiles as any
              return { id: profile?.id || p.user_id, name: profile?.name || 'Utilizator' }
            }),
            last_message: lastMsg ? {
              content: lastMsg.content,
              created_at: lastMsg.created_at,
              user_id: lastMsg.user_id,
            } : null,
            unread_count: unreadCounts.get(cid) || 0,
          }
        }

        const other = otherParticipants[0]
        const profile = other?.profiles as any
        return {
          id: cid,
          is_group: false,
          name: null,
          other_user: profile ? {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          } : { id: '', name: 'Utilizator', username: '', avatar_url: null },
          members: [],
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

  // DM user search
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

  // Group member search
  useEffect(() => {
    if (!groupMemberQuery.trim()) {
      setGroupMemberResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setSearchingMembers(true)
      const supabase = getSupabase()
      const q = groupMemberQuery.trim()
      const selectedIds = selectedMembers.map(m => m.id)

      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .eq('onboarding_completed', true)
        .neq('id', currentUserId)
        .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10)

      setGroupMemberResults(
        ((data || []) as SearchResult[]).filter(u => !selectedIds.includes(u.id))
      )
      setSearchingMembers(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [groupMemberQuery, currentUserId, selectedMembers])

  async function handleStartChat(otherUserId: string) {
    if (startingChat) return
    setStartingChat(otherUserId)
    const supabase = getSupabase()

    // Only check DM conversations (not groups) for existing chat
    const { data: myConvos } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    if (myConvos && myConvos.length > 0) {
      const convoIds = myConvos.map(c => c.conversation_id)

      // Filter to non-group conversations only
      const { data: dmConvos } = await supabase
        .from('conversations')
        .select('id')
        .in('id', convoIds)
        .eq('is_group', false)

      if (dmConvos && dmConvos.length > 0) {
        const dmIds = dmConvos.map(c => c.id)
        const { data: theirConvos } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', dmIds)

        if (theirConvos && theirConvos.length > 0) {
          router.push(`/mesaje/${theirConvos[0].conversation_id}`)
          return
        }
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

  async function handleCreateGroup() {
    if (creatingGroup || !groupName.trim()) return
    setCreatingGroup(true)

    const res = await fetch('/api/mesaje/grupuri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: groupName.trim(),
        member_ids: selectedMembers.map(m => m.id),
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/mesaje/${data.id}`)
    }

    setCreatingGroup(false)
  }

  function resetMenuState() {
    setShowMenu(false)
    setShowSearch(false)
    setShowGroupCreate(false)
    setSearchQuery('')
    setSearchResults([])
    setGroupName('')
    setGroupMemberQuery('')
    setGroupMemberResults([])
    setSelectedMembers([])
  }

  function getLastMessagePreview(convo: Conversation): string {
    if (!convo.last_message) return 'Niciun mesaj'
    if (convo.is_group) {
      const sender = convo.members.find(m => m.id === convo.last_message!.user_id)
      const senderName = convo.last_message!.user_id === currentUserId ? 'Tu' : (sender?.name?.split(' ')[0] || 'Cineva')
      return `${senderName}: ${convo.last_message.content}`
    }
    return convo.last_message.content
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
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (showSearch || showGroupCreate) {
                  resetMenuState()
                } else {
                  setShowMenu(!showMenu)
                }
              }}
              className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {showSearch || showGroupCreate ? <X size={20} /> : <Plus size={20} />}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg py-1 w-44">
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setShowSearch(true) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <MessageCircle size={16} />
                    Mesaj nou
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setShowGroupCreate(true) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <Users size={16} />
                    Grup nou
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* New DM search */}
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

        {/* Group creation */}
        {showGroupCreate && (
          <div className="space-y-3">
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Numele grupului..."
              maxLength={100}
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 outline-none"
            />

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedMembers.map(member => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-2.5 py-1 text-xs text-primary-700"
                  >
                    {member.name.split(' ')[0]}
                    <button type="button" onClick={() => setSelectedMembers(prev => prev.filter(m => m.id !== member.id))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={groupMemberQuery}
                onChange={e => setGroupMemberQuery(e.target.value)}
                placeholder="Adauga membri..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 outline-none"
              />
            </div>

            {searchingMembers && (
              <div className="flex justify-center py-2">
                <Loader2 size={14} className="animate-spin text-gray-400" />
              </div>
            )}

            {groupMemberResults.length > 0 && (
              <div className="space-y-1">
                {groupMemberResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedMembers(prev => [...prev, user])
                      setGroupMemberResults(prev => prev.filter(u => u.id !== user.id))
                      setGroupMemberQuery('')
                    }}
                    className="flex items-center gap-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 hover:border-primary-200 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-700">{getInitials(user.name)}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={creatingGroup || !groupName.trim()}
              className="w-full rounded-xl bg-primary-700 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
            >
              {creatingGroup ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : (
                'Creeaza grup'
              )}
            </button>
          </div>
        )}

        {/* Conversation list */}
        {conversations.length === 0 && !showSearch && !showGroupCreate ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">Niciun mesaj inca</p>
            <p className="text-xs text-gray-300 mt-1">Apasa + pentru a incepe o conversatie</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(convo => {
              const hasUnread = convo.unread_count > 0
              const displayName = convo.is_group ? convo.name! : convo.other_user!.name
              const preview = getLastMessagePreview(convo)

              return (
                <Link
                  key={convo.id}
                  href={`/mesaje/${convo.id}`}
                  className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors ${
                    hasUnread ? 'border-primary-200' : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {convo.is_group ? (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <Users size={18} className="text-primary-700" />
                      </div>
                    ) : convo.other_user?.avatar_url ? (
                      <img src={convo.other_user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-700">{getInitials(displayName)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                          {displayName}
                        </p>
                        {convo.is_group && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{convo.members.length}</span>
                        )}
                      </div>
                      {convo.last_message && (
                        <span className={`text-[10px] flex-shrink-0 ml-2 ${hasUnread ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                          {relativeTime(convo.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {preview}
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
