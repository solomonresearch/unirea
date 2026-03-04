'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, CircleDot, MessageCircle, Search, Bell, SlidersHorizontal } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/avizier',  label: 'Avizier',  icon: Newspaper },
  { href: '/carusel',  label: 'Carusel',  icon: Bell },
  { href: '/cercuri',  label: 'Cercuri',  icon: CircleDot },
  { href: '/mesaje',   label: 'Mesaje',   icon: MessageCircle },
  { href: '/cauta',    label: 'Cauta',    icon: Search },
  { href: '/setari',   label: 'Setari',   icon: SlidersHorizontal },
]

export function BottomNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  const loadUnread = useCallback(async () => {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)

    if (!participations || participations.length === 0) {
      setUnreadCount(0)
      return
    }

    let total = 0
    for (const p of participations) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', p.conversation_id)
        .neq('user_id', user.id)
        .gt('created_at', p.last_read_at || '1970-01-01')

      total += count || 0
    }

    setUnreadCount(total)
  }, [])

  useEffect(() => {
    loadUnread()
  }, [loadUnread, pathname])

  useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('unread-badge')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        loadUnread()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadUnread])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: 'color-mix(in srgb, var(--cream) 97%, transparent)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--border)',
        height: '68px',
      }}
    >
      <div className="mx-auto max-w-sm flex items-center justify-around h-full pb-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/')
          const showBadge = href === '/mesaje' && unreadCount > 0
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-[3px] flex-1 py-1"
            >
              <div className="relative w-[26px] h-[26px] flex items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.75}
                  style={{ color: active ? 'var(--ink)' : 'var(--ink3)' }}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                    style={{ background: 'var(--amber)' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span
                className="text-[0.56rem] tracking-[0.02em]"
                style={{
                  color: active ? 'var(--ink)' : 'var(--ink3)',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
