'use client'

import { Plus } from 'lucide-react'

interface Props {
  onClick: () => void
}

export function EvenimentCreateCard({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-opacity hover:opacity-70 active:scale-95"
      style={{
        width: '160px',
        height: '144px',
        border: '2px dashed var(--border)',
        background: 'var(--cream2)',
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'var(--white)', border: '1.5px solid var(--border)' }}
      >
        <Plus size={16} style={{ color: 'var(--ink3)' }} strokeWidth={2} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink3)' }}>
        Adaugă eveniment
      </span>
    </button>
  )
}
