'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Send, Trash2, ChevronUp, ChevronDown, MessageCircle, Clock } from 'lucide-react'

type Scope = 'clasa' | 'promotie' | 'liceu'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string; username: string }
}

interface Post {
  id: string
  content: string
  created_at: string
  expires_at?: string | null
  user_id: string
  profiles: { name: string; username: string }
  upvotes: number
  downvotes: number
  user_vote: number | null
  comments: Comment[]
}

interface UserProfile {
  id: string
  highschool: string
  graduation_year: number | null
  class: string | null
}

const EXPIRY_OPTIONS = [
  { value: 3, label: '3 zile' },
  { value: 7, label: '7 zile' },
  { value: 14, label: '14 zile' },
]

const DB_SCOPE: Record<Scope, string> = {
  clasa: 'class',
  promotie: 'promotion',
  liceu: 'school',
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.floor((now - date) / 1000)

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

function expiryLabel(expiresAt: string): string {
  const now = Date.now()
  const expires = new Date(expiresAt).getTime()
  const diffMs = expires - now
  if (diffMs <= 0) return 'Expirat'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Expira in <1 ora'
  if (diffHours < 24) return `Expira in ${diffHours} ${diffHours === 1 ? 'ora' : 'ore'}`
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return `Expira in ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`
}

function scopeLabel(p: UserProfile, scope: Scope): string {
  if (scope === 'clasa') return `${p.highschool} • ${p.graduation_year} • ${p.class}`
  if (scope === 'promotie') return `${p.highschool} • ${p.graduation_year}`
  return p.highschool
}

function initialScope(): Scope {
  if (typeof window !== 'undefined') {
    const s = new URLSearchParams(window.location.search).get('scope')
    if (s === 'clasa' || s === 'promotie' || s === 'liceu') return s
  }
  return 'liceu'
}

export default function AvizierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [scope, setScope] = useState<Scope>(initialScope)
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [expiryDays, setExpiryDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, highschool, graduation_year, class')
        .eq('id', user.id)
        .single()

      if (!profileData?.highschool) {
        router.push('/profil')
        return
      }

      setProfile(profileData as UserProfile)
      setLoading(false)
    }
    load()
  }, [router])

  const loadPosts = useCallback(async (p: UserProfile, s: Scope) => {
    setPostsLoading(true)
    const supabase = getSupabase()

    let query = supabase
      .from('avizier_posts')
      .select('id, content, created_at, expires_at, user_id, profiles!user_id(name, username)')
      .eq('scope', DB_SCOPE[s])
      .eq('highschool', p.highschool)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (s === 'promotie' || s === 'clasa') {
      if (!p.graduation_year) { setPosts([]); setPostsLoading(false); return }
      query = query.eq('graduation_year', p.graduation_year)
    }

    if (s === 'clasa') {
      if (!p.class) { setPosts([]); setPostsLoading(false); return }
      query = query.eq('class', p.class)
    }

    if (s === 'liceu') {
      query = query.gt('expires_at', new Date().toISOString())
    }

    const { data: rawPosts } = await query

    if (!rawPosts || rawPosts.length === 0) {
      setPosts([])
      setPostsLoading(false)
      return
    }

    const ids = rawPosts.map(p => p.id)

    const [votesRes, commentsRes] = await Promise.all([
      supabase.from('avizier_post_votes').select('post_id, vote, user_id').in('post_id', ids),
      supabase.from('avizier_post_comments').select('id, post_id, content, created_at, user_id, profiles!user_id(name, username)').in('post_id', ids).is('deleted_at', null).order('created_at', { ascending: true }),
    ])

    const votes = votesRes.data || []
    const comments = commentsRes.data || []

    const enriched: Post[] = rawPosts.map(post => {
      const pVotes = votes.filter(v => v.post_id === post.id)
      const pComments = comments.filter(c => c.post_id === post.id)
      const userVote = pVotes.find(v => v.user_id === p.id)

      return {
        ...(post as any),
        upvotes: pVotes.filter(v => v.vote === 1).length,
        downvotes: pVotes.filter(v => v.vote === -1).length,
        user_vote: userVote ? userVote.vote : null,
        comments: pComments as unknown as Comment[],
      }
    })

    enriched.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setPosts(enriched)
    setPostsLoading(false)
  }, [])

  useEffect(() => {
    if (!profile) return
    loadPosts(profile, scope)
  }, [profile, scope, loadPosts])

  function handleScopeChange(newScope: Scope) {
    setScope(newScope)
    setSubmitError(null)
    router.replace(`/avizier?scope=${newScope}`, { scroll: false } as any)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || !profile) return

    if (scope === 'clasa' && (!profile.graduation_year || !profile.class)) return
    if (scope === 'promotie' && !profile.graduation_year) return

    setSubmitting(true)
    setSubmitError(null)

    const body: Record<string, unknown> = { content: newContent.trim(), scope }
    if (scope === 'liceu') body.expiry_days = expiryDays

    const res = await fetch('/api/avizier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setSubmitError(data.error ?? `Eroare ${res.status}`)
    } else {
      setNewContent('')
      await loadPosts(profile, scope)
    }
    setSubmitting(false)
  }

  async function handleDelete(postId: string) {
    if (!profile) return
    await getSupabase().from('avizier_posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId)
    await loadPosts(profile, scope)
  }

  async function handleVote(postId: string, vote: 1 | -1) {
    if (!profile) return
    const supabase = getSupabase()
    const post = posts.find(p => p.id === postId)
    if (!post) return

    if (post.user_vote === vote) {
      await supabase.from('avizier_post_votes').delete().eq('post_id', postId).eq('user_id', profile.id)
    } else if (post.user_vote !== null) {
      await supabase.from('avizier_post_votes').update({ vote }).eq('post_id', postId).eq('user_id', profile.id)
    } else {
      await supabase.from('avizier_post_votes').insert({ post_id: postId, user_id: profile.id, vote })
    }

    await loadPosts(profile, scope)
  }

  async function handleComment(postId: string) {
    if (!profile) return
    const text = commentTexts[postId]?.trim()
    if (!text) return

    await getSupabase().from('avizier_post_comments').insert({
      post_id: postId,
      user_id: profile.id,
      content: text,
    })

    setCommentTexts(prev => ({ ...prev, [postId]: '' }))
    await loadPosts(profile, scope)
  }

  async function handleDeleteComment(commentId: string) {
    if (!profile) return
    await getSupabase().from('avizier_post_comments').update({ deleted_at: new Date().toISOString() }).eq('id', commentId)
    await loadPosts(profile, scope)
  }

  function toggleComments(postId: string) {
    setExpandedComments(prev => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </main>
    )
  }

  if (!profile) return null

  const missingClassData = scope === 'clasa' && (!profile.graduation_year || !profile.class)
  const missingPromotieData = scope === 'promotie' && !profile.graduation_year

  const placeholder =
    scope === 'clasa' ? 'Scrie ceva pe tabla...' :
    scope === 'promotie' ? 'Scrie ceva promotiei...' :
    'Scrie un anunt...'

  const emptyText =
    scope === 'clasa' ? 'Niciun mesaj inca. Fii primul care scrie pe tabla!' :
    scope === 'promotie' ? 'Nicio postare inca pentru promotia ta.' :
    'Niciun anunt inca. Fii primul care posteaza pe avizier!'

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Scope switcher + label row */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] leading-tight text-gray-500 truncate flex-1 mr-2">
            {scopeLabel(profile, scope)}
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            {(['clasa', 'promotie', 'liceu'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleScopeChange(s)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  scope === s ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {s === 'clasa' ? 'Clasă' : s === 'promotie' ? 'Promoție' : 'Liceu'}
              </button>
            ))}
          </div>
        </div>

        {/* Missing profile data warning (clasa/promotie only) */}
        {(missingClassData || missingPromotieData) && (
          <p className="text-sm text-amber-600 text-center py-4">
            Completeaza profilul pentru a accesa aceasta sectiune.
          </p>
        )}

        {/* Create form */}
        {!missingClassData && !missingPromotieData && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none resize-none"
            />
            <div className="flex items-center gap-2">
              {scope === 'liceu' && (
                <select
                  value={expiryDays}
                  onChange={e => setExpiryDays(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-gray-500 outline-none"
                >
                  {EXPIRY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                disabled={submitting || !newContent.trim()}
                className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            {submitError && (
              <p className="text-xs text-red-500">{submitError}</p>
            )}
          </form>
        )}

        {/* Posts */}
        {!missingClassData && !missingPromotieData && (
          <div className="space-y-3">
            {postsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-300" />
              </div>
            )}
            {!postsLoading && posts.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                {emptyText}
              </p>
            )}
            {!postsLoading && posts.map(post => (
              <div key={post.id} className="rounded-lg border border-gray-200 bg-white">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900">@{post.profiles?.username}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{relativeTime(post.created_at)}</span>
                      {post.user_id === profile.id && (
                        <button type="button" onClick={() => handleDelete(post.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>

                  {/* Expiry badge (liceu scope only) */}
                  {post.expires_at && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-[11px] text-gray-400">{expiryLabel(post.expires_at)}</span>
                    </div>
                  )}

                  {/* Vote + comment toggle bar */}
                  <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, 1)}
                        className={`p-0.5 rounded transition-colors ${post.user_vote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                      >
                        <ChevronUp size={18} strokeWidth={post.user_vote === 1 ? 3 : 2} />
                      </button>
                      <span className={`text-xs font-medium min-w-[20px] text-center ${
                        (post.upvotes - post.downvotes) > 0 ? 'text-green-500' :
                        (post.upvotes - post.downvotes) < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {post.upvotes - post.downvotes}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVote(post.id, -1)}
                        className={`p-0.5 rounded transition-colors ${post.user_vote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <ChevronDown size={18} strokeWidth={post.user_vote === -1 ? 3 : 2} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MessageCircle size={14} />
                      <span className="text-xs">{post.comments.length || ''}</span>
                    </button>
                  </div>
                </div>

                {/* Comments section */}
                {expandedComments.has(post.id) && (
                  <div className="border-t border-gray-100 px-4 py-2.5 space-y-2">
                    {post.comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">@{comment.profiles?.username}</span>
                            <span className="text-[10px] text-gray-300">{relativeTime(comment.created_at)}</span>
                            {comment.user_id === profile.id && (
                              <button type="button" onClick={() => handleDeleteComment(comment.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-1.5 mt-1">
                      <input
                        type="text"
                        value={commentTexts[post.id] || ''}
                        onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComment(post.id) } }}
                        placeholder="Comenteaza..."
                        className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-gray-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleComment(post.id)}
                        disabled={!commentTexts[post.id]?.trim()}
                        className="rounded-md bg-gray-200 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
