'use client'

import { CheckCircle2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Eveniment } from './types'

const SCOPE_LABELS: Record<string, string> = {
  class: 'CLASĂ',
  promotion: 'PROMOȚIE',
  school: 'LICEU',
}

const GRADIENTS = [
  'linear-gradient(135deg, #1a3a5c 0%, #2d6a8f 100%)',
  'linear-gradient(135deg, #3d1f5c 0%, #7b4d9e 100%)',
  'linear-gradient(135deg, #7a3a1a 0%, #c4834a 100%)',
  'linear-gradient(135deg, #1a4a2e 0%, #3d8e5a 100%)',
  'linear-gradient(135deg, #4a1a1a 0%, #9e3d3d 100%)',
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
  return String(new Date(dateStr + 'T00:00:00').getDate()).padStart(2, '0')
}

interface Props {
  event: Eveniment
  onClick: () => void
}

export function EvenimentCard({ event, onClick }: Props) {
  const visibleParticipants = event.top_participants.slice(0, 4)
  const overflow = event.participant_count - 4

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-xl overflow-hidden text-left transition-transform active:scale-95 flex flex-col"
      style={{
        width: '165px',
        height: '215px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        background: 'var(--white)',
      }}
    >
      {/* Image / gradient section */}
      <div
        className="relative flex-shrink-0"
        style={{
          height: '135px',
          background: event.image_url ? undefined : gradientFromTitle(event.title),
        }}
      >
        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        )}

        {/* Scope badge — top left */}
        <span
          className="absolute top-2 left-2 text-white rounded-full px-2 py-0.5"
          style={{
            fontSize: '9px',
            fontWeight: 800,
            background: 'rgba(0,0,0,0.55)',
            letterSpacing: '0.04em',
          }}
        >
          {SCOPE_LABELS[event.scope] || event.scope}
        </span>

        {/* Attending checkmark — top right */}
        {event.attending && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 size={20} strokeWidth={2.5} style={{ color: '#4ade80', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
          </div>
        )}

        {/* Day badge — bottom right of image */}
        <div
          className="absolute bottom-2 right-2 flex items-center justify-center rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.95)',
            minWidth: '34px',
            height: '34px',
            padding: '0 6px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1, color: 'var(--ink)' }}>
            {formatDay(event.event_date)}
          </span>
        </div>
      </div>

      {/* White bottom section */}
      <div className="flex flex-col justify-between flex-1 px-3 py-2.5">
        {/* Title */}
        <p
          className="font-bold leading-snug line-clamp-2"
          style={{ fontSize: '13px', color: 'var(--ink)' }}
        >
          {event.title}
        </p>

        {/* Participants */}
        <div className="flex items-center gap-1.5 mt-1">
          {event.participant_count === 0 ? (
            <span style={{ fontSize: '10px', color: 'var(--ink3)' }}>Fii primul!</span>
          ) : (
            <>
              <div className="flex -space-x-1.5">
                {visibleParticipants.map(p => (
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
              {overflow > 0 && (
                <span style={{ fontSize: '10px', color: 'var(--ink3)', fontWeight: 600 }}>
                  +{overflow}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  )
}
