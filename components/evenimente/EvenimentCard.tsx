'use client'

import { getInitials } from '@/lib/utils'
import type { Eveniment } from './types'

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
  const d = new Date(dateStr + 'T00:00:00')
  return String(d.getDate())
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleString('ro-RO', { month: 'short' }).replace('.', '')
}

interface Props {
  event: Eveniment
  onClick: () => void
}

export function EvenimentCard({ event, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-xl overflow-hidden text-left transition-transform active:scale-95"
      style={{
        width: '160px',
        height: '144px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Top half: image or gradient */}
      <div
        className="relative"
        style={{
          height: '80px',
          background: event.image_url ? undefined : gradientFromTitle(event.title),
        }}
      >
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Scope badge top-left */}
        <span
          className="absolute top-1.5 left-1.5 text-white rounded-full px-1.5 py-0.5"
          style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(0,0,0,0.45)', letterSpacing: '0.03em' }}
        >
          {SCOPE_LABELS[event.scope] || event.scope}
        </span>

        {/* Day number top-right */}
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

      {/* Bottom half */}
      <div
        className="px-2.5 py-2 flex flex-col justify-between"
        style={{ height: '64px', background: 'var(--white)' }}
      >
        <p
          className="font-bold leading-tight line-clamp-2"
          style={{ fontSize: '11px', color: 'var(--ink)' }}
        >
          {event.title}
        </p>

        {/* Participants */}
        <div className="flex items-center gap-1 mt-1">
          {event.participant_count === 0 ? (
            <span style={{ fontSize: '9px', color: 'var(--ink3)' }}>Fii primul!</span>
          ) : (
            <>
              <div className="flex -space-x-1.5">
                {event.top_participants.slice(0, 4).map(p => (
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
              {event.participant_count > 4 && (
                <span style={{ fontSize: '9px', color: 'var(--ink3)', fontWeight: 600 }}>
                  +{event.participant_count - 4}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  )
}
