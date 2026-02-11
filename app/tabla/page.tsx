'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Send, Trash2, ChevronUp, ChevronDown, MessageCircle } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string }
}

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string }
  upvotes: number
  downvotes: number
  user_vote: number | null
  comments: Comment[]
}

interface UserProfile {
  id: string
  highschool: string
  graduation_year: number
  class: string | null
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

export default function TablaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

      if (!profileData || !profileData.class) {
        router.push('/profil')
        return
      }

      setProfile(profileData as UserProfile)
      await loadPosts(profileData as UserProfile)
      setLoading(false)
    }
    load()
  }, [router])

  async function loadPosts(p: UserProfile) {
    const supabase = getSupabase()

    const classmates = await supabase
      .from('profiles')
      .select('id')
      .eq('highschool', p.highschool)
      .eq('graduation_year', p.graduation_year)
      .eq('class', p.class)

    if (!classmates.data || classmates.data.length === 0) {
      setPosts([])
      return
    }

    const classmateIds = classmates.data.map(c => c.id)

    const { data: rawPosts } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id, profiles(name)')
      .in('user_id', classmateIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (!rawPosts) return

    const postIds = rawPosts.map(p => p.id)

    const [votesRes, commentsRes] = await Promise.all([
      supabase.from('post_votes').select('post_id, vote, user_id').in('post_id', postIds),
      supabase.from('comments').select('id, post_id, content, created_at, user_id, profiles(name)').in('post_id', postIds).is('deleted_at', null).order('created_at', { ascending: true }),
    ])

    const votes = votesRes.data || []
    const comments = commentsRes.data || []

    const enriched: Post[] = rawPosts.map(post => {
      const postVotes = votes.filter(v => v.post_id === post.id)
      const postComments = comments.filter(c => c.post_id === post.id)
      const userVote = postVotes.find(v => v.user_id === p.id)

      return {
        ...(post as any),
        upvotes: postVotes.filter(v => v.vote === 1).length,
        downvotes: postVotes.filter(v => v.vote === -1).length,
        user_vote: userVote ? userVote.vote : null,
        comments: postComments as unknown as Comment[],
      }
    })

    setPosts(enriched)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newPost.trim() || !profile) return
    setSubmitting(true)

    const supabase = getSupabase()
    const { error } = await supabase.from('posts').insert({
      user_id: profile.id,
      content: newPost.trim(),
    })

    if (!error) {
      setNewPost('')
      await loadPosts(profile)
    }
    setSubmitting(false)
  }

  async function handleDelete(postId: string) {
    if (!profile) return
    await getSupabase().from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId)
    await loadPosts(profile)
  }

  async function handleVote(postId: string, vote: 1 | -1) {
    if (!profile) return
    const supabase = getSupabase()
    const post = posts.find(p => p.id === postId)
    if (!post) return

    if (post.user_vote === vote) {
      await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', profile.id)
    } else if (post.user_vote !== null) {
      await supabase.from('post_votes').update({ vote }).eq('post_id', postId).eq('user_id', profile.id)
    } else {
      await supabase.from('post_votes').insert({ post_id: postId, user_id: profile.id, vote })
    }

    await loadPosts(profile)
  }

  async function handleComment(postId: string) {
    if (!profile) return
    const text = commentTexts[postId]?.trim()
    if (!text) return

    await getSupabase().from('comments').insert({
      post_id: postId,
      user_id: profile.id,
      content: text,
    })

    setCommentTexts(prev => ({ ...prev, [postId]: '' }))
    await loadPosts(profile)
  }

  async function handleDeleteComment(commentId: string) {
    if (!profile) return
    await getSupabase().from('comments').update({ deleted_at: new Date().toISOString() }).eq('id', commentId)
    await loadPosts(profile)
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
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </main>
    )
  }

  if (!profile) return null

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-950 px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">Tabla</span>
            <span className="text-[10px] text-gray-500">
              {profile.highschool} &bull; <span className="font-bold text-gray-300">{profile.graduation_year}</span> &bull; <span className="font-bold text-gray-300">Clasa {profile.class}</span>
            </span>
          </div>
        </div>

        {/* Post form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Scrie ceva pe tabla..."
            rows={2}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !newPost.trim()}
            className="self-end rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>

        {/* Posts */}
        <div className="space-y-3">
          {posts.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">
              Niciun mesaj inca. Fii primul care scrie pe tabla!
            </p>
          )}
          {posts.map(post => (
            <div key={post.id} className="rounded-lg border border-gray-700 bg-gray-900">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white">{post.profiles?.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{relativeTime(post.created_at)}</span>
                    {post.user_id === profile.id && (
                      <button type="button" onClick={() => handleDelete(post.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>

                {/* Vote + comment toggle bar */}
                <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleVote(post.id, 1)}
                      className={`p-0.5 rounded transition-colors ${post.user_vote === 1 ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}
                    >
                      <ChevronUp size={18} strokeWidth={post.user_vote === 1 ? 3 : 2} />
                    </button>
                    <span className={`text-xs font-medium min-w-[20px] text-center ${
                      (post.upvotes - post.downvotes) > 0 ? 'text-green-400' :
                      (post.upvotes - post.downvotes) < 0 ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {post.upvotes - post.downvotes}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVote(post.id, -1)}
                      className={`p-0.5 rounded transition-colors ${post.user_vote === -1 ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                    >
                      <ChevronDown size={18} strokeWidth={post.user_vote === -1 ? 3 : 2} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <MessageCircle size={14} />
                    <span className="text-xs">{post.comments.length || ''}</span>
                  </button>
                </div>
              </div>

              {/* Comments section */}
              {expandedComments.has(post.id) && (
                <div className="border-t border-gray-800 px-4 py-2.5 space-y-2">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">{comment.profiles?.name}</span>
                          <span className="text-[10px] text-gray-600">{relativeTime(comment.created_at)}</span>
                          {comment.user_id === profile.id && (
                            <button type="button" onClick={() => handleDeleteComment(comment.id)} className="text-gray-700 hover:text-red-400 transition-colors">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{comment.content}</p>
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
                      className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-gray-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleComment(post.id)}
                      disabled={!commentTexts[post.id]?.trim()}
                      className="rounded-md bg-gray-700 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
