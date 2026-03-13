'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Newspaper, CircleDot, MessageCircle, Bell, Plus, Camera, Send, BarChart2, Calendar } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

const LEFT_NAV = [
  { href: '/avizier', label: 'Avizier', icon: Newspaper },
  { href: '/carusel', label: 'Carusel', icon: Bell },
]

const RIGHT_NAV = [
  { href: '/cercuri', label: 'Cercuri', icon: CircleDot },
  { href: '/mesaje', label: 'Mesaje', icon: MessageCircle },
]

const POST_OPTIONS = [
  { label: 'Distribuie o amintire', icon: Camera, action: 'upload', pagePath: '/carusel', href: '/carusel?open=upload' },
  { label: 'Scrie un anunț', icon: Send, action: 'post', pagePath: '/avizier', href: '/avizier?open=post' },
  { label: 'Creează un sondaj', icon: BarChart2, action: 'quiz', pagePath: '/avizier', href: '/avizier?open=quiz' },
  { label: 'Adaugă un eveniment', icon: Calendar, action: 'eveniment', pagePath: '/avizier', href: '/avizier?open=eveniment' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [fabOpen, setFabOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    setFabOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!fabOpen) return
    function handleClick(e: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [fabOpen])

  function handlePostOption(action: string, pagePath: string, href: string) {
    setFabOpen(false)
    if (pathname === pagePath || pathname?.startsWith(pagePath + '/')) {
      window.dispatchEvent(new CustomEvent('unirea:fab-action', { detail: { action } }))
    } else {
      router.push(href)
    }
  }

  return (
    <>
      {/* Backdrop to close FAB menu */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFabOpen(false)}
        />
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: 'color-mix(in srgb, var(--cream) 97%, transparent)',
          backdropFilter: 'blur(16px)',
          borderColor: 'var(--border)',
          height: '68px',
        }}
      >
        <div className="mx-auto max-w-sm flex items-center h-full relative">
          {/* Left nav items */}
          {LEFT_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-[3px] flex-1 py-1"
              >
                <div className="w-[26px] h-[26px] flex items-center justify-center">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.75}
                    style={{ color: active ? 'var(--ink)' : 'var(--ink3)' }}
                  />
                </div>
                <span
                  className="text-3xs tracking-[0.02em]"
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

          {/* Center spacer for FAB */}
          <div style={{ width: '72px', flexShrink: 0 }} />

          {/* Right nav items */}
          {RIGHT_NAV.map(({ href, label, icon: Icon }) => {
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
                  className="text-3xs tracking-[0.02em]"
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

          {/* FAB — absolutely centered, rises above tab bar */}
          <div
            ref={fabRef}
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-50"
            style={{ bottom: '4px' }}
          >
            {/* Drop-up menu */}
            {fabOpen && (
              <div
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 rounded-xl overflow-hidden"
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  width: '210px',
                }}
              >
                {[...POST_OPTIONS].reverse().map((opt, i, arr) => (
                  <button
                    key={opt.href}
                    onClick={() => handlePostOption(opt.action, opt.pagePath, opt.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      color: 'var(--ink)',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      fontSize: '0.82rem',
                    }}
                  >
                    <opt.icon size={16} style={{ color: 'var(--ink2)', flexShrink: 0 }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* FAB button */}
            <button
              onClick={() => setFabOpen(prev => !prev)}
              className="flex items-center justify-center rounded-xl shadow-lg transition-transform active:scale-95"
              style={{
                width: '52px',
                height: '52px',
                background: 'var(--ink)',
                color: 'var(--white)',
                marginBottom: '2px',
                transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>

            {/* Label */}
            <span
              className="text-3xs tracking-[0.02em]"
              style={{ color: 'var(--ink)', fontWeight: 700 }}
            >
              Posteaza
            </span>
          </div>
        </div>
      </nav>
    </>
  )
}
