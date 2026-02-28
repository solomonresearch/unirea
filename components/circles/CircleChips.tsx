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
              background: active ? `${cfg.color}15` : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${active ? `${cfg.color}88` : 'rgba(255,255,255,0.08)'}`,
              color: active ? cfg.color : 'rgba(255,255,255,0.45)',
              animation: active ? 'chipPulse 2s ease-in-out infinite' : 'none',
            }}
          >
            <span>{cfg.emoji}</span>
            <span className="truncate">{cfg.label}</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium ml-auto"
              style={{
                background: active ? `${cfg.color}20` : 'rgba(255,255,255,0.06)',
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
