'use client'

import { ALL_CIRCLES, CIRCLE_CONFIG } from './circleConfig'

export function CircleSummary() {
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px]"
      style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--teal)' }} />
      {ALL_CIRCLES.map((key, i) => (
        <span key={key} style={{ color: 'var(--ink2)' }}>
          {i > 0 && ' · '}
          {CIRCLE_CONFIG[key].emoji} {CIRCLE_CONFIG[key].label}
        </span>
      ))}
    </div>
  )
}
