'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Loader2, Plus } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { EvenimentCreateModal } from '@/components/evenimente/EvenimentCreateModal'
import { EvenimentDetailModal } from '@/components/evenimente/EvenimentDetailModal'
import type { Eveniment, EvenimentDetail } from '@/components/evenimente/types'

type Scope = 'clasa' | 'promotie' | 'liceu'

const SCOPE_LABELS: Record<string, string> = {
  class: 'Clasă',
  promotion: 'Promoție',
  school: 'Liceu',
}

const GRADIENTS = [
  'linear-gradient(135deg, #5B8E6D 0%, #3D6B52 100%)',
  'linear-gradient(135deg, #7B6D9E 0%, #5A4E7B 100%)',
  'linear-gradient(135deg, #4A7B9A 0%, #2D5C7A 100%)',
  'linear-gradient(135deg, #C4634A 0%, #9A4535 100%)',
  'linear-gradient(135deg, #8E6B4A 0%, #6B4E32 100%)',
]

function gradientFromTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
    hash |= 0
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatDay(dateStr: string): string {
  return String(new Date(dateStr + 'T00:00:00').getDate())
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleString('ro-RO', { month: 'short' }).replace('.', '')
}

export default function EvenimentePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [scope, setScope] = useState<Scope>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('evenimente_scope') as Scope | null
      if (saved && ['liceu', 'promotie', 'clasa'].includes(saved)) return saved
    }
    return 'promotie'
  })
  const [events, setEvents] = useState<Eveniment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EvenimentDetail | null>(null)
  const [editingEvent, setEditingEvent] = useState<EvenimentDetail | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      setUserId(user.id)
      setUserRole(profile?.role || 'user')
    }
    checkAuth()
  }, [router])

  const loadEvents = useCallback(async (s: Scope) => {
    setLoading(true)
    const res = await fetch(`/api/evenimente?scope=${s}`)
    if (res.ok) setEvents((await res.json()).events)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (userId) loadEvents(scope)
  }, [userId, scope, loadEvents])

  async function openDetail(event: Eveniment) {
    const res = await fetch(`/api/evenimente/${event.id}`)
    if (res.ok) setSelectedEvent((await res.json()).event)
  }

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  return (
    <>
      <main className="flex flex-col min-h-screen pb-8" style={{ background: 'var(--cream2)' }}>
        {/* Header */}
        <header
          className="sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}
        >
          <Link
            href="/avizier"
            className="flex items-center gap-1.5 font-semibold text-sm"
            style={{ color: 'var(--ink2)' }}
          >
            <ArrowLeft size={16} />
            Avizier
          </Link>
          <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>Evenimente</span>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: 'var(--ink)' }}
          >
            <Plus size={13} />
            Adaugă
          </button>
        </header>

        {/* Scope tabs */}
        <div className="max-w-sm mx-auto w-full px-4 pt-3">
          <div className="flex rounded-md p-[3px]" style={{ background: 'var(--cream2)' }}>
            {(['liceu', 'promotie', 'clasa'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setScope(s); localStorage.setItem('evenimente_scope', s) }}
                className="flex-1 py-[7px] rounded-sm text-xxs font-semibold transition-all"
                style={scope === s ? {
                  background: 'var(--white)',
                  color: 'var(--ink)',
                  boxShadow: 'var(--shadow-s)',
                } : {
                  color: 'var(--ink3)',
                }}
              >
                {s === 'clasa' ? 'Clasă' : s === 'promotie' ? 'Promoție' : 'Liceu'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-sm mx-auto w-full px-4 pt-4">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 size={22} className="animate-spin" style={{ color: 'var(--ink3)' }} />
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Calendar size={40} style={{ color: 'var(--ink3)' }} strokeWidth={1.5} />
              <p className="text-sm text-center" style={{ color: 'var(--ink3)' }}>
                Niciun eveniment viitor.
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-1 rounded-full px-4 py-2 text-xs font-semibold text-white"
                style={{ background: 'var(--ink)' }}
              >
                Adaugă primul eveniment
              </button>
            </div>
          )}

          {!loading && events.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {events.map(event => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openDetail(event)}
                  className="rounded-xl overflow-hidden text-left transition-transform active:scale-95"
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-s)',
                  }}
                >
                  {/* Image / gradient top */}
                  <div
                    className="relative"
                    style={{
                      height: '90px',
                      background: event.image_url ? undefined : gradientFromTitle(event.title),
                    }}
                  >
                    {event.image_url && (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    )}

                    {/* Scope badge */}
                    <span
                      className="absolute top-1.5 left-1.5 text-white rounded-full px-1.5 py-0.5"
                      style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(0,0,0,0.45)' }}
                    >
                      {SCOPE_LABELS[event.scope] || event.scope}
                    </span>

                    {/* Day badge */}
                    <div
                      className="absolute top-1.5 right-1.5 flex flex-col items-center justify-center rounded-md"
                      style={{ background: 'rgba(255,255,255,0.92)', minWidth: '28px', padding: '2px 4px' }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1, color: 'var(--ink)' }}>
                        {formatDay(event.event_date)}
                      </span>
                      <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', lineHeight: 1 }}>
                        {formatMonth(event.event_date)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="px-2.5 py-2">
                    <p className="font-bold leading-tight line-clamp-2 mb-1.5" style={{ fontSize: '11px', color: 'var(--ink)' }}>
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1">
                      {event.top_participants.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {event.top_participants.map(p => (
                            <div
                              key={p.id}
                              className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center overflow-hidden flex-shrink-0"
                              style={{ background: p.avatar_url ? undefined : avatarColor(p.name) }}
                            >
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <span style={{ fontSize: '7px', fontWeight: 700, color: 'white' }}>
                                  {getInitials(p.name)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <span style={{ fontSize: '9px', color: 'var(--ink3)', fontWeight: 600 }}>
                        {event.participant_count > 0
                          ? `${event.participant_count} participanți`
                          : 'Fii primul!'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <EvenimentCreateModal
        open={showCreate || !!editingEvent}
        onClose={() => { setShowCreate(false); setEditingEvent(null) }}
        initialEvent={editingEvent}
        onCreated={(ev) => setEvents(prev => [ev, ...prev])}
        onUpdated={(ev) => {
          setEvents(prev => prev.map(e => e.id === ev.id ? ev : e))
          setSelectedEvent(prev => prev?.id === ev.id ? { ...prev, ...ev } : prev)
          setEditingEvent(null)
        }}
      />

      {selectedEvent && userId && (
        <EvenimentDetailModal
          event={selectedEvent}
          currentUserId={userId}
          isAdmin={userRole === 'admin'}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => { setEditingEvent(selectedEvent); setSelectedEvent(null) }}
          onDelete={() => {
            setEvents(prev => prev.filter(e => e.id !== selectedEvent.id))
            setSelectedEvent(null)
          }}
          onRsvpToggle={(attending) => {
            setEvents(prev => prev.map(e =>
              e.id === selectedEvent.id
                ? { ...e, attending, participant_count: attending ? e.participant_count + 1 : Math.max(0, e.participant_count - 1) }
                : e
            ))
          }}
        />
      )}
    </>
  )
}
