'use client'

import { motion } from 'framer-motion'
import type { CaruselPost } from '../types'

interface FilmStripProps {
  top8: CaruselPost[]
  totalCount: number
  onFrameClick: (post: CaruselPost) => void
}

const PERF_COUNT = 36

function frameBorder(rank: number): string {
  if (rank === 1) return '#F5D06A'
  if (rank <= 3) return 'rgba(245,208,106,0.45)'
  return 'transparent'
}

function frameOpacity(rank: number): number {
  if (rank === 1) return 1
  if (rank <= 3) return 0.85
  return 0.55
}

function PerfRow() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '7px',
        padding: '4px 0 4px 8px',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: PERF_COUNT }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '12px',
            height: '8px',
            borderRadius: '2px',
            background: 'var(--cream2)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

export function FilmStrip({ top8, totalCount, onFrameClick }: FilmStripProps) {
  if (top8.length === 0) return null

  return (
    <div style={{ padding: '10px 14px 4px' }}>
      {/* Encapsulating rectangle */}
      <div
        style={{
          background: '#1C1917',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        {/* Labels at top */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '7px 12px 5px',
          }}
        >
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#5A5450',
            }}
          >
            TOP 8 APRECIATE
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#5A5450',
            }}
          >
            {totalCount} POSTĂRI
          </span>
        </div>

        <PerfRow />

        {/* Scrollable frames — photos only, no text overlays */}
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: '5px', padding: '5px 8px', overflowX: 'auto' }}
        >
          {top8.map((post, i) => {
            const rank = i + 1
            return (
              <motion.button
                key={post.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => onFrameClick(post)}
                style={{
                  width: '60px',
                  height: '44px',
                  borderRadius: '2px',
                  border: `1.5px solid ${frameBorder(rank)}`,
                  opacity: frameOpacity(rank),
                  flexShrink: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: 0,
                  background: '#2E2A27',
                  display: 'block',
                }}
              >
                <img
                  src={post.image_url}
                  alt={post.caption || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </motion.button>
            )
          })}
        </div>

        <PerfRow />
      </div>
    </div>
  )
}
