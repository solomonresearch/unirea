'use client'

import { Calendar } from 'lucide-react'
import { type CircleKey, CIRCLE_CONFIG } from './circleConfig'

interface CircleChipsProps {
  circles: CircleKey[]
  activeFilters: CircleKey[]
  counts: Record<string, number>
  onToggle: (key: CircleKey) => void
  generationFilter?: boolean
  onGenerationToggle?: () => void
}

export function CircleChips({ circles, activeFilters, counts, onToggle, generationFilter, onGenerationToggle }: CircleChipsProps) {
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
      {onGenerationToggle && (
        <button
          type="button"
          role="switch"
          aria-checked={generationFilter}
          onClick={onGenerationToggle}
          className="flex items-center gap-1.5 px-1 py-2 text-xs font-semibold"
          style={{ color: 'var(--ink2)' }}
        >
          <div
            className="relative w-8 h-[18px] rounded-full transition-colors duration-200 flex-shrink-0"
            style={{ background: generationFilter ? 'var(--amber)' : 'var(--border)' }}
          >
            <div
              className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-transform duration-200"
              style={{
                background: 'var(--white)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transform: generationFilter ? 'translateX(16px)' : 'translateX(2px)',
              }}
            />
          </div>
          <span className="text-xxs" style={{ color: generationFilter ? 'var(--amber-dark)' : 'var(--ink3)' }}>±2 ani</span>
        </button>
      )}
    </div>
  )
}
