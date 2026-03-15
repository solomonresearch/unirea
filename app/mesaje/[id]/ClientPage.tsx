'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { BottomNav } from '@/components/BottomNav'
import { MentionInput } from '@/components/MentionInput'
import { MentionText } from '@/components/MentionText'
import { GroupInfoPanel } from '@/components/mesaje/GroupInfoPanel'
import { Loader2, ArrowLeft, Send, Users, ChevronDown, MessageCircle, Check, Clock } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const DAYS_RO = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata']
const MONTHS_RO = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec']

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = today.getTime() - msgDay.getTime()
  const daysDiff = Math.floor(diff / 86400000)

  if (daysDiff === 0) return 'Azi'
  if (daysDiff === 1) return 'Ieri'
  if (daysDiff < 7) return DAYS_RO[date.getDay()]
  return `${date.getDate()} ${MONTHS_RO[date.getMonth()]} ${date.getFullYear()}`
}

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

interface Message {
  id: string
  conversation_id: string
  user_id: string
  content: string
  created_at: string
}

interface Profile {
  id: string
  name: string
  username: string
  avatar_url: string | null
}

interface GroupMeta {
  name: string
  is_group: boolean
  invite_code: string | null
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [groupMeta, setGroupMeta] = useState<GroupMeta | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [participantMap, setParticipantMap] = useState<Map<string, Profile>>(new Map())
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const initialLoadDone = useRef(false)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollButton(distanceFromBottom > 200)
    if (distanceFromBottom <= 200) setNewMessageCount(0)
    setScrolled(el.scrollTop > 0)
  }

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

      // Fetch conversation metadata
      const { data: convo } = await supabase
        .from('conversations')
        .select('name, is_group, invite_code')
        .eq('id', conversationId)
        .single()

      const isGroup = convo?.is_group || false
      if (convo) setGroupMeta(convo)

      // Fetch participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles(id, name, username, avatar_url)')
        .eq('conversation_id', conversationId)

      if (!participants || participants.length === 0) {
        router.push('/mesaje')
        return
      }

      const isParticipant = participants.some(p => p.user_id === user.id)
      if (!isParticipant) {
        router.push('/mesaje')
        return
      }

      // Build participant map for sender name lookups
      const pMap = new Map<string, Profile>()
      const memberList: Profile[] = []
      participants.forEach(p => {
        const profile = p.profiles as any
        if (profile) {
          pMap.set(p.user_id, {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          })
          memberList.push({
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          })
        }
      })
      setParticipantMap(pMap)
      setMembers(memberList)

      if (!isGroup) {
        const other = participants.find(p => p.user_id !== user.id)
        if (other?.profiles) {
          const profile = other.profiles as any
          setOtherUser({
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url,
          })
        }
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('id, conversation_id, user_id, content, created_at')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      setLoading(false)
      requestAnimationFrame(() => { initialLoadDone.current = true })
    }
    load()
  }, [router, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!currentUserId) return
    const supabase = getSupabase()
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message & { deleted_at?: string }
        if (newMsg.deleted_at) return
        // Track unread count when scrolled up and not own message
        if (newMsg.user_id !== currentUserId) {
          const el = scrollContainerRef.current
          if (el) {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
            if (distFromBottom > 200) {
              setNewMessageCount(c => c + 1)
            }
          }
        }
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          // Replace temp message from same user with matching content
          const tempIdx = prev.findIndex(m =>
            m.id.startsWith('temp-') &&
            m.user_id === newMsg.user_id &&
            m.content === newMsg.content &&
            Date.now() - parseInt(m.id.split('-')[1]) < 10000
          )
          if (tempIdx !== -1) {
            const updated = [...prev]
            updated[tempIdx] = newMsg
            return updated
          }
          return [...prev, newMsg]
        })
        supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId)
          .then()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const updated = payload.new as Message & { deleted_at?: string }
        if (updated.deleted_at) {
          setMessages(prev => prev.filter(m => m.id !== updated.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return

    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      user_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, tempMsg])
    setNewMessage('')
    setSending(true)

    const supabase = getSupabase()

    // Auto-unarchive if archived
    await supabase
      .from('conversation_participants')
      .update({ archived_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId)
      .not('archived_at', 'is', null)

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: currentUserId,
        content,
      })

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    }
    setSending(false)
  }

  async function handleDeleteMessage(messageId: string) {
    if (deletingMessageId) return
    setDeletingMessageId(messageId)
    const supabase = getSupabase()
    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', currentUserId)

    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }
    setDeletingMessageId(null)
    setConfirmDeleteId(null)
  }

  function handleLongPressStart(messageId: string, isOwn: boolean) {
    if (!isOwn) return
    longPressTimer.current = setTimeout(() => {
      setConfirmDeleteId(messageId)
    }, 500)
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const isGroup = groupMeta?.is_group || false

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </main>
    )
  }

  return (
    <main className="flex flex-col min-h-screen pb-24" style={{ background: 'var(--cream2)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'var(--cream)',
          borderColor: scrolled ? 'var(--border)' : 'transparent',
          boxShadow: scrolled ? 'var(--shadow-s)' : 'none',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div className="max-w-sm mx-auto px-4 flex items-center gap-3 pt-2 pb-3">
          <button
            type="button"
            onClick={() => router.push('/mesaje')}
            className="transition-colors -ml-1"
            style={{ color: 'var(--ink3)' }}
          >
            <ArrowLeft size={20} />
          </button>

          {isGroup ? (
            <button
              type="button"
              onClick={() => setShowGroupInfo(true)}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-soft)' }}>
                <Users size={16} style={{ color: 'var(--amber)' }} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--ink)' }}>{groupMeta?.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink3)' }}>{members.length} membri</p>
              </div>
            </button>
          ) : otherUser && (
            <Link href={`/profil/${otherUser.username}`} className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden">
                  {otherUser.avatar_url ? (
                    <img src={otherUser.avatar_url} alt={otherUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--amber)' }}>{getInitials(otherUser.name)}</span>
                    </div>
                  )}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background: '#34C759', borderColor: 'var(--cream)' }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{otherUser.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink3)' }}>@{otherUser.username}</p>
              </div>
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-sm mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 relative" ref={scrollContainerRef} onScroll={handleScroll}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle size={40} className="mb-3" style={{ color: 'var(--border)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--ink3)' }}>
                {isGroup ? 'Niciun mesaj in grup' : 'Niciun mesaj inca'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--border)' }}>
                Trimite un mesaj pentru a incepe conversatia
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isOwn = msg.user_id === currentUserId

            // Date separator when the day changes
            const prevMsg = i > 0 ? messages[i - 1] : null
            const showDateSeparator = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()
            const dateLabel = showDateSeparator ? getDateLabel(msg.created_at) : ''

            // Grouping: same sender + same day
            const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString()
            const sameSenderAsPrev = !showDateSeparator && prevMsg && prevMsg.user_id === msg.user_id && sameDay(prevMsg.created_at, msg.created_at)
            const nextMsg = i < messages.length - 1 ? messages[i + 1] : null
            const sameSenderAsNext = nextMsg && nextMsg.user_id === msg.user_id && sameDay(msg.created_at, nextMsg.created_at)
              && new Date(nextMsg.created_at).toDateString() === new Date(msg.created_at).toDateString()
            const isFirstInGroup = !sameSenderAsPrev
            const isLastInGroup = !sameSenderAsNext

            const showTime = isLastInGroup ||
              (nextMsg && new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() > 300000)

            // For group chats, show sender name on first message of a group
            const showSenderName = isGroup && !isOwn && isFirstInGroup
            const senderProfile = participantMap.get(msg.user_id)

            // Margin: larger gap between groups, tiny gap within group
            const marginTop = showDateSeparator ? '' : (isFirstInGroup ? 'mt-3' : 'mt-0.5')

            // Corner radius: flat corner only on last bubble in group
            const bubbleRadius = isLastInGroup
              ? (isOwn ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md')
              : 'rounded-2xl'

            return (
              <div key={msg.id} className={`${marginTop}${initialLoadDone.current ? ' chat-msg' : ''}`}>
                {showDateSeparator && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--ink3)' }}>
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {isGroup && !isOwn && (
                  <div className="w-6 mr-2 flex-shrink-0 flex items-end">
                    {isLastInGroup && senderProfile ? (
                      <Link href={`/profil/${senderProfile.username}`} className="block flex-shrink-0">
                        {senderProfile.avatar_url ? (
                          <img src={senderProfile.avatar_url} alt={senderProfile.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: avatarColor(senderProfile.name) }}>
                            <span className="text-[9px] font-bold text-white">{getInitials(senderProfile.name)}</span>
                          </div>
                        )}
                      </Link>
                    ) : null}
                  </div>
                )}
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {showSenderName && senderProfile && (
                    <p className="text-[11px] font-medium mb-0.5 ml-1" style={{ color: 'var(--amber)' }}>
                      {senderProfile.name.split(' ')[0]}
                    </p>
                  )}
                  <div
                    className={`px-3.5 py-2.5 ${bubbleRadius} text-sm select-none relative`}
                    style={isOwn
                      ? { background: 'var(--amber)', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                      : { background: 'var(--cream2)', color: 'var(--ink)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }
                    }
                    onTouchStart={() => handleLongPressStart(msg.id, isOwn)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchMove={handleLongPressEnd}
                    onContextMenu={(e) => {
                      if (isOwn) {
                        e.preventDefault()
                        setConfirmDeleteId(msg.id)
                      }
                    }}
                  >
                    <MentionText text={msg.content} />
                    {showTime && <span className={`inline-block ${isOwn ? 'w-16' : 'w-[3.25rem]'}`} aria-hidden />}
                    {showTime && (
                      <span
                        className="absolute bottom-1.5 right-2.5 text-[10px] leading-none pointer-events-none flex items-center gap-1"
                        style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--ink3)' }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                        {isOwn && (msg.id.startsWith('temp-') ? <Clock size={10} /> : <Check size={10} />)}
                      </span>
                    )}
                  </div>
                  {confirmDeleteId === msg.id && (
                    <div className={`flex gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={deletingMessageId === msg.id}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg disabled:opacity-50"
                        style={{ background: 'var(--rose)', color: 'white' }}
                      >
                        {deletingMessageId === msg.id ? 'Se sterge...' : 'Sterge'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                        style={{ background: 'var(--cream2, #f5f5f0)', color: 'var(--ink3, #888)' }}
                      >
                        Anuleaza
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
          {showScrollButton && (
            <button
              type="button"
              onClick={() => { scrollToBottom(); setNewMessageCount(0) }}
              className="sticky bottom-2 left-full -ml-10 w-8 h-8 rounded-full flex items-center justify-center z-10 relative"
              style={{ background: 'var(--white)', boxShadow: 'var(--shadow-m)', color: 'var(--ink2)' }}
            >
              <ChevronDown size={18} />
              {newMessageCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                  style={{ background: 'var(--amber)' }}
                >
                  {newMessageCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 py-2.5">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div
              className="flex-1 rounded-2xl border overflow-hidden"
              style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
            >
              <MentionInput
                value={newMessage}
                onChange={setNewMessage}
                placeholder="Scrie un mesaj..."
                className="w-full px-4 py-2.5 text-sm outline-none"
                style={{ background: 'transparent', color: 'var(--ink)' }}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="send-btn w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all flex-shrink-0"
              style={{ background: 'var(--ink)' }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>

      {/* Group info panel */}
      {showGroupInfo && groupMeta && (
        <GroupInfoPanel
          conversationId={conversationId}
          name={groupMeta.name}
          inviteCode={groupMeta.invite_code || ''}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setShowGroupInfo(false)}
          onNameUpdated={(name) => setGroupMeta(prev => prev ? { ...prev, name } : prev)}
          onMembersUpdated={(updated) => {
            setMembers(updated)
            const newMap = new Map<string, Profile>()
            updated.forEach(m => newMap.set(m.id, m))
            setParticipantMap(newMap)
          }}
        />
      )}

      <BottomNav />
    </main>
  )
}
