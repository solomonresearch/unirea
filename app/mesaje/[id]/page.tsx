'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { BottomNav } from '@/components/BottomNav'
import { Loader2, ArrowLeft, Send } from 'lucide-react'

interface Message {
  id: string
  conversation_id: string
  user_id: string
  content: string
  created_at: string
}

interface OtherUser {
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

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setCurrentUserId(user.id)

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

      const { data: msgs } = await supabase
        .from('messages')
        .select('id, conversation_id, user_id, content, created_at')
        .eq('conversation_id', conversationId)
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
        setMessages(prev => {
          if (prev.some(m => m.id === (payload.new as Message).id)) return prev
          return [...prev, payload.new as Message]
        })
        supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId)
          .then()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)

    const supabase = getSupabase()
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      user_id: currentUserId,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary-700" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 pb-24">
      <div className="w-full max-w-sm flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 sticky top-0 bg-white z-10">
          <button
            type="button"
            onClick={() => router.push('/mesaje')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          {otherUser && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {otherUser.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={otherUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-700">{getInitials(otherUser.name)}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{otherUser.name}</p>
                <p className="text-[11px] text-gray-400">@{otherUser.username}</p>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Niciun mesaj inca. Spune salut!</p>
          )}
          {messages.map((msg, i) => {
            const isOwn = msg.user_id === currentUserId
            const showTime = i === messages.length - 1 ||
              messages[i + 1].user_id !== msg.user_id ||
              new Date(messages[i + 1].created_at).getTime() - new Date(msg.created_at).getTime() > 300000

            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? 'bg-primary-700 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  {showTime && (
                    <p className={`text-[10px] text-gray-400 mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {relativeTime(msg.created_at)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="sticky bottom-16 bg-white pt-2 pb-2 border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Scrie un mesaj..."
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="rounded-full bg-primary-700 p-2 text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
