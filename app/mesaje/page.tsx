'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { AvatarSettingsButton } from '@/components/AvatarSettingsButton'
import { NotificationBell } from '@/components/NotificationBell'
import { getSupabase } from '@/lib/supabase'
import { Loader2, MessageCircle, Plus, Search, X, Users, Archive, ArchiveRestore, ChevronRight, ArrowLeft } from 'lucide-react'
import { SwipeableRow } from '@/components/mesaje/SwipeableRow'
import { relativeTime, getInitials } from '@/lib/utils'

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
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([])
  const [loadingArchived, setLoadingArchived] = useState(false)
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null)
  const [archivedCount, setArchivedCount] = useState(0)

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
        .is('archived_at', null)

      const { count: archCount } = await supabase
        .from('conversation_participants')
        .select('conversation_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('archived_at', 'is', null)
      setArchivedCount(archCount || 0)

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
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const unreadCounts = new Map<string, number>()
      for (const cid of conversationIds) {
        const lastRead = lastReadMap.get(cid) || '1970-01-01'
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', cid)
          .neq('user_id', user.id)
          .is('deleted_at', null)
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

  async function handleArchiveConversation(conversationId: string) {
    if (archivingId) return
    setArchivingId(conversationId)
    const supabase = getSupabase()
    const { error } = await supabase
      .from('conversation_participants')
      .update({ archived_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId)

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      setArchivedCount(prev => prev + 1)
    }
    setArchivingId(null)
  }

  async function loadAndShowArchived() {
    setLoadingArchived(true)
    const supabase = getSupabase()

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', currentUserId)
      .not('archived_at', 'is', null)

    if (!participations || participations.length === 0) {
      setArchivedConversations([])
      setShowArchived(true)
      setLoadingArchived(false)
      return
    }

    const conversationIds = participations.map(p => p.conversation_id)

    const { data: convMeta } = await supabase
      .from('conversations')
      .select('id, name, is_group')
      .in('id', conversationIds)

    const metaMap = new Map((convMeta || []).map(c => [c.id, c]))

    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, profiles(id, name, username, avatar_url)')
      .in('conversation_id', conversationIds)

    const { data: allMessages } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, user_id')
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const convos: Conversation[] = conversationIds.map(cid => {
      const meta = metaMap.get(cid)
      const isGroup = meta?.is_group || false
      const participants = (allParticipants || []).filter(p => p.conversation_id === cid)
      const otherParticipants = participants.filter(p => p.user_id !== currentUserId)
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
          last_message: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at, user_id: lastMsg.user_id } : null,
          unread_count: 0,
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
        last_message: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at, user_id: lastMsg.user_id } : null,
        unread_count: 0,
      }
    })

    convos.sort((a, b) => {
      if (!a.last_message && !b.last_message) return 0
      if (!a.last_message) return 1
      if (!b.last_message) return -1
      return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
    })

    setArchivedConversations(convos)
    setShowArchived(true)
    setLoadingArchived(false)
  }

  async function handleUnarchiveConversation(conversationId: string) {
    if (unarchivingId) return
    setUnarchivingId(conversationId)
    const supabase = getSupabase()

    const { error } = await supabase
      .from('conversation_participants')
      .update({ archived_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId)

    if (!error) {
      const restored = archivedConversations.find(c => c.id === conversationId)
      setArchivedConversations(prev => prev.filter(c => c.id !== conversationId))
      setArchivedCount(prev => Math.max(0, prev - 1))
      if (restored) {
        setConversations(prev => {
          const updated = [...prev, restored]
          updated.sort((a, b) => {
            if (!a.last_message && !b.last_message) return 0
            if (!a.last_message) return 1
            if (!b.last_message) return -1
            return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
          })
          return updated
        })
      }
    }
    setUnarchivingId(null)
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
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24" style={{ background: 'var(--cream2)' }}>
      <div className="w-full max-w-sm space-y-3">
        {showArchived ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className="rounded-full p-2 transition-colors"
              style={{ color: 'var(--ink3)' }}
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>Arhivate</span>
          </div>
        ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>Mesajele tale</span>
          </div>
          <div className="flex items-center gap-1">
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
              className="rounded-full p-2 transition-colors"
              style={{ color: 'var(--ink3)' }}
            >
              {showSearch || showGroupCreate ? <X size={20} /> : <Plus size={20} />}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 rounded-xl py-1 w-44" style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-m)' }}>
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setShowSearch(true) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors"
                    style={{ color: 'var(--ink2)' }}
                  >
                    <MessageCircle size={16} />
                    Mesaj nou
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setShowGroupCreate(true) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors"
                    style={{ color: 'var(--ink2)' }}
                  >
                    <Users size={16} />
                    Grup nou
                  </button>
                </div>
              </>
            )}
            </div>
            <NotificationBell />
            <AvatarSettingsButton />
          </div>
        </div>
        )}

        {/* Archived view */}
        {showArchived && (
          <div className="space-y-2">
            {loadingArchived ? (
              <div className="flex justify-center py-16">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
              </div>
            ) : archivedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Archive size={40} className="mb-3" style={{ color: 'var(--border)' }} />
                <p className="text-sm" style={{ color: 'var(--ink3)' }}>Nicio conversatie arhivata</p>
              </div>
            ) : (
              archivedConversations.map(convo => {
                const displayName = convo.is_group ? convo.name! : convo.other_user!.name
                const preview = getLastMessagePreview(convo)
                return (
                  <div key={convo.id} className="flex items-center gap-2">
                    <Link
                      href={`/mesaje/${convo.id}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors flex-1 min-w-0"
                      style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {convo.is_group ? (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                            <Users size={18} style={{ color: 'var(--amber-dark)' }} />
                          </div>
                        ) : convo.other_user?.avatar_url ? (
                          <img src={convo.other_user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                            <span className="text-sm font-bold" style={{ color: 'var(--amber-dark)' }}>{getInitials(displayName)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-semibold" style={{ color: 'var(--ink)' }}>{displayName}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--ink3)' }}>{preview}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUnarchiveConversation(convo.id)}
                      disabled={unarchivingId === convo.id}
                      className="rounded-xl p-2.5 transition-colors flex-shrink-0 disabled:opacity-50"
                      style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
                    >
                      {unarchivingId === convo.id ? (
                        <Loader2 size={16} className="animate-spin" style={{ color: 'var(--ink3)' }} />
                      ) : (
                        <ArchiveRestore size={16} style={{ color: 'var(--ink3)' }} />
                      )}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* New DM search */}
        {showSearch && (
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink3)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cauta un coleg..."
                autoFocus
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
                style={{ border: '1px solid var(--border)', background: 'var(--cream2)', color: 'var(--ink)' }}
              />
            </div>
            {searching && (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--ink3)' }} />
              </div>
            )}
            {!searching && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-center text-xs py-4" style={{ color: 'var(--ink3)' }}>Niciun rezultat</p>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleStartChat(user.id)}
                    disabled={startingChat === user.id}
                    className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 transition-colors text-left disabled:opacity-50"
                    style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                          <span className="text-xs font-bold" style={{ color: 'var(--amber-dark)' }}>{getInitials(user.name)}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{user.name}</p>
                      <p className="text-xs" style={{ color: 'var(--ink3)' }}>@{user.username}</p>
                    </div>
                    {startingChat === user.id && <Loader2 size={14} className="animate-spin ml-auto" style={{ color: 'var(--ink3)' }} />}
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
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--cream2)', color: 'var(--ink)' }}
            />

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedMembers.map(member => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                    style={{ background: 'var(--amber-soft)', border: '1px solid var(--border)', color: 'var(--amber-dark)' }}
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
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink3)' }} />
              <input
                type="text"
                value={groupMemberQuery}
                onChange={e => setGroupMemberQuery(e.target.value)}
                placeholder="Adauga membri..."
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
                style={{ border: '1px solid var(--border)', background: 'var(--cream2)', color: 'var(--ink)' }}
              />
            </div>

            {searchingMembers && (
              <div className="flex justify-center py-2">
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--ink3)' }} />
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
                    className="flex items-center gap-3 w-full rounded-xl px-4 py-2 transition-colors text-left"
                    style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                          <span className="text-[10px] font-bold" style={{ color: 'var(--amber-dark)' }}>{getInitials(user.name)}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{user.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--ink3)' }}>@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={creatingGroup || !groupName.trim()}
              className="w-full rounded-sm py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ background: 'var(--ink)', color: 'var(--white)' }}
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
            <MessageCircle size={40} className="mb-3" style={{ color: 'var(--border)' }} />
            <p className="text-sm" style={{ color: 'var(--ink3)' }}>Niciun mesaj inca</p>
            <p className="text-xs mt-1" style={{ color: 'var(--border)' }}>Apasa + pentru a incepe o conversatie</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(convo => {
              const hasUnread = convo.unread_count > 0
              const displayName = convo.is_group ? convo.name! : convo.other_user!.name
              const preview = getLastMessagePreview(convo)

              return (
                <SwipeableRow
                  key={convo.id}
                  onArchive={() => handleArchiveConversation(convo.id)}
                  archiving={archivingId === convo.id}
                >
                  <Link
                    href={`/mesaje/${convo.id}`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                    style={{
                      background: 'var(--white)',
                      border: hasUnread ? '1px solid var(--amber)' : '1px solid var(--border)',
                      boxShadow: 'var(--shadow-s)',
                    }}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {convo.is_group ? (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                          <Users size={18} style={{ color: 'var(--amber-dark)' }} />
                        </div>
                      ) : convo.other_user?.avatar_url ? (
                        <img src={convo.other_user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                          <span className="text-sm font-bold" style={{ color: 'var(--amber-dark)' }}>{getInitials(displayName)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm truncate font-semibold" style={{ color: 'var(--ink)' }}>
                            {displayName}
                          </p>
                          {convo.is_group && (
                            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--ink3)' }}>{convo.members.length}</span>
                          )}
                        </div>
                        {convo.last_message && (
                          <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: hasUnread ? 'var(--amber-dark)' : 'var(--ink3)', fontWeight: hasUnread ? 600 : 400 }}>
                            {relativeTime(convo.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate" style={{ color: hasUnread ? 'var(--ink2)' : 'var(--ink3)', fontWeight: hasUnread ? 500 : 400 }}>
                          {preview}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 text-[9px] font-bold" style={{ background: 'var(--ink)', color: 'var(--white)' }}>
                            {convo.unread_count > 99 ? '99+' : convo.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </SwipeableRow>
              )
            })}
          </div>
        )}

        {/* Archived conversations button */}
        {!showArchived && !showSearch && !showGroupCreate && archivedCount > 0 && (
          <button
            type="button"
            onClick={loadAndShowArchived}
            disabled={loadingArchived}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm transition-colors disabled:opacity-50"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
          >
            <Archive size={16} style={{ color: 'var(--ink3)' }} />
            <span className="flex-1 text-left" style={{ color: 'var(--ink2)' }}>Conversatii arhivate</span>
            <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold" style={{ background: 'var(--cream)', color: 'var(--ink3)' }}>
              {archivedCount}
            </span>
            <ChevronRight size={16} style={{ color: 'var(--ink3)' }} />
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
