'use client'

import { useEffect, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from 'framer-motion'
import { X, Heart, MessageCircle, Trash2, Share2, Send } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { relativeTime, getInitials } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { CaruselPost, CaruselComment } from '../types'

interface PostModalProps {
  post: CaruselPost
  rank?: number
  userId: string | null
  isAdmin: boolean
  onClose: () => void
  onLike: () => void
  onShowLikers?: () => void
  onDelete: () => void
  onCommentAdded: (comment: CaruselComment) => void
  onCommentDeleted: (commentId: string) => void
}

export function PostModal({
  post,
  rank,
  userId,
  isAdmin,
  onClose,
  onLike,
  onShowLikers,
  onDelete,
  onCommentAdded,
  onCommentDeleted,
}: PostModalProps) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [panConstraints, setPanConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 })
  const [pendingDelete, setPendingDelete] = useState<'post' | string | null>(null)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  useEffect(() => {
    document.body.classList.add('modal-open')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.classList.remove('modal-open')
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    function update() {
      const gap = window.innerHeight - vv!.offsetTop - vv!.height
      setKeyboardOffset(Math.max(0, gap))
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  const ZOOM_SCALE = 2.4
  const scale = useMotionValue(1)
  const imgX = useMotionValue(0)
  const imgY = useMotionValue(0)
  const lastTap = useRef(0)
  const imgContainerRef = useRef<HTMLDivElement>(null)

  function handleImageTap() {
    const now = Date.now()
    const isDoubleTap = now - lastTap.current < 300
    lastTap.current = now
    if (!isDoubleTap) return

    if (zoomed) {
      setZoomed(false)
      animate(scale, 1, { type: 'spring', stiffness: 350, damping: 30 })
      animate(imgX, 0, { type: 'spring', stiffness: 350, damping: 30 })
      animate(imgY, 0, { type: 'spring', stiffness: 350, damping: 30 })
    } else {
      // Compute constraints from actual container size before animating
      const w = imgContainerRef.current?.clientWidth ?? 360
      const h = imgContainerRef.current?.clientHeight ?? 270
      const ex = (w * (ZOOM_SCALE - 1)) / 2
      const ey = (h * (ZOOM_SCALE - 1)) / 2
      setPanConstraints({ left: -ex, right: ex, top: -ey, bottom: ey })
      setZoomed(true)
      animate(scale, ZOOM_SCALE, { type: 'spring', stiffness: 350, damping: 30 })
    }
  }

  async function submitComment() {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: comment, error } = await supabase
        .from('carusel_comments')
        .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
        .select('id, post_id, content, created_at, user_id, profiles!user_id(name, username)')
        .single()

      if (!error && comment) {
        onCommentAdded(comment as unknown as CaruselComment)
        setNewComment('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('carusel_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)
    if (!error) onCommentDeleted(commentId)
  }

  return (
    <>
    <ConfirmDialog
      open={pendingDelete !== null}
      onOpenChange={open => { if (!open) setPendingDelete(null) }}
      title={pendingDelete === 'post' ? 'Ștergi postarea?' : 'Ștergi comentariul?'}
      description="Această acțiune este permanentă și nu poate fi anulată."
      onConfirm={() => {
        if (pendingDelete === 'post') { onDelete(); onClose() }
        else if (pendingDelete) handleDeleteComment(pendingDelete)
      }}
    />
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: 'rgba(10,8,6,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        className="fixed inset-x-0 z-[60] max-w-sm mx-auto"
        style={{
          bottom: 68 + keyboardOffset,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(92dvh - 68px)',
          background: 'var(--white)',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 42 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 16px 10px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'var(--amber-soft)',
              color: 'var(--amber-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(post.profiles.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>
              {post.profiles.name}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--ink3)' }}>
              {relativeTime(post.created_at)}
            </div>
          </div>
          {rank && (
            <div
              style={{
                background: 'rgba(20,18,16,0.88)',
                border: '1px solid rgba(245,208,106,0.4)',
                borderRadius: '6px',
                padding: '4px 9px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '9px',
                fontWeight: 700,
                color: '#F5D06A',
                flexShrink: 0,
              }}
            >
              👑 #{rank}
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--cream2)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              color: 'var(--ink3)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>

          {/* Image with zoom */}
          <div
            ref={imgContainerRef}
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#141210',
              aspectRatio: '4/3',
              touchAction: zoomed ? 'none' : 'auto',
            }}
            onClick={handleImageTap}
          >
            <motion.div
              style={{ scale, x: imgX, y: imgY, width: '100%', height: '100%' }}
              drag={zoomed}
              dragConstraints={panConstraints}
              dragElastic={0.05}
              dragMomentum={false}
            >
              <img
                src={post.image_url}
                alt={post.caption || 'Amintire'}
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none' }}
              />
            </motion.div>

            {/* Zoom hint */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: zoomed ? 0.6 : 0.85 }}
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '8px',
                color: 'rgba(255,255,255,0.75)',
                pointerEvents: 'none',
              }}
            >
              {zoomed ? '2× · dublu tap pentru ieșire' : 'dublu tap · zoom'}
            </motion.div>
          </div>

          {/* Caption */}
          {post.caption && (
            <div
              style={{
                padding: '14px 16px 6px',
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '14px',
                lineHeight: 1.55,
                color: 'var(--ink)',
              }}
            >
              {post.caption}
            </div>
          )}

          {/* Action bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: post.caption ? '10px 16px 14px' : '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                border: '1px solid',
                borderColor: post.liked ? '#FBCFCF' : 'var(--border)',
                background: post.liked ? '#FEF2F2' : 'var(--cream2)',
                borderRadius: '9px',
                overflow: 'hidden',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 11px',
                  borderRight: '1px solid',
                  borderColor: post.liked ? '#FBCFCF' : 'var(--border)',
                  background: 'transparent',
                  color: post.liked ? '#E05252' : 'var(--ink2)',
                  cursor: 'pointer',
                }}
              >
                <Heart size={14} fill={post.liked ? '#E05252' : 'none'} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => onShowLikers?.()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 11px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'transparent',
                  color: post.liked ? '#E05252' : 'var(--ink2)',
                  cursor: 'pointer',
                }}
              >
                {post.likes}
              </motion.button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '12px',
                color: 'var(--ink3)',
              }}
            >
              <MessageCircle size={14} />
              {post.comments.length}
            </div>

            {(post.user_id === userId || isAdmin) && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setPendingDelete('post')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid var(--border)',
                  background: 'var(--cream2)',
                  borderRadius: '9px',
                  padding: '7px 11px',
                  color: 'var(--ink3)',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() =>
                navigator
                  .share?.({ title: post.caption || 'Amintire', url: `${window.location.origin}/carusel/${post.id}` })
                  .catch(() => {})
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid var(--border)',
                background: 'var(--cream2)',
                borderRadius: '9px',
                padding: '7px 11px',
                color: 'var(--ink3)',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <Share2 size={14} />
            </motion.button>
          </div>

          {/* Comments */}
          <div style={{ padding: '16px 16px 4px' }}>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--ink3)',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              Comentarii · {post.comments.length}
            </div>

            {post.comments.length === 0 ? (
              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  color: 'var(--ink3)',
                  textAlign: 'center',
                  padding: '12px 0 20px',
                }}
              >
                Fii primul care comentează
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px' }}>
                {post.comments.map(comment => (
                  <div key={comment.id} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '7px',
                        background: 'var(--amber-soft)',
                        color: 'var(--amber-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {getInitials(comment.profiles.name)}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: 'var(--cream2)',
                        borderRadius: '12px',
                        padding: '9px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                          {comment.profiles.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: '9px',
                            color: 'var(--ink3)',
                            marginLeft: 'auto',
                          }}
                        >
                          {relativeTime(comment.created_at)}
                        </span>
                        {(comment.user_id === userId || isAdmin) && (
                          <button
                            onClick={() => setPendingDelete(comment.id)}
                            style={{
                              color: 'var(--ink3)',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.45, margin: 0 }}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment input — sticky bottom */}
        <div
          style={{
            padding: '12px 16px max(env(safe-area-inset-bottom),16px)',
            borderTop: '1px solid var(--border)',
            background: 'var(--white)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder="Adaugă un comentariu..."
              maxLength={500}
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--cream2)',
                padding: '10px 14px',
                fontSize: '14px',
                color: 'var(--ink)',
                outline: 'none',
                minWidth: 0,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={submitComment}
              disabled={!newComment.trim() || submitting}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                opacity: newComment.trim() && !submitting ? 1 : 0.35,
                transition: 'opacity 0.15s',
              }}
            >
              <Send size={16} color="white" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
    </>
  )
}
