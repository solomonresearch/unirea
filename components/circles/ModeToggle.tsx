'use client'

import { type Mode, PERSONAL_CIRCLES, PROFESSIONAL_CIRCLES, CIRCLE_CONFIG } from './circleConfig'

interface ModeToggleProps {
  mode: Mode
  onSwitch: (mode: Mode) => void
}

const MODE_COLORS: Record<Mode, string> = {
  personal: '#2ECDA7',
  professional: '#7B61FF',
}

export function ModeToggle({ mode, onSwitch }: ModeToggleProps) {
  const color = MODE_COLORS[mode]
  const circles = mode === 'personal' ? PERSONAL_CIRCLES : PROFESSIONAL_CIRCLES

  return (
    <div className="space-y-2">
      <div className="relative flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="absolute top-1 bottom-1 rounded-lg transition-all duration-350"
          style={{
            left: mode === 'personal' ? '4px' : '50%',
            width: 'calc(50% - 4px)',
            background: `${color}15`,
            border: `1px solid ${color}33`,
            transition: 'left 350ms cubic-bezier(0.16, 1, 0.3, 1), background 200ms, border-color 200ms',
          }}
        />
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'personal'}
          onClick={() => onSwitch('personal')}
          className="relative z-10 flex-1 py-2.5 text-sm font-semibold text-center transition-colors duration-200"
          style={{ color: mode === 'personal' ? '#2ECDA7' : 'rgba(255,255,255,0.3)' }}
        >
          ☀️ Personal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'professional'}
          onClick={() => onSwitch('professional')}
          className="relative z-10 flex-1 py-2.5 text-sm font-semibold text-center transition-colors duration-200"
          style={{ color: mode === 'professional' ? '#7B61FF' : 'rgba(255,255,255,0.3)' }}
        >
          🏢 Profesional
        </button>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px]"
        style={{ background: `${color}08`, border: `1px solid ${color}12` }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        {circles.map((key, i) => (
          <span key={key} style={{ color: 'rgba(255,255,255,0.45)' }}>
            {i > 0 && ' · '}
            {CIRCLE_CONFIG[key].emoji} {CIRCLE_CONFIG[key].label}
          </span>
        ))}
      </div>
    </div>
  )
}
