'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Send, Trash2, ChevronUp, ChevronDown, MessageCircle, Clock } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { name: string; username: string }
}

interface Announcement {
  id: string
  content: string
  created_at: string
  expires_at: string
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
}

const EXPIRY_OPTIONS = [
  { value: 3, label: '3 zile' },
  { value: 7, label: '7 zile' },
  { value: 14, label: '14 zile' },
]

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

export default function AvizierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newContent, setNewContent] = useState('')
  const [expiryDays, setExpiryDays] = useState(7)
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
        .select('id, highschool')
        .eq('id', user.id)
        .single()

      if (!profileData || !profileData.highschool) {
        router.push('/profil')
        return
      }

      setProfile(profileData as UserProfile)
      await loadAnnouncements(profileData as UserProfile)
      setLoading(false)
    }
    load()
  }, [router])

  async function loadAnnouncements(p: UserProfile) {
    const supabase = getSupabase()

    const { data: rawAnnouncements } = await supabase
      .from('announcements')
      .select('id, content, created_at, expires_at, user_id, profiles(name, username)')
      .eq('highschool', p.highschool)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (!rawAnnouncements || rawAnnouncements.length === 0) {
      setAnnouncements([])
      return
    }

    const ids = rawAnnouncements.map(a => a.id)

    const [votesRes, commentsRes] = await Promise.all([
      supabase.from('announcement_votes').select('announcement_id, vote, user_id').in('announcement_id', ids),
      supabase.from('announcement_comments').select('id, announcement_id, content, created_at, user_id, profiles(name, username)').in('announcement_id', ids).is('deleted_at', null).order('created_at', { ascending: true }),
    ])

    const votes = votesRes.data || []
    const comments = commentsRes.data || []

    const enriched: Announcement[] = rawAnnouncements.map(a => {
      const aVotes = votes.filter(v => v.announcement_id === a.id)
      const aComments = comments.filter(c => c.announcement_id === a.id)
      const userVote = aVotes.find(v => v.user_id === p.id)

      return {
        ...(a as any),
        upvotes: aVotes.filter(v => v.vote === 1).length,
        downvotes: aVotes.filter(v => v.vote === -1).length,
        user_vote: userVote ? userVote.vote : null,
        comments: aComments as unknown as Comment[],
      }
    })

    enriched.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setAnnouncements(enriched)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || !profile) return
    setSubmitting(true)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    const supabase = getSupabase()
    const { error } = await supabase.from('announcements').insert({
      user_id: profile.id,
      highschool: profile.highschool,
      content: newContent.trim(),
      expires_at: expiresAt.toISOString(),
    })

    if (!error) {
      setNewContent('')
      await loadAnnouncements(profile)
    }
    setSubmitting(false)
  }

  async function handleDelete(announcementId: string) {
    if (!profile) return
    await getSupabase().from('announcements').update({ deleted_at: new Date().toISOString() }).eq('id', announcementId)
    await loadAnnouncements(profile)
  }

  async function handleVote(announcementId: string, vote: 1 | -1) {
    if (!profile) return
    const supabase = getSupabase()
    const announcement = announcements.find(a => a.id === announcementId)
    if (!announcement) return

    if (announcement.user_vote === vote) {
      await supabase.from('announcement_votes').delete().eq('announcement_id', announcementId).eq('user_id', profile.id)
    } else if (announcement.user_vote !== null) {
      await supabase.from('announcement_votes').update({ vote }).eq('announcement_id', announcementId).eq('user_id', profile.id)
    } else {
      await supabase.from('announcement_votes').insert({ announcement_id: announcementId, user_id: profile.id, vote })
    }

    await loadAnnouncements(profile)
  }

  async function handleComment(announcementId: string) {
    if (!profile) return
    const text = commentTexts[announcementId]?.trim()
    if (!text) return

    await getSupabase().from('announcement_comments').insert({
      announcement_id: announcementId,
      user_id: profile.id,
      content: text,
    })

    setCommentTexts(prev => ({ ...prev, [announcementId]: '' }))
    await loadAnnouncements(profile)
  }

  async function handleDeleteComment(commentId: string) {
    if (!profile) return
    await getSupabase().from('announcement_comments').update({ deleted_at: new Date().toISOString() }).eq('id', commentId)
    await loadAnnouncements(profile)
  }

  function toggleComments(announcementId: string) {
    setExpandedComments(prev => {
      const next = new Set(prev)
      if (next.has(announcementId)) next.delete(announcementId)
      else next.add(announcementId)
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

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Scope label */}
        <p className="text-[10px] leading-tight text-gray-500 truncate">
          {profile.highschool}
        </p>

        {/* Create form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Scrie un anunt..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={expiryDays}
              onChange={e => setExpiryDays(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-gray-500 outline-none"
            >
              {EXPIRY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>

        {/* Announcements */}
        <div className="space-y-3">
          {announcements.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Niciun anunt inca. Fii primul care posteaza pe avizier!
            </p>
          )}
          {announcements.map(a => (
            <div key={a.id} className="rounded-lg border border-gray-200 bg-white">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">@{a.profiles?.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{relativeTime(a.created_at)}</span>
                    {a.user_id === profile.id && (
                      <button type="button" onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>

                {/* Expiry badge */}
                <div className="flex items-center gap-1 mt-2">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-[11px] text-gray-400">{expiryLabel(a.expires_at)}</span>
                </div>

                {/* Vote + comment toggle bar */}
                <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleVote(a.id, 1)}
                      className={`p-0.5 rounded transition-colors ${a.user_vote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                    >
                      <ChevronUp size={18} strokeWidth={a.user_vote === 1 ? 3 : 2} />
                    </button>
                    <span className={`text-xs font-medium min-w-[20px] text-center ${
                      (a.upvotes - a.downvotes) > 0 ? 'text-green-500' :
                      (a.upvotes - a.downvotes) < 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {a.upvotes - a.downvotes}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVote(a.id, -1)}
                      className={`p-0.5 rounded transition-colors ${a.user_vote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      <ChevronDown size={18} strokeWidth={a.user_vote === -1 ? 3 : 2} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleComments(a.id)}
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MessageCircle size={14} />
                    <span className="text-xs">{a.comments.length || ''}</span>
                  </button>
                </div>
              </div>

              {/* Comments section */}
              {expandedComments.has(a.id) && (
                <div className="border-t border-gray-100 px-4 py-2.5 space-y-2">
                  {a.comments.map(comment => (
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
                      value={commentTexts[a.id] || ''}
                      onChange={e => setCommentTexts(prev => ({ ...prev, [a.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComment(a.id) } }}
                      placeholder="Comenteaza..."
                      className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-gray-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleComment(a.id)}
                      disabled={!commentTexts[a.id]?.trim()}
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
      </div>
    </main>
  )
}
