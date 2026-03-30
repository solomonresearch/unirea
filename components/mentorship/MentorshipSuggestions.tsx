'use client'

import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'

export interface MentorSuggestion {
  id: string
  name: string
  username: string
  avatar_url: string | null
  /** Text shown on the card — mentor_text or mentee_text depending on context */
  offer_text: string | null
}

interface MentorshipSuggestionsProps {
  /** 'mentor' = show available mentors (current user is a mentee) */
  /** 'mentee' = show available mentees (current user is a mentor) */
  role: 'mentor' | 'mentee'
  suggestions: MentorSuggestion[]
}

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function SuggestionCard({ s }: { s: MentorSuggestion }) {
  const preview = s.offer_text ? s.offer_text.slice(0, 72) + (s.offer_text.length > 72 ? '…' : '') : null

  return (
    <Link
      href={`/profil/${s.username}`}
      className="flex-shrink-0 flex flex-col rounded-xl p-3 gap-2"
      style={{
        width: 152,
        background: 'var(--white)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-s)',
      }}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-2">
        {s.avatar_url ? (
          <img
            src={s.avatar_url}
            alt={s.name}
            className="rounded-full flex-shrink-0"
            style={{ width: 32, height: 32, objectFit: 'cover' }}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              background: avatarColor(s.name),
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {getInitials(s.name)}
          </div>
        )}
        <span
          className="text-xs font-semibold leading-tight line-clamp-2"
          style={{ color: 'var(--ink)' }}
        >
          {s.name}
        </span>
      </div>

      {/* Text preview */}
      {preview ? (
        <p
          className="text-xs leading-snug"
          style={{ color: 'var(--ink3)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {preview}
        </p>
      ) : (
        <p className="text-xs italic" style={{ color: 'var(--ink3)' }}>Fără descriere</p>
      )}
    </Link>
  )
}

export function MentorshipSuggestions({ role, suggestions }: MentorshipSuggestionsProps) {
  const title = role === 'mentee' ? 'Mentori disponibili' : 'Mentee care caută'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <HeartHandshake size={13} style={{ color: 'var(--amber)' }} />
        <span
          className="font-bold uppercase tracking-widest"
          style={{ color: 'var(--ink3)', fontSize: 10 }}
        >
          {title}
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {suggestions.map(s => (
          <SuggestionCard key={s.id} s={s} />
        ))}
        {suggestions.length === 0 && (
          <p className="text-xs italic py-1" style={{ color: 'var(--ink3)' }}>
            Nimeni disponibil momentan.
          </p>
        )}
      </div>
    </div>
  )
}
