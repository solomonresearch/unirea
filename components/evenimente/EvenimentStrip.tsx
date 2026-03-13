'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { Eveniment } from './types'
import { EvenimentCard } from './EvenimentCard'
import { EvenimentCreateCard } from './EvenimentCreateCard'

interface Props {
  events: Eveniment[]
  loading: boolean
  onAddClick: () => void
  onCardClick: (event: Eveniment) => void
  currentUserId: string
}

export function EvenimentStrip({ events, loading, onAddClick, onCardClick }: Props) {
  return (
    <div>
      {/* Header row */}
      <div className="max-w-sm mx-auto px-4 flex items-center justify-between mb-2">
        <span
          className="font-bold tracking-wider"
          style={{ fontSize: '10px', color: 'var(--ink3)', letterSpacing: '0.08em' }}
        >
          EVENIMENTE
        </span>
        <Link
          href="/avizier/evenimente"
          className="font-semibold transition-opacity hover:opacity-70"
          style={{ fontSize: '11px', color: 'var(--ink2)' }}
        >
          Vezi toate →
        </Link>
      </div>

      {/* Scrollable row — constrained to max-w-sm */}
      <div className="max-w-sm mx-auto">
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ paddingLeft: '16px', paddingRight: '16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <EvenimentCreateCard onClick={onAddClick} />

        {loading && (
          <div className="flex items-center justify-center" style={{ width: '80px' }}>
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--ink3)' }} />
          </div>
        )}

        {!loading && events.map(event => (
          <EvenimentCard
            key={event.id}
            event={event}
            onClick={() => onCardClick(event)}
          />
        ))}

        {!loading && events.length === 0 && (
          <div className="flex items-center" style={{ minWidth: '120px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>Niciun eveniment viitor.</span>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
