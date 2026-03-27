'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ULogoSwitcher } from '@/components/ULogoSwitcher'
import { LEVELS, useLevelContext } from '@/contexts/LevelContext'

const LEVEL_INDEX = 1
const lv = LEVELS[LEVEL_INDEX]

export default function FacultatePage() {
  const { setLevelIndex, switchLevel } = useLevelContext()

  // Sync level to FACULTATE on first mount (handles direct URL navigation)
  useEffect(() => {
    setLevelIndex(LEVEL_INDEX)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleBackToLiceu() {
    switchLevel(0)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream2)' }}>
      {/* Minimal topbar */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}
      >
        <div style={{ height: 3, background: lv.color, transition: 'background 0.4s ease' }} />
        <div
          className="max-w-sm mx-auto px-4 flex items-center gap-3"
          style={{ paddingTop: 8, paddingBottom: 10 }}
        >
          <ULogoSwitcher />
          <div style={{ marginLeft: 4 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, lineHeight: 1.2,
              color: lv.color,
            }}>
              {lv.inst}
            </p>
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, letterSpacing: '0.1em',
              color: lv.color, opacity: 0.85, lineHeight: 1.2, marginTop: 2,
            }}>
              {lv.label} <span style={{ opacity: 0.6 }}>▾</span>
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ paddingBottom: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="max-w-sm w-full space-y-6"
        >
          {/* Icon */}
          <div
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: lv.soft }}
          >
            🚧
          </div>

          {/* Title */}
          <div>
            <h1
              className="font-display text-2xl mb-2"
              style={{ color: 'var(--ink)' }}
            >
              Facultate — În curând
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--ink3)' }}
            >
              Această secțiune este în lucru de vibecoders noștri.{' '}
              <span style={{ fontWeight: 600, color: lv.color }}>Stay put.</span>
            </p>
          </div>

          {/* Institution badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mx-auto"
            style={{
              background: lv.soft,
              color: lv.color,
            }}
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
              {lv.inst}
            </span>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={handleBackToLiceu}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
            style={{
              background: LEVELS[0].color,
              color: 'white',
              boxShadow: `0 4px 18px ${LEVELS[0].color}40`,
            }}
          >
            ← Înapoi la Liceu
          </button>
        </motion.div>
      </div>
    </div>
  )
}
