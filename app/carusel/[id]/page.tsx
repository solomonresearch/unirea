'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Heart, MessageCircle, Send, Share2, ChevronLeft, Loader2, Trash2 } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

interface CaruselComment {
  id: string
  post_id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string; username: string }
}

interface CaruselPost {
  id: string
  caption: string | null
  image_url: string
  user_id: string
  profiles: { name: string; username: string }
  likes: number
  liked: boolean
  comments: CaruselComment[]
  created_at: string
}

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'acum'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `acum ${m} ${m === 1 ? 'minut' : 'minute'}`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `acum ${h} ${h === 1 ? 'ora' : 'ore'}`
  }
  if (diff < 172800) return 'ieri'
  if (diff < 2592000) {
    const d = Math.floor(diff / 86400)
    return `acum ${d} zile`
  }
  const mo = Math.floor(diff / 2592000)
  return `acum ${mo} ${mo === 1 ? 'luna' : 'luni'}`
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function CaruselPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [userId, setUserId] = useState<string | null>(null)
  const [post, setPost] = useState<CaruselPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/carusel/${postId}`)
    if (res.status === 404) {
      setNotFound(true)
      return
    }
    if (res.ok) {
      const data = await res.json()
      setPost(data)
    }
  }, [postId])

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setUserId(user.id)
      await fetchPost()
      setLoading(false)
    }
    init()
  }, [router, fetchPost])

  async function toggleLike() {
    if (!post) return
    const newLiked = !post.liked
    const newLikes = newLiked ? post.likes + 1 : post.likes - 1
    setPost(prev => prev ? { ...prev, liked: newLiked, likes: newLikes } : prev)

    const res = await fetch(`/api/carusel/${post.id}/like`, { method: 'POST' })
    if (!res.ok) {
      setPost(prev => prev ? { ...prev, liked: post.liked, likes: post.likes } : prev)
    }
  }

  async function addComment() {
    if (!post || !commentText.trim() || commentSubmitting) return
    setCommentSubmitting(true)

    const res = await fetch(`/api/carusel/${post.id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentText.trim() }),
    })

    if (res.ok) {
      const newComment = await res.json()
      setPost(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev)
      setCommentText('')
    }
    setCommentSubmitting(false)
  }

  async function deleteComment(commentId: string) {
    if (!post) return
    const res = await fetch(`/api/carusel/${post.id}/comment/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setPost(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== commentId) } : prev)
    }
  }

  async function deletePost() {
    if (!post) return
    const res = await fetch(`/api/carusel/${post.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/carusel')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
        <div className="w-full max-w-sm text-center py-12">
          <p className="text-gray-500 text-sm">Postarea nu a fost gasita.</p>
          <button
            onClick={() => router.push('/carusel')}
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Inapoi la Carusel
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={18} />
          Inapoi
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
            {getInitials(post.profiles.name)}
          </div>
          <span className="text-xs font-medium text-gray-900">{post.profiles.name}</span>
          {post.user_id === userId && (
            <button
              onClick={deletePost}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-sm px-4 py-4">
          <div className="w-full overflow-hidden rounded-lg">
            <img
              src={post.image_url}
              alt={post.caption || 'Amintire'}
              className="w-full object-cover sepia-[.2]"
            />
          </div>

          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={toggleLike}
              className="flex items-center gap-1.5 transition-colors"
            >
              <Heart
                size={20}
                className={post.liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
              />
              <span className={`text-sm ${post.liked ? 'text-red-500' : 'text-gray-500'}`}>
                {post.likes}
              </span>
            </button>
            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageCircle size={20} />
              <span className="text-sm">{post.comments.length}</span>
            </div>
            <button
              onClick={() => navigator.share?.({ title: post.caption || 'Amintire', url: window.location.href }).catch(() => {})}
              className="flex items-center gap-1.5 text-gray-400 ml-auto hover:text-gray-600 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>

          {post.caption && (
            <p className="mt-3 text-sm text-gray-900">{post.caption}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">{relativeTime(post.created_at)}</p>

          {/* Comments */}
          <div className="mt-4 space-y-3 pb-4">
            {post.comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-500">
                  {getInitials(c.profiles.name)}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-900">{c.profiles.name}</span>
                  <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                </div>
                {c.user_id === userId && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky comment input */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-sm flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addComment() }}
            placeholder="Scrie un comentariu..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
          <button
            onClick={addComment}
            disabled={!commentText.trim() || commentSubmitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {commentSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
