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
      className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center gap-2 transition-opacity hover:opacity-70 active:scale-95"
      style={{
        width: '95px',
        height: '141px',
        border: '2px dashed var(--border)',
        background: 'var(--cream2)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'var(--ink)' }}
      >
        <Plus size={20} color="white" strokeWidth={2.5} />
      </div>
      <span
        className="text-center leading-tight"
        style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink3)' }}
      >
        Adaugă<br />eveniment
      </span>
    </button>
  )
}
