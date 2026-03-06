'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { relativeTime, getInitials } from '@/lib/utils'

interface Actor {
  id: string
  name: string
  username: string
  avatar_url: string | null
}

interface Notification {
  id: string
  type: 'mention' | 'message'
  context: string | null
  reference_id: string | null
  content_preview: string | null
  read_at: string | null
  created_at: string
  actor: Actor
}

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const CONTEXT_ROUTES: Record<string, string> = {
  avizier: '/avizier',
  tabla: '/tabla',
  carusel: '/carusel',
  mesaje: '/mesaje',
  ziar: '/ziar',
}

export function NotificationBell() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount((data.notifications || []).filter((n: Notification) => !n.read_at).length)
      }
    }
    load()
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const supabase = getSupabase()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        const newNotif = payload.new as any
        // Fetch actor profile
        const { data: actor } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .eq('id', newNotif.actor_id)
          .single()

        if (actor) {
          const full: Notification = { ...newNotif, actor }
          setNotifications(prev => [full, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleOpen() {
    setOpen(prev => !prev)
    if (!open && unreadCount > 0) {
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      await fetch('/api/notifications', { method: 'PATCH' })
    }
  }

  function handleNotificationClick(n: Notification) {
    setOpen(false)
    if (n.context === 'mesaje' && n.reference_id) {
      router.push(`/mesaje/${n.reference_id}`)
    } else if (n.context === 'carusel' && n.reference_id) {
      router.push(`/carusel/${n.reference_id}`)
    } else if (n.context) {
      router.push(CONTEXT_ROUTES[n.context] || '/')
    }
  }

  function actionText(n: Notification): string {
    if (n.type === 'message') return 'ți-a trimis un mesaj'
    return 'te-a menționat'
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors"
        style={{ background: 'var(--white)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
      >
        <Bell size={16} strokeWidth={1.75} style={{ color: 'var(--ink3)' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white px-1" style={{ background: '#F59E0B' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl z-50"
          style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-l, 0 4px 24px rgba(0,0,0,0.12))' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Notificări</p>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--ink3)' }}>Nicio notificare</p>
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                  style={{ background: n.read_at ? 'transparent' : 'rgba(245, 158, 11, 0.05)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-2xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: n.actor.avatar_url ? 'transparent' : avatarColor(n.actor.name) }}
                  >
                    {n.actor.avatar_url
                      ? <img src={n.actor.avatar_url} alt={n.actor.name} className="w-full h-full object-cover" />
                      : getInitials(n.actor.name)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color: 'var(--ink)' }}>
                      <span className="font-semibold">{n.actor.name}</span>{' '}
                      <span style={{ color: 'var(--ink2)' }}>{actionText(n)}</span>
                    </p>
                    {n.content_preview && (
                      <p className="text-xxs mt-0.5 line-clamp-2" style={{ color: 'var(--ink3)' }}>
                        {n.content_preview}
                      </p>
                    )}
                    <p className="text-2xs mt-1" style={{ color: 'var(--ink3)' }}>
                      {relativeTime(n.created_at, true)}
                    </p>
                  </div>
                  {!n.read_at && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: '#F59E0B' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
