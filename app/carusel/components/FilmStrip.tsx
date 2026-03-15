'use client'

import { motion } from 'framer-motion'
import type { CaruselPost } from '../types'

interface FilmStripProps {
  top8: CaruselPost[]
  totalCount: number
  onFrameClick: (post: CaruselPost) => void
}

// Enough holes to always overflow the container width; parent clips the rest
const PERF_COUNT = 36

function PerfRow() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '7px',
        padding: '5px 0 5px 14px',
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
            background: '#2E2A27',
            border: '1px solid #3A3532',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

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

export function FilmStrip({ top8, totalCount, onFrameClick }: FilmStripProps) {
  if (top8.length === 0) return null

  return (
    <div style={{ background: '#1C1917', overflow: 'hidden' }}>
      <PerfRow />

      {/* Scrollable frames */}
      <div
        className="scrollbar-hide"
        style={{ display: 'flex', gap: '5px', padding: '4px 14px', overflowX: 'auto' }}
      >
        {top8.map((post, i) => {
          const rank = i + 1

          return (
            <motion.button
              key={post.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onFrameClick(post)}
              style={{
                position: 'relative',
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
              {/* Rank badge */}
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '7px',
                  fontWeight: 700,
                  color: '#F5D06A',
                  lineHeight: 1,
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                }}
              >
                #{rank}
              </span>
              {/* Like count */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '3px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '7px',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1,
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                }}
              >
                {post.likes}
              </span>
            </motion.button>
          )
        })}
      </div>

      <PerfRow />

      {/* Strip labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 14px 6px' }}>
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
          {totalCount} POSTĂRI TOTALE
        </span>
      </div>
    </div>
  )
}
