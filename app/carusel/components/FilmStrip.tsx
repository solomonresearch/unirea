'use client'

import { motion } from 'framer-motion'
import type { CaruselPost } from '../types'

interface FilmStripProps {
  top8: CaruselPost[]
  totalCount: number
  onFrameClick: (post: CaruselPost) => void
}

const PERF_COUNT = 14

function PerfRow() {
  return (
    <div style={{ display: 'flex', gap: '7px', padding: '5px 14px' }}>
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
          const borderColor =
            rank === 1
              ? '#F5D06A'
              : rank <= 3
              ? 'rgba(245,208,106,0.45)'
              : 'transparent'
          const opacity = rank === 1 ? 1 : rank <= 3 ? 0.85 : 0.55

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
                border: `1.5px solid ${borderColor}`,
                opacity,
                flexShrink: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
                background: '#2E2A27',
              }}
            >
              <img
                src={post.image_url}
                alt={post.caption || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
                }}
              >
                #{rank}
              </span>
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '3px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '7px',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1,
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
