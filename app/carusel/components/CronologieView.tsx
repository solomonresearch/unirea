'use client'

import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import { relativeTime, getInitials } from '@/lib/utils'
import type { CaruselPost } from '../types'

interface CronologieViewProps {
  postsByYear: Map<number, CaruselPost[]>
  userId: string | null
  isAdmin: boolean
  top8Ids: Set<string>
  top8Ranks: Map<string, number>
  onLike: (postId: string) => void
  onDelete: (postId: string) => void
  onImageClick: (post: CaruselPost) => void
}

interface TimelineItemProps {
  post: CaruselPost
  globalIndex: number
  userId: string | null
  isAdmin: boolean
  rank: number | undefined
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onImageClick: (post: CaruselPost) => void
}

function TimelineItem({ post, globalIndex, userId, isAdmin, rank, onLike, onDelete, onImageClick }: TimelineItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const month = new Date(post.created_at)
    .toLocaleString('ro-RO', { month: 'short' })
    .toUpperCase()
    .replace('.', '')

  const tilt = globalIndex % 2 === 0 ? 0.7 : -0.5

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}
    >
      {/* Spine col */}
      <div
        style={{
          width: '22px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          paddingTop: '4px',
        }}
      >
        <div
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: 'white',
            border: '2px solid var(--border)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '7px',
            fontWeight: 700,
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: 'var(--ink3)',
            opacity: 0.7,
            marginTop: '2px',
            letterSpacing: '0.05em',
          }}
        >
          {month}
        </span>
      </div>

      {/* Polaroid */}
      <motion.div
        style={{ flex: 1, rotate: tilt }}
        whileHover={{ rotate: 0, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div
          style={{
            background: '#FDFCFA',
            borderRadius: '3px',
            padding: '8px 8px 12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08), 0 6px 20px rgba(0,0,0,0.07)',
          }}
        >
          {/* Photo */}
          <button
            onClick={() => onImageClick(post)}
            style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '2px', overflow: 'hidden' }}>
              <img
                src={post.image_url}
                alt={post.caption || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {rank && (
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(20,18,16,0.65)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(245,208,106,0.4)',
                    borderRadius: '4px',
                    padding: '2px 5px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '7px',
                    fontWeight: 700,
                    color: '#F5D06A',
                  }}
                >
                  👑 #{rank}
                </div>
              )}
            </div>
          </button>

          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
            <div
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '4px',
                background: 'var(--amber-soft)',
                color: 'var(--amber-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '7px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getInitials(post.profiles.name)}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--ink2)' }}>
              {post.profiles.name}
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--ink3)', marginLeft: 'auto' }}>
              {relativeTime(post.created_at)}
            </span>
          </div>

          {/* Caption */}
          {post.caption && (
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '12px',
                lineHeight: 1.4,
                color: 'var(--ink2)',
                marginTop: '5px',
              }}
            >
              {post.caption}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => onLike(post.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: post.liked ? '#E05252' : 'var(--ink3)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <Heart size={11} fill={post.liked ? '#E05252' : 'none'} />
              {post.likes}
            </button>

            <button
              onClick={() => onImageClick(post)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: 'var(--ink3)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={11} />
              {post.comments.length}
            </button>

            {(post.user_id === userId || isAdmin) && (
              <button
                onClick={() => onDelete(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  color: 'var(--ink3)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={11} />
              </button>
            )}

            <button
              onClick={() =>
                navigator
                  .share?.({ title: post.caption || 'Amintire', url: `${window.location.origin}/carusel/${post.id}` })
                  .catch(() => {})
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px',
                color: 'var(--ink3)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <Share2 size={11} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function CronologieView({
  postsByYear,
  userId,
  isAdmin,
  top8Ids,
  top8Ranks,
  onLike,
  onDelete,
  onImageClick,
}: CronologieViewProps) {
  const years = useMemo(
    () => [...postsByYear.keys()].sort((a, b) => b - a),
    [postsByYear]
  )

  // Precompute a stable global index for each post (for tilt direction)
  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    let gi = 0
    for (const year of years) {
      for (const post of postsByYear.get(year)!) {
        map.set(post.id, gi++)
      }
    }
    return map
  }, [years, postsByYear])

  if (years.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
        <p style={{ color: 'var(--ink3)', fontFamily: "'Space Mono', monospace", fontSize: '10px' }}>
          Nicio postare încă
        </p>
      </div>
    )
  }

  const hintYears = years.slice(1)

  return (
    <div>
      {years.map(year => {
        const yearPosts = postsByYear.get(year)!
        return (
          <div key={year}>
            {/* Year divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px 4px' }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--border)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {year}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Timeline track */}
            <div style={{ position: 'relative', padding: '8px 16px 0' }}>
              {/* Spine line */}
              <div
                style={{
                  position: 'absolute',
                  left: '27px',
                  top: 0,
                  bottom: 0,
                  width: '1.5px',
                  background: 'linear-gradient(to bottom, var(--border), transparent)',
                  pointerEvents: 'none',
                }}
              />

              {yearPosts.map(post => (
                <TimelineItem
                  key={post.id}
                  post={post}
                  globalIndex={globalIndexMap.get(post.id) ?? 0}
                  userId={userId}
                  isAdmin={isAdmin}
                  rank={top8Ids.has(post.id) ? top8Ranks.get(post.id) : undefined}
                  onLike={onLike}
                  onDelete={onDelete}
                  onImageClick={onImageClick}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Bottom hint */}
      {hintYears.length > 0 && (
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            color: 'var(--ink3)',
            letterSpacing: '0.1em',
            textAlign: 'center',
            padding: '8px 0 24px',
          }}
        >
          · · · mai jos — {hintYears.join(', ')} · · ·
        </p>
      )}
    </div>
  )
}
