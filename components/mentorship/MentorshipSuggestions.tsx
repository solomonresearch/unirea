'use client'

import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'
import { TAXONOMY } from '@/lib/taxonomy'

export interface MentorSuggestion {
  user_id: string
  name: string
  username: string
  avatar_url: string | null
  offer_text: string | null
  score: number        // Jaccard overlap [0, 1]
  shared_slugs: string[]
}

interface MentorshipSuggestionsProps {
  /** 'mentor' = show available mentors (current user is a mentee) */
  /** 'mentee' = show available mentees (current user is a mentor)  */
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
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function ScoreBadge({ score }: { score: number }) {
  if (score === 0) return null
  const pct = Math.round(score * 100)
  // Color ramp: low (<30%) amber, mid (30–60%) teal, high (>60%) green
  const style =
    pct >= 60
      ? { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }
      : pct >= 30
      ? { background: 'var(--teal-soft)', color: 'var(--teal)', border: '1px solid var(--teal)' }
      : { background: 'var(--amber-soft)', color: 'var(--amber-dark)', border: '1px solid var(--amber)' }

  return (
    <span
      className="self-start rounded-full px-1.5 py-0.5 font-bold"
      style={{ fontSize: 9, ...style }}
    >
      {pct}% potrivire
    </span>
  )
}

function SuggestionCard({ s }: { s: MentorSuggestion }) {
  const preview = s.offer_text
    ? s.offer_text.slice(0, 80) + (s.offer_text.length > 80 ? '…' : '')
    : null

  return (
    <Link
      href={`/profil/${s.username}`}
      className="flex-shrink-0 flex flex-col rounded-xl p-3 gap-2"
      style={{
        width: 160,
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
              width: 32, height: 32,
              background: avatarColor(s.name),
              color: '#fff', fontSize: 11, fontWeight: 700,
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

      {/* Text preview or shared slug pills */}
      {preview ? (
        <p
          className="text-xs leading-snug flex-1"
          style={{
            color: 'var(--ink3)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {preview}
        </p>
      ) : s.shared_slugs?.length > 0 ? (
        <div className="flex flex-wrap gap-1 flex-1">
          {s.shared_slugs.slice(0, 4).map(slug => {
            const label = TAXONOMY.find(c => c.slug === slug)?.label ?? slug
            return (
              <span
                key={slug}
                className="px-1.5 py-0.5 rounded-full leading-tight"
                style={{
                  fontSize: 10,
                  background: 'var(--amber-soft)',
                  color: 'var(--amber-dark)',
                  border: '1px solid var(--amber)',
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      ) : (
        <p className="text-xs italic flex-1" style={{ color: 'var(--ink3)' }}>Fără descriere</p>
      )}

      {/* Match score badge */}
      <ScoreBadge score={s.score} />
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
        {suggestions.length > 0
          ? suggestions.map(s => <SuggestionCard key={s.user_id} s={s} />)
          : (
            <p className="text-xs italic py-1" style={{ color: 'var(--ink3)' }}>
              Nimeni disponibil momentan.
            </p>
          )
        }
      </div>
    </div>
  )
}
