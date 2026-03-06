'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { BottomNav } from '@/components/BottomNav'
import { MentionInput } from '@/components/MentionInput'
import { MentionText } from '@/components/MentionText'
import { GroupInfoPanel } from '@/components/mesaje/GroupInfoPanel'
import { Loader2, ArrowLeft, Send, Users, ChevronDown } from 'lucide-react'
import { relativeTime, getInitials } from '@/lib/utils'

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
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollButton(distanceFromBottom > 200)
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
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
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
    if (!newMessage.trim() || sending) return
    setSending(true)

    const res = await fetch('/api/mesaje/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        content: newMessage.trim(),
      }),
    })

    if (res.ok) {
      setNewMessage('')
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
    <main className="flex min-h-screen flex-col items-center px-6 pb-24">
      <div className="w-full max-w-sm flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 sticky top-0 z-10" style={{ background: 'var(--white)' }}>
          <button
            type="button"
            onClick={() => router.push('/mesaje')}
            className="transition-colors"
            style={{ color: 'var(--ink3)' }}
          >
            <ArrowLeft size={20} />
          </button>

          {isGroup ? (
            <button
              type="button"
              onClick={() => setShowGroupInfo(true)}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-soft)' }}>
                <Users size={16} style={{ color: 'var(--amber)' }} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--ink)' }}>{groupMeta?.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--ink3)' }}>{members.length} membri</p>
              </div>
            </button>
          ) : otherUser && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {otherUser.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--amber-soft)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--amber)' }}>{getInitials(otherUser.name)}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{otherUser.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--ink3)' }}>@{otherUser.username}</p>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 relative" ref={scrollContainerRef} onScroll={handleScroll}>
          {messages.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--ink3)' }}>
              {isGroup ? 'Niciun mesaj in grup. Spune salut!' : 'Niciun mesaj inca. Spune salut!'}
            </p>
          )}
          {messages.map((msg, i) => {
            const isOwn = msg.user_id === currentUserId
            const showTime = i === messages.length - 1 ||
              messages[i + 1].user_id !== msg.user_id ||
              new Date(messages[i + 1].created_at).getTime() - new Date(msg.created_at).getTime() > 300000

            // Date separator when the day changes
            const prevMsg = i > 0 ? messages[i - 1] : null
            const showDateSeparator = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()
            const dateLabel = showDateSeparator ? getDateLabel(msg.created_at) : ''

            // For group chats, show sender name when it's a different sender than prev message
            const showSenderName = isGroup && !isOwn && (
              i === 0 || messages[i - 1].user_id !== msg.user_id
            )
            const senderProfile = participantMap.get(msg.user_id)

            return (
              <div key={msg.id}>
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
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {showSenderName && senderProfile && (
                    <p className="text-[11px] font-medium mb-0.5 ml-1" style={{ color: 'var(--amber)' }}>
                      {senderProfile.name.split(' ')[0]}
                    </p>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm select-none ${
                      isOwn ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}
                    style={isOwn
                      ? { background: 'var(--amber)', color: 'white' }
                      : { background: 'var(--cream2)', color: 'var(--ink)' }
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
                  </div>
                  {confirmDeleteId === msg.id && (
                    <div className={`flex gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={deletingMessageId === msg.id}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg disabled:opacity-50"
                        style={{ background: 'var(--red, #ef4444)', color: 'white' }}
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
                  {showTime && (
                    <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`} style={{ color: 'var(--ink3)' }}>
                      {relativeTime(msg.created_at)}
                    </p>
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
              onClick={scrollToBottom}
              className="sticky bottom-2 left-full -ml-10 w-8 h-8 rounded-full flex items-center justify-center z-10"
              style={{ background: 'var(--white)', boxShadow: 'var(--shadow-m)', color: 'var(--ink2)' }}
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>

        {/* Input bar */}
        <div className="sticky bottom-16 pt-2 pb-2 border-t" style={{ background: 'var(--white)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSend} className="flex gap-2">
            <MentionInput
              value={newMessage}
              onChange={setNewMessage}
              placeholder="Scrie un mesaj..."
              className="flex-1 rounded-full border px-4 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--ink)' }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="rounded-full p-2 text-white disabled:opacity-50 transition-colors"
              style={{ background: 'var(--amber)' }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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
