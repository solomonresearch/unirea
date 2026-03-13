'use client'

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

function formatDateParts(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('ro-RO', { month: 'short' }).replace('.', '')
  return { day, month: month.charAt(0).toUpperCase() + month.slice(1) }
}

// Layout constants
const CARD_W = 148
const CARD_H = 210
const IMAGE_H = 118
const BADGE_H = 34

interface Props {
  event: Eveniment
  onClick: () => void
}

export function EvenimentCard({ event, onClick }: Props) {
  const visibleParticipants = event.top_participants.slice(0, 3)
  const overflow = event.participant_count - 3
  const { day, month } = formatDateParts(event.event_date)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 text-left active:scale-95 transition-transform flex flex-col relative"
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        borderRadius: '14px',
        background: 'var(--white)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.06)',
        overflow: 'visible', // lets date badge straddle the divider
      }}
    >
      {/* Image / gradient — clips its own corners */}
      <div
        style={{
          height: `${IMAGE_H}px`,
          flexShrink: 0,
          borderRadius: '13px 13px 0 0',
          overflow: 'hidden',
          position: 'relative',
          background: event.image_url ? undefined : gradientFromTitle(event.title),
        }}
      >
        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        )}

        {/* Scope badge — top left */}
        <span
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: 'white',
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '20px',
            padding: '2px 7px',
          }}
        >
          {SCOPE_LABELS[event.scope] || event.scope}
        </span>

        {/* Attending checkmark — top right */}
        {event.attending && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Date badge — straddles the dotted divider, left side */}
      <div
        style={{
          position: 'absolute',
          top: `${IMAGE_H - BADGE_H / 2}px`,
          left: '10px',
          zIndex: 10,
          background: 'var(--white)',
          borderRadius: '8px',
          padding: '3px 9px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.07)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '38px',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.1, color: 'var(--ink)' }}>
          {day}
        </span>
        <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink3)', letterSpacing: '0.04em' }}>
          {month}
        </span>
      </div>

      {/* Dotted divider */}
      <div style={{ borderTop: '1.5px dashed var(--border)' }} />

      {/* Content section */}
      <div
        style={{
          flex: 1,
          padding: `${BADGE_H / 2 + 6}px 10px 10px 10px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: '0 0 13px 13px',
          background: 'var(--white)',
          overflow: 'hidden',
        }}
      >
        {/* Title */}
        <p
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {event.title}
        </p>

        {/* Participants */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {event.participant_count === 0 ? (
            <span style={{ fontSize: '10px', color: 'var(--ink3)' }}>Fii primul!</span>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {visibleParticipants.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '2px solid var(--white)',
                      background: p.avatar_url ? undefined : avatarColor(p.name),
                      marginLeft: i > 0 ? '-7px' : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 3 - i,
                    }}
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
