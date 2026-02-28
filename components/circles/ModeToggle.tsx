'use client'

import { ALL_CIRCLES, CIRCLE_CONFIG } from './circleConfig'

export function CircleSummary() {
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px]"
      style={{ background: 'rgba(46,205,167,0.03)', border: '1px solid rgba(46,205,167,0.07)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2ECDA7' }} />
      {ALL_CIRCLES.map((key, i) => (
        <span key={key} style={{ color: 'rgba(255,255,255,0.45)' }}>
          {i > 0 && ' · '}
          {CIRCLE_CONFIG[key].emoji} {CIRCLE_CONFIG[key].label}
        </span>
      ))}
    </div>
  )
}
