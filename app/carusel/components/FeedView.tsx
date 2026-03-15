'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import { relativeTime, getInitials } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { CaruselPost } from '../types'

interface FeedViewProps {
  posts: CaruselPost[]
  userId: string | null
  isAdmin: boolean
  top8Ids: Set<string>
  top8Ranks: Map<string, number>
  onLike: (postId: string) => void
  onDelete: (postId: string) => void
  onImageClick: (post: CaruselPost) => void
}

export function FeedView({ posts, userId, isAdmin, top8Ids, top8Ranks, onLike, onDelete, onImageClick }: FeedViewProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  if (posts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: '8px' }}>
        <p style={{ color: 'var(--ink3)', fontFamily: "'Space Mono', monospace", fontSize: '11px' }}>
          Nicio postare încă
        </p>
      </div>
    )
  }

  return (
    <>
    <ConfirmDialog
      open={pendingDeleteId !== null}
      onOpenChange={open => { if (!open) setPendingDeleteId(null) }}
      title="Ștergi postarea?"
      description="Această acțiune este permanentă și nu poate fi anulată."
      onConfirm={() => { if (pendingDeleteId) onDelete(pendingDeleteId) }}
    />
    <div style={{ paddingBottom: '8px' }}>
      {posts.map((post, i) => {
        const rank = top8Ranks.get(post.id)
        const isTop8 = top8Ids.has(post.id)

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            whileTap={{ scale: 0.985 }}
            style={{
              margin: '0 14px 12px',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(107,79,40,0.10)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '11px 12px 0', display: 'flex', alignItems: 'center', gap: '9px' }}>
              <Link href={`/profil/${post.profiles.username}`} style={{ flexShrink: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: 'var(--amber-soft)',
                    color: 'var(--amber-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(post.profiles.name)}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/profil/${post.profiles.username}`}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>
                    {post.profiles.name}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--ink3)' }}>
                    @{post.profiles.username}
                  </div>
                </Link>
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--ink3)', flexShrink: 0 }}>
                {relativeTime(post.created_at)}
              </span>
            </div>

            {/* Photo */}
            <div style={{ margin: '9px 12px', position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '4/3' }}>
              <button
                onClick={() => onImageClick(post)}
                style={{ display: 'block', width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <img
                  src={post.image_url}
                  alt={post.caption || 'Amintire'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
              {isTop8 && rank && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(20,18,16,0.65)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(245,208,106,0.4)',
                    borderRadius: '6px',
                    padding: '3px 7px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '8px',
                    fontWeight: 700,
                    color: '#F5D06A',
                  }}
                >
                  👑 #{rank} · {post.likes} likes
                </div>
              )}
            </div>

            {/* Caption */}
            {post.caption && (
              <div style={{ padding: '2px 12px 8px', fontSize: '13px', color: 'var(--ink2)' }}>
                {post.caption}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                padding: '9px 12px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <button
                onClick={() => onLike(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid',
                  borderColor: post.liked ? '#FBCFCF' : 'var(--border)',
                  background: post.liked ? '#FEF2F2' : 'var(--cream2)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '11px',
                  color: post.liked ? '#E05252' : 'var(--ink2)',
                  cursor: 'pointer',
                }}
              >
                <Heart size={13} fill={post.liked ? '#E05252' : 'none'} />
                {post.likes}
              </button>

              <button
                onClick={() => onImageClick(post)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--cream2)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '11px',
                  color: 'var(--ink2)',
                  cursor: 'pointer',
                }}
              >
                <MessageCircle size={13} />
                {post.comments.length}
              </button>

              {(post.user_id === userId || isAdmin) && (
                <button
                  onClick={() => setPendingDeleteId(post.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid var(--border)',
                    background: 'var(--cream2)',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    color: 'var(--ink3)',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
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
                  gap: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--cream2)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  color: 'var(--ink3)',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                <Share2 size={13} />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
    </>
  )
}
