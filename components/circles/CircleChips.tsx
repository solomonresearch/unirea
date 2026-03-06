'use client'

import { type CircleKey, CIRCLE_CONFIG } from './circleConfig'

interface CircleChipsProps {
  circles: CircleKey[]
  activeFilters: CircleKey[]
  counts: Record<string, number>
  onToggle: (key: CircleKey) => void
}

export function CircleChips({ circles, activeFilters, counts, onToggle }: CircleChipsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {circles.map(key => {
        const cfg = CIRCLE_CONFIG[key]
        const active = activeFilters.includes(key)
        const count = counts[key] || 0
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(key)}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-200"
            style={{
              background: active ? `${cfg.color}15` : 'var(--white)',
              border: `1.5px solid ${active ? `${cfg.color}88` : 'var(--border)'}`,
              color: active ? cfg.color : 'var(--ink2)',
              animation: active ? 'chipPulse 2s ease-in-out infinite' : 'none',
            }}
          >
            <span>{cfg.emoji}</span>
            <span className="truncate">{cfg.label}</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium ml-auto"
              style={{
                background: active ? `${cfg.color}20` : 'var(--cream2)',
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
