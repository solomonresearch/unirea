'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Megaphone, Users, MessageCircle, Search, GalleryHorizontal, Settings } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/carusel', label: 'Carusel', icon: GalleryHorizontal },
  { href: '/cercuri', label: 'Cercuri', icon: Users },
  { href: '/mesaje', label: 'Mesaje', icon: MessageCircle },
  { href: '/cauta', label: 'Cauta', icon: Search },
  { href: '/avizier', label: 'Avizier', icon: Megaphone },
  { href: '/setari', label: 'Setari', icon: Settings },
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
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-50">
      <div className="mx-auto max-w-sm flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/')
          const showBadge = href === '/mesaje' && unreadCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1 text-[11px] font-medium transition-colors ${
                active ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
