'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { EvenimentDetail } from './types'

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

function downloadIcs(title: string, dateStr: string, timeStr: string | null, location: string | null, description: string | null) {
  // Build start/end datetime strings in iCal format
  const dateParts = dateStr.replace(/-/g, '')
  let dtStart: string
  let dtEnd: string

  if (timeStr) {
    const timeParts = timeStr.replace(/:/g, '').slice(0, 6).padEnd(6, '0')
    dtStart = `${dateParts}T${timeParts}`
    // Default duration: 2 hours
    const [h, m] = timeStr.split(':').map(Number)
    const endH = String((h + 2) % 24).padStart(2, '0')
    dtEnd = `${dateParts}T${endH}${String(m).padStart(2, '0')}00`
  } else {
    dtStart = `${dateParts}`
    dtEnd = `${dateParts}`
  }

  const isAllDay = !timeStr
  const dtStartLine = isAllDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`
  const dtEndLine = isAllDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`

  const uid = `${Date.now()}@unirea.app`
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unirea//Unirea App//RO',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function mapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

function formatEventDate(dateStr: string, timeStr: string | null): string {
  const d = new Date(dateStr + 'T00:00:00')
  const datePart = d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })
  if (!timeStr) return datePart
  return `${datePart}, ${timeStr.slice(0, 5)}`
}

interface Props {
  event: EvenimentDetail
  currentUserId: string
  isAdmin: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onRsvpToggle: (attending: boolean) => void
}

export function EvenimentDetailModal({
  event,
  currentUserId,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onRsvpToggle,
}: Props) {
  const [attending, setAttending] = useState(event.attending)
  const [participantCount, setParticipantCount] = useState(event.participant_count)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = event.user_id === currentUserId
  const canEdit = isOwner || isAdmin

  async function handleRsvp() {
    setRsvpLoading(true)
    const res = await fetch(`/api/evenimente/${event.id}/participare`, { method: 'POST' })
    if (res.ok) {
      const json = await res.json()
      setAttending(json.attending)
      setParticipantCount(prev => json.attending ? prev + 1 : Math.max(0, prev - 1))
      onRsvpToggle(json.attending)
    }
    setRsvpLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/evenimente/${event.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDelete()
      onClose()
    }
    setDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl overflow-y-auto"
        style={{
          background: 'var(--white)',
          maxHeight: '92dvh',
          boxShadow: 'var(--shadow-m)',
        }}
      >
        {/* Image / gradient header */}
        <div
          className="relative"
          style={{
            height: '192px',
            background: event.image_url ? undefined : gradientFromTitle(event.title),
          }}
        >
          {event.image_url && (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          )}

          {/* Overlay gradient for readability */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 60%)' }}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <X size={16} color="white" />
          </button>

          {/* Scope badge */}
          <span
            className="absolute top-3 left-1/2 -translate-x-1/2 text-white rounded-full px-2.5 py-0.5"
            style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(0,0,0,0.45)' }}
          >
            {SCOPE_LABELS[event.scope] || event.scope}
          </span>

          {/* Edit / delete (creator or admin) */}
          {canEdit && (
            <div className="absolute top-3 right-3 flex gap-1.5">
              <button
                type="button"
                onClick={onEdit}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <Pencil size={14} color="white" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <Trash2 size={14} color="white" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3">
          <h2 className="font-bold text-base leading-tight" style={{ color: 'var(--ink)' }}>
            {event.title}
          </h2>

          {/* Date pill — click to download ICS */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadIcs(event.title, event.event_date, event.event_time, event.location, event.description)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 transition-opacity hover:opacity-70 active:opacity-50"
              style={{ background: 'var(--cream2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--ink2)', fontWeight: 500 }}
              title="Adaugă în calendar"
            >
              <Calendar size={12} style={{ color: 'var(--ink3)' }} />
              {formatEventDate(event.event_date, event.event_time)}
              <ExternalLink size={10} style={{ color: 'var(--ink3)', marginLeft: '2px' }} />
            </button>
          </div>

          {/* Location pill — click to open Google Maps */}
          {event.location && (
            <div className="flex items-center gap-2">
              <a
                href={mapsUrl(event.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full px-3 py-1 transition-opacity hover:opacity-70 active:opacity-50"
                style={{ background: 'var(--cream2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--ink2)', fontWeight: 500, textDecoration: 'none' }}
                title="Deschide în Maps"
              >
                <MapPin size={12} style={{ color: 'var(--ink3)' }} />
                {event.location}
                <ExternalLink size={10} style={{ color: 'var(--ink3)', marginLeft: '2px' }} />
              </a>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-xxs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ink3)' }}>
                Despre eveniment
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
                {event.description}
              </p>
            </div>
          )}

          {/* Participants */}
          <div>
            <p className="text-xxs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ink3)' }}>
              Participanți confirmați ({participantCount})
            </p>
            {event.participants.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {event.participants.slice(0, 6).map(p => (
                    <div
                      key={p.id}
                      className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ background: p.avatar_url ? undefined : avatarColor(p.name) }}
                      title={p.name}
                    >
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontSize: '8px', fontWeight: 700, color: 'white' }}>
                          {getInitials(p.name)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {event.participants.length > 6 && (
                  <span style={{ fontSize: '11px', color: 'var(--ink3)', fontWeight: 600 }}>
                    +{event.participants.length - 6} alții
                  </span>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--ink3)' }}>Fii primul care confirmă participarea!</p>
            )}
          </div>

          {/* RSVP button */}
          <button
            type="button"
            onClick={handleRsvp}
            disabled={rsvpLoading}
            className="w-full py-3 rounded-sm text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
            style={attending ? {
              background: 'transparent',
              border: '2px solid var(--rose)',
              color: 'var(--rose)',
            } : {
              background: 'var(--ink)',
              border: '2px solid var(--ink)',
              color: 'var(--white)',
            }}
          >
            {rsvpLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : attending ? (
              'Nu merg'
            ) : (
              'Merg!'
            )}
          </button>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div
            className="w-full max-w-xs rounded-xl p-5 space-y-3"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-m)' }}
          >
            <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
              Ștergi evenimentul?
            </p>
            <p className="text-xs" style={{ color: 'var(--ink3)' }}>
              Această acțiune este permanentă și nu poate fi anulată.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-sm text-xs font-semibold"
                style={{ background: 'var(--cream2)', color: 'var(--ink)' }}
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-sm text-xs font-semibold text-white disabled:opacity-40 flex items-center justify-center"
                style={{ background: 'var(--rose)' }}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
