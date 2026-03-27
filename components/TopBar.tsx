'use client'

import Link from 'next/link'
import { NotificationBell } from '@/components/NotificationBell'
import { ULogoSwitcher } from '@/components/ULogoSwitcher'
import { useLevelContext } from '@/contexts/LevelContext'

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

interface TopBarProps {
  title?: string
  institutionName?: string
  scope?: 'liceu' | 'promotie' | 'clasa'
  onScopeChange?: (s: 'liceu' | 'promotie' | 'clasa') => void
  rightSlot?: React.ReactNode
  userAvatar?: string | null
  userName?: string
}

export function TopBar({
  title,
  institutionName,
  scope,
  onScopeChange,
  rightSlot,
  userAvatar,
  userName = '',
}: TopBarProps) {
  const { level } = useLevelContext()
  const instName = institutionName ?? level.inst
  const hasScopeTabs = scope !== undefined && onScopeChange !== undefined

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}
    >
      {/* 3px level color strip */}
      <div style={{ height: 3, background: level.color, transition: 'background 0.4s ease' }} />

      <div className="max-w-sm mx-auto px-4">
        {/* Row 1: logo + inst info (left) | actions (right) */}
        <div
          className="flex items-center justify-between"
          style={{ paddingTop: 8, paddingBottom: title ? 4 : (hasScopeTabs ? 4 : 10) }}
        >
          {/* Left: ULogoSwitcher + inst name + level badge */}
          <div className="flex items-center gap-2 min-w-0">
            <ULogoSwitcher />
            <div style={{ marginLeft: 4, minWidth: 0 }}>
              <p style={{
                fontSize: 10,
                fontWeight: 600,
                lineHeight: 1.3,
                color: level.color,
                transition: 'color 0.4s ease',
                wordBreak: 'break-word',
                maxWidth: 148,
              }}>
                {instName}
              </p>
              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 8,
                letterSpacing: '0.1em',
                color: level.color,
                opacity: 0.85,
                transition: 'color 0.4s ease',
                lineHeight: 1.2,
                marginTop: 2,
              }}>
                {level.label}{' '}
                <span style={{ opacity: 0.6 }}>▾</span>
              </p>
            </div>
          </div>

          {/* Right: slot + bell + avatar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {rightSlot}
            <NotificationBell />
            <Link
              href="/setari"
              className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden"
              style={{ border: '2px solid var(--border)' }}
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xxs font-bold"
                  style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
                >
                  {getInitials(userName)}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2: page title centered */}
        {title && (
          <div
            className="text-center"
            style={{ paddingBottom: hasScopeTabs ? 4 : 10 }}
          >
            <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>
              {title}
            </span>
          </div>
        )}

        {/* Scope tabs — only when props provided */}
        {hasScopeTabs && (
          <div style={{ paddingBottom: 10, marginTop: 4 }}>
            <div className="flex rounded-md p-[3px]" style={{ background: 'var(--cream2)' }}>
              {(['liceu', 'promotie', 'clasa'] as const).map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onScopeChange(s)}
                  className="flex-1 py-[7px] rounded-sm text-xxs font-semibold transition-all"
                  style={scope === s ? {
                    background: 'var(--white)',
                    color: 'var(--ink)',
                    boxShadow: 'var(--shadow-s)',
                  } : {
                    color: 'var(--ink3)',
                  }}
                >
                  {level.tabs[i]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
