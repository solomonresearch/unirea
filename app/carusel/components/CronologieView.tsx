'use client'

import { useState, useRef, useEffect, RefObject } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import type { CaruselPost } from '../types'

const CARD_COLLAPSED = 180
const CARD_EXPANDED  = 340
const CARD_OVERLAP   = CARD_COLLAPSED * 0.5   // 90px

interface CronologieViewProps {
  posts: CaruselPost[]
  userId: string | null
  isAdmin: boolean
  top8Ids: Set<string>
  top8Ranks: Map<string, number>
  onLike: (postId: string) => void
  onDelete: (postId: string) => void
  onImageClick: (post: CaruselPost) => void
}

function formatPhotoDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Timeline Rail ────────────────────────────────────────────────────────────

interface TimelineRailProps {
  posts: CaruselPost[]
  activeId: string | null
}

function TimelineRail({ posts, activeId }: TimelineRailProps) {
  const dotSpacing = CARD_COLLAPSED - CARD_OVERLAP  // 90px

  // Collect first-post index per year for year labels
  const yearFirstIndex = new Map<number, number>()
  posts.forEach((p, i) => {
    const y = new Date(p.photo_date ?? p.created_at).getFullYear()
    if (!yearFirstIndex.has(y)) yearFirstIndex.set(y, i)
  })

  const totalHeight = posts.length > 0
    ? CARD_COLLAPSED + (posts.length - 1) * dotSpacing + CARD_EXPANDED
    : 0

  return (
    <div style={{ width: 32, flexShrink: 0, position: 'relative', height: totalHeight }}>
      {/* Vertical gradient line */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          top: 0,
          bottom: 0,
          width: 1.5,
          background: 'linear-gradient(to bottom, var(--border), transparent)',
          pointerEvents: 'none',
        }}
      />

      {posts.map((post, i) => {
        const isActive = post.id === activeId
        const y = new Date(post.photo_date ?? post.created_at).getFullYear()
        const isYearFirst = yearFirstIndex.get(y) === i
        const top = i * dotSpacing

        return (
          <div key={post.id} style={{ position: 'absolute', top, left: 0, width: 32 }}>
            {/* Year label at first post of each year */}
            {isYearFirst && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: -14,
                  width: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 7,
                    fontWeight: 700,
                    color: 'var(--ink3)',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {y}
                </span>
              </div>
            )}

            {/* Dot */}
            <motion.div
              animate={{
                scale: isActive ? 1.4 : 1,
                background: isActive ? 'var(--ink)' : 'var(--white)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              style={{
                position: 'absolute',
                left: 10,
                top: 4,
                width: 9,
                height: 9,
                borderRadius: '50%',
                border: '2px solid var(--border)',
                transformOrigin: 'center',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Snap Card ────────────────────────────────────────────────────────────────

interface SnapCardProps {
  post: CaruselPost
  index: number
  isFirst: boolean
  isActive: boolean
  rank: number | undefined
  userId: string | null
  isAdmin: boolean
  containerRef: RefObject<HTMLDivElement>
  onBecomeActive: () => void
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onImageClick: (post: CaruselPost) => void
}

function SnapCard({
  post,
  index,
  isFirst,
  isActive,
  rank,
  userId,
  isAdmin,
  containerRef,
  onBecomeActive,
  onLike,
  onDelete,
  onImageClick,
}: SnapCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    const root = containerRef.current
    if (!el || !root) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onBecomeActive() },
      { root, threshold: 0.55 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, onBecomeActive])

  return (
    <div
      ref={wrapRef}
      style={{
        scrollSnapAlign: 'start',
        marginTop: isFirst ? 0 : -CARD_OVERLAP,
        position: 'relative',
        zIndex: isActive ? 10 : index % 2 === 0 ? 2 : 1,
      }}
    >
      <motion.div
        animate={{ height: isActive ? CARD_EXPANDED : CARD_COLLAPSED }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        style={{ overflow: 'hidden', borderRadius: 12, position: 'relative' }}
      >
        {/* Photo */}
        <button
          onClick={() => onImageClick(post)}
          style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <img
            src={post.image_url}
            alt={post.caption || ''}
            style={{ width: '100%', height: CARD_EXPANDED, objectFit: 'cover', display: 'block' }}
          />
        </button>

        {/* Date + location overlay */}
        <motion.div
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 8 }}
          transition={{ duration: 0.22, delay: isActive ? 0.18 : 0 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
            padding: '32px 12px 12px',
            pointerEvents: 'none',
          }}
        >
          <p style={{ color: 'white', fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700 }}>
            {formatPhotoDate(post.photo_date ?? post.created_at)}
          </p>
          {post.location_text && (
            <p style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Space Mono', monospace", fontSize: 10, marginTop: 2 }}>
              📍 {post.location_text}
            </p>
          )}
        </motion.div>

        {/* Rank badge */}
        {rank && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'rgba(20,18,16,0.65)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(245,208,106,0.4)',
              borderRadius: 4,
              padding: '2px 5px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 7,
              fontWeight: 700,
              color: '#F5D06A',
            }}
          >
            👑 #{rank}
          </div>
        )}
      </motion.div>

      {/* Action row */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.15, delay: isActive ? 0.1 : 0 }}
        style={{
          paddingTop: 6,
          paddingBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 4,
          pointerEvents: isActive ? 'auto' : 'none',
        }}
      >
        <button
          onClick={() => onLike(post.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: post.liked ? '#E05252' : 'var(--ink3)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          <Heart size={11} fill={post.liked ? '#E05252' : 'none'} />
          {post.likes}
        </button>

        <button
          onClick={() => onImageClick(post)}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: 'var(--ink3)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          <MessageCircle size={11} />
          {post.comments.length}
        </button>

        {(post.user_id === userId || isAdmin) && (
          <button
            onClick={() => onDelete(post.id)}
            style={{
              display: 'flex', alignItems: 'center',
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              color: 'var(--ink3)',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            }}
          >
            <Trash2 size={11} />
          </button>
        )}

        <button
          onClick={() =>
            navigator.share?.({ title: post.caption || 'Amintire', url: `${window.location.origin}/carusel/${post.id}` }).catch(() => {})
          }
          style={{
            display: 'flex', alignItems: 'center',
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: 'var(--ink3)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <Share2 size={11} />
        </button>
      </motion.div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CronologieView({
  posts,
  userId,
  isAdmin,
  top8Ids,
  top8Ranks,
  onLike,
  onDelete,
  onImageClick,
}: CronologieViewProps) {
  const [activeId, setActiveId] = useState<string | null>(posts[0]?.id ?? null)
  const containerRef = useRef<HTMLDivElement>(null)

  if (posts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
        <p style={{ color: 'var(--ink3)', fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
          Nicio postare încă
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100svh - 224px)', overflow: 'hidden', paddingLeft: 16, paddingRight: 16 }}>
      {/* Left timeline rail */}
      <TimelineRail posts={posts} activeId={activeId} />

      {/* Snap-scroll card stack */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: CARD_EXPANDED,
          paddingLeft: 8,
        }}
        className="scrollbar-hide"
      >
        {posts.map((post, i) => (
          <SnapCard
            key={post.id}
            post={post}
            index={i}
            isFirst={i === 0}
            isActive={activeId === post.id}
            rank={top8Ids.has(post.id) ? top8Ranks.get(post.id) : undefined}
            userId={userId}
            isAdmin={isAdmin}
            containerRef={containerRef as RefObject<HTMLDivElement>}
            onBecomeActive={() => setActiveId(post.id)}
            onLike={onLike}
            onDelete={onDelete}
            onImageClick={onImageClick}
          />
        ))}
      </div>
    </div>
  )
}
