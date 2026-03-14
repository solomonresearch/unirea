'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Send, Trash2, ChevronUp, ChevronDown, MessageCircle, Clock, Plus, Users, Lock, Eye, CheckCircle2, Pencil, Search } from 'lucide-react'
import { TutorialModal } from '@/components/TutorialModal'
import { QuizOverlay } from '@/components/sondaje/QuizOverlay'
import { QuizCreateDialog } from '@/components/sondaje/QuizCreateDialog'
import { QuizEditDialog } from '@/components/sondaje/QuizEditDialog'
import { BottomNav } from '@/components/BottomNav'
import { Logo } from '@/components/Logo'
import { NotificationBell } from '@/components/NotificationBell'
import { MentionInput } from '@/components/MentionInput'
import { MentionText } from '@/components/MentionText'
import { relativeTime, getInitials } from '@/lib/utils'
import { processMentions } from '@/lib/mentions'
import { useTrack } from '@/lib/analytics'
import { EvenimentStrip } from '@/components/evenimente/EvenimentStrip'
import { EvenimentCreateModal } from '@/components/evenimente/EvenimentCreateModal'
import { EvenimentDetailModal } from '@/components/evenimente/EvenimentDetailModal'
import type { Eveniment, EvenimentDetail } from '@/components/evenimente/types'
import { SchoolGate } from '@/components/SchoolGate'
import { InvitePrompt } from '@/components/InvitePrompt'

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
  name: string
  username: string
  highschool: string
  graduation_year: number | null
  class: string | null
  role: string
  avatar_url: string | null
  tutorial_completed: boolean
}

interface QuizOption {
  id: string
  option_text: string
  order_index: number
}

interface QuizQuestion {
  id: string
  question_text: string
  order_index: number
  quiz_options: QuizOption[]
}

interface Quiz {
  id: string
  title: string
  description: string | null
  target_scope: string
  active: boolean
  expires_at: string | null
  created_at: string
  created_by: string
  questions: QuizQuestion[]
  completed: boolean
  has_peeked: boolean
  response_count: number
  reveal_threshold: number
  results_unlocked_at: string | null
  anonymous_mode: boolean
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

const QUIZ_SCOPE: Record<Scope, string> = {
  clasa: 'class',
  promotie: 'year',
  liceu: 'school',
}

function expiryLabel(expiresAt: string): string {
  const now = Date.now()
  const expires = new Date(expiresAt).getTime()
  const diffMs = expires - now
  if (diffMs <= 0) return 'Expirat'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'Expiră în <1 oră'
  if (diffHours < 24) return `Expiră în ${diffHours}h`
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return `Expiră în ${diffDays}z`
}

function quizExpiryLabel(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Expirat'
  if (days === 1) return 'Expiră mâine'
  return `Expiră în ${days} zile`
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

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
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

  const [showTutorial, setShowTutorial] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [modalScope, setModalScope] = useState<Scope>('liceu')
  const [modalExpiryDays, setModalExpiryDays] = useState(7)

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [overlayMode, setOverlayMode] = useState<'take' | 'results' | 'peek'>('take')
  const [createQuizOpen, setCreateQuizOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)

  const [events, setEvents] = useState<Eveniment[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showEventCreate, setShowEventCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EvenimentDetail | null>(null)
  const [editingEvent, setEditingEvent] = useState<EvenimentDetail | null>(null)
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null)
  const highlightScrolled = useRef(false)
  const { track, trackEngagement } = useTrack()

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, username, highschool, graduation_year, class, role, avatar_url, tutorial_completed')
        .eq('id', user.id)
        .single()

      if (!profileData?.highschool) {
        router.push('/profil')
        return
      }

      setProfile(profileData as UserProfile)
      setLoading(false)
      if (!profileData.tutorial_completed) setShowTutorial(true)

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const open = params.get('open')
        const postParam = params.get('post')
        if (postParam) {
          highlightScrolled.current = false
          setHighlightPostId(postParam)
          window.history.replaceState({}, '', '/avizier')
          // Look up the post's scope so we switch to the right tab
          const { data: postRow } = await supabase
            .from('avizier_posts')
            .select('scope')
            .eq('id', postParam)
            .single()
          if (postRow?.scope) {
            const scopeMap: Record<string, Scope> = { class: 'clasa', promotion: 'promotie', school: 'liceu' }
            const target = scopeMap[postRow.scope] || 'liceu'
            setScope(target)
          }
        } else if (open === 'quiz' && profileData.role === 'admin') {
          setCreateQuizOpen(true)
          window.history.replaceState({}, '', '/avizier')
        } else if (open === 'post') {
          window.history.replaceState({}, '', '/avizier')
          setModalScope(scope)
          setShowPostModal(true)
        } else if (open === 'eveniment') {
          window.history.replaceState({}, '', '/avizier')
          setShowEventCreate(true)
        }
      }
    }
    load()
  }, [router])

  const handleTutorialDismiss = async () => {
    setShowTutorial(false)
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ tutorial_completed: true }).eq('id', user.id)
    }
    router.push('/onboarding')
  }

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

  const loadQuizzes = useCallback(async (s: Scope) => {
    if (!profile) return
    setQuizzesLoading(true)
    const supabase = getSupabase()
    const scopeFilter = QUIZ_SCOPE[s]

    const { data: allQuizzes } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*, quiz_options(*))')
      .eq('active', true)
      .order('created_at', { ascending: false })

    const now = new Date()
    const scopedQuizzes = (allQuizzes || []).filter((quiz: any) => {
      if (quiz.expires_at && new Date(quiz.expires_at) < now) return false
      if (scopeFilter && quiz.target_scope !== scopeFilter) return false
      if (quiz.target_scope === 'all') return true
      if (quiz.target_scope === 'school') return quiz.target_highschool === profile.highschool
      if (quiz.target_scope === 'year') return quiz.target_highschool === profile.highschool && quiz.target_year === profile.graduation_year
      if (quiz.target_scope === 'class') return quiz.target_highschool === profile.highschool && quiz.target_year === profile.graduation_year && quiz.target_class === profile.class
      return false
    })

    if (scopedQuizzes.length === 0) {
      setQuizzes([])
      setQuizzesLoading(false)
      return
    }

    const quizIds = scopedQuizzes.map((q: any) => q.id)
    const [{ data: userResponses }, { data: userPeeks }] = await Promise.all([
      supabase.from('quiz_responses').select('quiz_id').eq('user_id', profile.id).in('quiz_id', quizIds),
      supabase.from('quiz_peeks').select('quiz_id').eq('user_id', profile.id).in('quiz_id', quizIds),
    ])

    const completedIds = new Set((userResponses || []).map((r: any) => r.quiz_id))
    const peekedIds = new Set((userPeeks || []).map((r: any) => r.quiz_id))

    setQuizzes(scopedQuizzes.map((quiz: any) => {
      const questions = (quiz.quiz_questions || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({
          ...q,
          quiz_options: (q.quiz_options || []).sort((a: any, b: any) => a.order_index - b.order_index),
        }))
      return {
        id: quiz.id, title: quiz.title, description: quiz.description,
        target_scope: quiz.target_scope, active: quiz.active, expires_at: quiz.expires_at,
        created_by: quiz.created_by, created_at: quiz.created_at, questions,
        completed: completedIds.has(quiz.id), has_peeked: peekedIds.has(quiz.id),
        response_count: quiz.response_count ?? 0, reveal_threshold: quiz.reveal_threshold ?? 10,
        results_unlocked_at: quiz.results_unlocked_at ?? null, anonymous_mode: quiz.anonymous_mode ?? false,
      }
    }))
    setQuizzesLoading(false)
  }, [profile])

  const loadEvents = useCallback(async (p: UserProfile, s: Scope) => {
    setEventsLoading(true)
    const res = await fetch(`/api/evenimente?scope=${s}`)
    if (res.ok) setEvents((await res.json()).events)
    setEventsLoading(false)
  }, [])

  useEffect(() => {
    if (!profile) return
    loadPosts(profile, scope)
    loadQuizzes(scope)
    loadEvents(profile, scope)
  }, [profile, scope, loadPosts, loadQuizzes, loadEvents])

  useEffect(() => {
    if (!highlightPostId || postsLoading || highlightScrolled.current || posts.length === 0) return
    // Wait a frame for DOM to update after posts render
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${highlightPostId}`)
      if (el) {
        highlightScrolled.current = true
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => setHighlightPostId(null), 3000)
      }
    })
  }, [highlightPostId, postsLoading, posts])

  useEffect(() => {
    function handler(e: Event) {
      const action = (e as CustomEvent).detail?.action
      if (action === 'post') { setModalScope(scope); setShowPostModal(true) }
      if (action === 'quiz' && profile?.role === 'admin') setCreateQuizOpen(true)
      if (action === 'eveniment') setShowEventCreate(true)
    }
    window.addEventListener('unirea:fab-action', handler)
    return () => window.removeEventListener('unirea:fab-action', handler)
  }, [profile])

  function handleScopeChange(newScope: Scope) {
    setScope(newScope)
    setSubmitError(null)
    trackEngagement('scope_change', { scope: newScope })
    router.replace(`/avizier?scope=${newScope}`, { scroll: false } as any)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || !profile) return
    track('post_create', { scope })

    if (scope === 'clasa' && (!profile.graduation_year || !profile.class)) return
    if (scope === 'promotie' && !profile.graduation_year) return

    setSubmitting(true)
    setSubmitError(null)

    const supabase = getSupabase()
    const dbScope = DB_SCOPE[scope]

    let expiresAt: string | null = null
    if (dbScope === 'school') {
      const d = new Date()
      d.setDate(d.getDate() + expiryDays)
      expiresAt = d.toISOString()
    }

    const { data: created, error } = await supabase
      .from('avizier_posts')
      .insert({
        user_id: profile.id,
        scope: dbScope,
        highschool: profile.highschool,
        graduation_year: dbScope !== 'school' ? profile.graduation_year : null,
        class: dbScope === 'class' ? profile.class : null,
        content: newContent.trim(),
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (error) {
      setSubmitError(error.message)
    } else {
      await processMentions(supabase, profile.id, newContent.trim(), 'avizier', created.id)
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
    track(vote === 1 ? 'upvote' : 'downvote')
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
    track('comment')

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

  function openQuizTake(quiz: Quiz) { setActiveQuiz(quiz); setOverlayMode('take') }
  function openQuizResults(quiz: Quiz) { setActiveQuiz(quiz); setOverlayMode('results') }
  function openQuizPeek(quiz: Quiz) { setActiveQuiz(quiz); setOverlayMode('peek') }

  function onPeeked() {
    if (activeQuiz) {
      setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, has_peeked: true } : q))
    }
  }

  function onQuizCompleted({ unlocked, response_count }: { unlocked: boolean; response_count: number; reveal_threshold: number }) {
    if (activeQuiz) {
      setQuizzes(prev =>
        prev.map(q =>
          q.id === activeQuiz.id
            ? { ...q, completed: true, response_count, results_unlocked_at: unlocked ? new Date().toISOString() : null }
            : q
        )
      )
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  if (!profile) return null

  const missingClassData = scope === 'clasa' && (!profile.graduation_year || !profile.class)
  const missingPromotieData = scope === 'promotie' && !profile.graduation_year
  const isAdmin = profile.role === 'admin'
  const isAdminOrMod = profile.role === 'admin' || profile.role === 'moderator'

  const placeholder =
    scope === 'clasa' ? 'Scrie ceva pe tablă...' :
    scope === 'promotie' ? 'Scrie ceva promoției...' :
    'Scrie un anunț...'

  const emptyText =
    scope === 'clasa' ? 'Niciun mesaj încă. Fii primul care scrie pe tablă!' :
    scope === 'promotie' ? 'Nicio postare încă pentru promoția ta.' :
    'Niciun anunț încă. Fii primul care postează!'

  return (
    <SchoolGate>
    <>
      {showTutorial && profile && (
        <TutorialModal profile={profile} onDismiss={handleTutorialDismiss} />
      )}
      <main className="flex flex-col min-h-screen pb-24" style={{ background: 'var(--cream2)' }}>
        {/* Sticky topbar */}
        <header
          className="sticky top-0 z-50 border-b"
          style={{
            background: 'var(--cream)',
            borderColor: 'var(--border)',
            paddingTop: '8px',
            paddingBottom: '12px',
          }}
        >
          <div className="max-w-sm mx-auto px-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Logo size={32} />
                <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>Avizier</span>
              </div>
              <p className="text-xxs mt-1 ml-10" style={{ color: 'var(--ink3)' }}>
                {profile.highschool}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/cauta"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xxs font-semibold"
                style={{ background: 'var(--white)', border: '1.5px solid var(--border)', color: 'var(--ink3)', boxShadow: 'var(--shadow-s)' }}
              >
                <Search size={14} strokeWidth={1.75} />
                Cauta
              </Link>
              <NotificationBell />
              <Link href="/setari" className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden" style={{ border: '2px solid var(--border)' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xxs font-bold" style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}>
                    {getInitials(profile.name || '')}
                  </div>
                )}
              </Link>
            </div>
          </div>

          {/* Ring selector */}
          <div className="max-w-sm mx-auto px-4 mt-3">
            <div
              className="flex rounded-md p-[3px]"
              style={{ background: 'var(--cream2)' }}
            >
              {(['liceu', 'promotie', 'clasa'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleScopeChange(s)}
                  className="flex-1 py-[7px] rounded-sm text-xxs font-semibold transition-all"
                  style={scope === s ? {
                    background: 'var(--white)',
                    color: 'var(--ink)',
                    boxShadow: 'var(--shadow-s)',
                  } : {
                    color: 'var(--ink3)',
                  }}
                >
                  {s === 'clasa' ? 'Clasă' : s === 'promotie' ? 'Promoție' : 'Liceu'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Events strip */}
        <div className="pt-3 pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
          <EvenimentStrip
            events={events}
            loading={eventsLoading}
            onAddClick={() => setShowEventCreate(true)}
            onCardClick={async (event) => {
              const res = await fetch(`/api/evenimente/${event.id}`)
              if (res.ok) setSelectedEvent((await res.json()).event)
            }}
            currentUserId={profile.id}
          />
        </div>

        <div className="max-w-sm mx-auto w-full px-4 pt-4 space-y-1.5">
          {(missingClassData || missingPromotieData) && (
            <p className="text-xs text-center py-8" style={{ color: 'var(--ink3)' }}>
              Completează profilul pentru a accesa această secțiune.
            </p>
          )}

          {!missingClassData && !missingPromotieData && (
            <>

              {/* Quiz cards */}
              {quizzesLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--ink3)' }} />
                </div>
              )}
              {!quizzesLoading && quizzes.map(quiz => {
                const resultsUnlocked = quiz.results_unlocked_at != null
                const resultsLocked = quiz.completed && !resultsUnlocked
                const progressPct = Math.min(100, Math.round((quiz.response_count / quiz.reveal_threshold) * 100))

                return (
                  <div
                    key={quiz.id}
                    className="rounded-lg p-3 border"
                    style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="text-2xs font-bold uppercase tracking-wider"
                            style={{ color: 'var(--teal)' }}
                          >
                            Sondaj
                          </span>
                          {quiz.completed && resultsUnlocked && (
                            <CheckCircle2 size={12} style={{ color: 'var(--teal)' }} />
                          )}
                          {resultsLocked && (
                            <Lock size={12} style={{ color: 'var(--ink3)' }} />
                          )}
                        </div>
                        <h3 className="font-bold text-xs" style={{ color: 'var(--ink)' }}>{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-xxs mt-0.5 line-clamp-2" style={{ color: 'var(--ink3)' }}>{quiz.description}</p>
                        )}
                      </div>
                      {isAdminOrMod && (
                        <button
                          onClick={() => setEditingQuiz(quiz)}
                          className="p-1 transition-colors"
                          style={{ color: 'var(--ink3)' }}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xxs" style={{ color: 'var(--ink3)' }}>
                        <Users size={12} />
                        {quiz.response_count} {quiz.response_count === 1 ? 'răspuns' : 'răspunsuri'}
                      </span>
                      {quiz.expires_at && (
                        <span className="flex items-center gap-1 text-xxs" style={{ color: 'var(--ink3)' }}>
                          <Clock size={12} />
                          {quizExpiryLabel(quiz.expires_at)}
                        </span>
                      )}
                    </div>

                    {resultsLocked && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xxs" style={{ color: 'var(--ink3)' }}>
                            {quiz.response_count}/{quiz.reveal_threshold} colegi
                          </p>
                          <p className="text-xxs" style={{ color: 'var(--ink3)' }}>{progressPct}%</p>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cream2)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%`, background: 'var(--teal)' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      {!quiz.completed && (
                        <button
                          onClick={() => openQuizTake(quiz)}
                          className="w-full py-2 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                          style={{ background: 'var(--ink)', color: 'var(--white)' }}
                        >
                          Participă
                        </button>
                      )}
                      {quiz.completed && resultsUnlocked && (
                        <button
                          onClick={() => openQuizResults(quiz)}
                          className="w-full py-2 rounded-sm text-xs font-semibold transition-colors"
                          style={{ border: '1.5px solid var(--teal)', color: 'var(--teal)', background: 'transparent' }}
                        >
                          Vezi rezultate
                        </button>
                      )}
                      {resultsLocked && (
                        <button
                          onClick={() => !quiz.has_peeked && openQuizPeek(quiz)}
                          disabled={quiz.has_peeked}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-xxs font-medium transition-colors"
                          style={{ color: quiz.has_peeked ? 'var(--ink3)' : 'var(--ink2)', cursor: quiz.has_peeked ? 'default' : 'pointer' }}
                        >
                          <Eye size={13} />
                          {quiz.has_peeked ? 'Ai folosit privirea rapidă' : 'Privire rapidă'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Create post card */}
              <div
                className="rounded-lg border"
                style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
              >
                <form onSubmit={handleSubmit} className="p-3 space-y-2">
                  <MentionInput
                    value={newContent}
                    onChange={setNewContent}
                    placeholder={placeholder}
                    rows={2}
                    multiline
                    className="w-full rounded-sm px-3 py-2 text-xs outline-none resize-none"
                    style={{
                      background: 'var(--cream2)',
                      border: '1.5px solid var(--border)',
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div className="flex items-center gap-2">
                    {scope === 'liceu' && (
                      <select
                        value={expiryDays}
                        onChange={e => setExpiryDays(Number(e.target.value))}
                        className="rounded-sm px-2 py-1.5 text-xs outline-none"
                        style={{
                          background: 'var(--cream2)',
                          border: '1.5px solid var(--border)',
                          color: 'var(--ink2)',
                          fontFamily: 'inherit',
                        }}
                      >
                        {EXPIRY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                    <button
                      type="submit"
                      disabled={submitting || !newContent.trim()}
                      className="ml-auto rounded-sm px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                      style={{ background: 'var(--ink)' }}
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                  {submitError && (
                    <p className="text-xxs" style={{ color: 'var(--rose)' }}>{submitError}</p>
                  )}
                </form>
              </div>

              {/* Posts feed */}
              {postsLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
                </div>
              )}
              {!postsLoading && posts.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-2">
                  <MessageCircle size={32} style={{ color: 'var(--ink3)' }} />
                  <p className="text-center text-xs" style={{ color: 'var(--ink3)' }}>
                    {emptyText}
                  </p>
                </div>
              )}
              {!postsLoading && posts.map((post, i) => {
                const name = post.profiles?.name || post.profiles?.username || '?'
                const bg = avatarColor(name)
                const ini = getInitials(name)
                const score = post.upvotes - post.downvotes

                return (
                  <div
                    key={post.id}
                    id={`post-${post.id}`}
                    className={`feed-item rounded-lg border overflow-hidden transition-all duration-700 ${highlightPostId === post.id ? 'ring-2' : ''}`}
                    style={{
                      background: highlightPostId === post.id ? 'rgba(245, 158, 11, 0.08)' : 'var(--white)',
                      borderColor: highlightPostId === post.id ? '#F59E0B' : 'var(--border)',
                      boxShadow: highlightPostId === post.id ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : 'var(--shadow-s)',
                      animationDelay: `${Math.min(i, 10) * 50}ms`,
                      ...(highlightPostId === post.id ? { '--tw-ring-color': '#F59E0B' } as React.CSSProperties : {}),
                    }}
                  >
                    <div className="px-3 pt-2 pb-1.5">
                      {/* Post header */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <Link href={`/profil/${post.profiles?.username}`} className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-9 h-9 rounded-sm flex items-center justify-center text-white text-xxs font-bold flex-shrink-0"
                            style={{ background: bg }}
                          >
                            {ini}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-none" style={{ color: 'var(--ink)' }}>
                              {name}
                            </p>
                            <p className="text-2xs mt-0.5" style={{ color: 'var(--ink3)' }}>
                              @{post.profiles?.username}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-2xs" style={{ color: 'var(--ink3)' }}>
                            {relativeTime(post.created_at, true)}
                          </span>
                          {post.user_id === profile.id && (
                            <button
                              type="button"
                              onClick={() => handleDelete(post.id)}
                              className="transition-colors"
                              style={{ color: 'var(--ink3)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Post body */}
                      <p className="text-xs leading-[1.65] whitespace-pre-wrap" style={{ color: 'var(--ink2)' }}>
                        <MentionText text={post.content} />
                      </p>

                      {/* Expiry badge */}
                      {post.expires_at && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock size={11} style={{ color: 'var(--ink3)' }} />
                          <span className="text-2xs" style={{ color: 'var(--ink3)' }}>{expiryLabel(post.expires_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Reactions bar */}
                    <div
                      className="flex items-center gap-3 px-3 py-1.5 border-t"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleVote(post.id, 1)}
                          className="p-0.5 rounded transition-colors"
                          style={{ color: post.user_vote === 1 ? 'var(--teal)' : 'var(--ink3)' }}
                        >
                          <ChevronUp size={18} strokeWidth={post.user_vote === 1 ? 3 : 2} />
                        </button>
                        <span
                          className="text-xxs font-semibold min-w-[20px] text-center"
                          style={{
                            color: score > 0 ? 'var(--teal)' : score < 0 ? 'var(--rose)' : 'var(--ink3)',
                          }}
                        >
                          {score}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleVote(post.id, -1)}
                          className="p-0.5 rounded transition-colors"
                          style={{ color: post.user_vote === -1 ? 'var(--rose)' : 'var(--ink3)' }}
                        >
                          <ChevronDown size={18} strokeWidth={post.user_vote === -1 ? 3 : 2} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 transition-colors"
                        style={{ color: 'var(--ink3)' }}
                      >
                        <MessageCircle size={15} />
                        <span className="text-xxs">{post.comments.length || ''}</span>
                      </button>
                    </div>

                    {/* Comments section */}
                    {expandedComments.has(post.id) && (
                      <div
                        className="border-t px-3 py-2 space-y-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--cream2)' }}
                      >
                        {post.comments.map(comment => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link href={`/profil/${comment.profiles?.username}`} className="text-xxs font-semibold hover:underline" style={{ color: 'var(--ink2)' }}>
                                  @{comment.profiles?.username}
                                </Link>
                                <span className="text-2xs" style={{ color: 'var(--ink3)' }}>
                                  {relativeTime(comment.created_at, true)}
                                </span>
                                {comment.user_id === profile.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="transition-colors"
                                    style={{ color: 'var(--ink3)' }}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--ink2)' }}><MentionText text={comment.content} /></p>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-1.5 mt-1">
                          <MentionInput
                            value={commentTexts[post.id] || ''}
                            onChange={v => setCommentTexts(prev => ({ ...prev, [post.id]: v }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComment(post.id) } }}
                            placeholder="Comentează..."
                            className="flex-1 rounded-sm px-2.5 py-1.5 text-xs outline-none"
                            style={{
                              background: 'var(--white)',
                              border: '1.5px solid var(--border)',
                              color: 'var(--ink)',
                              fontFamily: 'inherit',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleComment(post.id)}
                            disabled={!commentTexts[post.id]?.trim()}
                            className="rounded-sm px-2 py-1.5 disabled:opacity-40 transition-opacity"
                            style={{ background: 'var(--ink)', color: 'var(--white)' }}
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </main>

      <BottomNav />

      {profile && (
        <InvitePrompt username={profile.username} highschool={profile.highschool} />
      )}

      {/* Post modal */}
      {showPostModal && profile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-xl p-4 space-y-3"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-m)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>Scrie un anunț</span>
              <button onClick={() => setShowPostModal(false)} style={{ color: 'var(--ink3)' }}>
                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault()
                if (!newContent.trim() || !profile) return
                if (modalScope === 'clasa' && (!profile.graduation_year || !profile.class)) return
                if (modalScope === 'promotie' && !profile.graduation_year) return
                setSubmitting(true)
                setSubmitError(null)
                const supabase = getSupabase()
                const mDbScope = DB_SCOPE[modalScope]
                let mExpiresAt: string | null = null
                if (mDbScope === 'school') {
                  const d = new Date()
                  d.setDate(d.getDate() + modalExpiryDays)
                  mExpiresAt = d.toISOString()
                }
                const { data: created, error } = await supabase
                  .from('avizier_posts')
                  .insert({
                    user_id: profile.id,
                    scope: mDbScope,
                    highschool: profile.highschool,
                    graduation_year: mDbScope !== 'school' ? profile.graduation_year : null,
                    class: mDbScope === 'class' ? profile.class : null,
                    content: newContent.trim(),
                    expires_at: mExpiresAt,
                  })
                  .select('id')
                  .single()
                if (error) {
                  setSubmitError(error.message)
                } else {
                  await processMentions(supabase, profile.id, newContent.trim(), 'avizier', created.id)
                  setNewContent('')
                  setShowPostModal(false)
                  await loadPosts(profile, scope)
                }
                setSubmitting(false)
              }}
              className="space-y-2"
            >
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder={
                  modalScope === 'clasa' ? 'Scrie ceva pe tablă...' :
                  modalScope === 'promotie' ? 'Scrie ceva promoției...' :
                  'Scrie un anunț...'
                }
                rows={3}
                className="w-full rounded-sm px-3 py-2 text-xs outline-none resize-none"
                style={{
                  background: 'var(--cream2)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <select
                  value={modalScope}
                  onChange={e => setModalScope(e.target.value as Scope)}
                  className="rounded-sm px-2 py-1.5 text-xs outline-none"
                  style={{
                    background: 'var(--cream2)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--ink2)',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="liceu">Liceu</option>
                  <option value="promotie">Promoție</option>
                  <option value="clasa">Clasă</option>
                </select>
                {modalScope === 'liceu' && (
                  <select
                    value={modalExpiryDays}
                    onChange={e => setModalExpiryDays(Number(e.target.value))}
                    className="rounded-sm px-2 py-1.5 text-xs outline-none"
                    style={{
                      background: 'var(--cream2)',
                      border: '1.5px solid var(--border)',
                      color: 'var(--ink2)',
                      fontFamily: 'inherit',
                    }}
                  >
                    {EXPIRY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                <button
                  type="submit"
                  disabled={submitting || !newContent.trim()}
                  className="ml-auto rounded-sm px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                  style={{ background: 'var(--ink)' }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              {submitError && (
                <p className="text-xxs" style={{ color: 'var(--rose)' }}>{submitError}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {activeQuiz && (
        <QuizOverlay
          quiz={activeQuiz}
          mode={overlayMode}
          onClose={() => setActiveQuiz(null)}
          onCompleted={onQuizCompleted}
          onPeeked={onPeeked}
        />
      )}

      {isAdmin && profile && (
        <QuizCreateDialog
          open={createQuizOpen}
          onOpenChange={setCreateQuizOpen}
          userProfile={{
            highschool: profile.highschool,
            graduation_year: profile.graduation_year ?? undefined,
            class: profile.class ?? undefined,
          }}
          onCreated={() => loadQuizzes(scope)}
        />
      )}

      {editingQuiz && (
        <QuizEditDialog
          quiz={editingQuiz}
          open={!!editingQuiz}
          onOpenChange={(v) => { if (!v) setEditingQuiz(null) }}
          onSaved={() => { setEditingQuiz(null); loadQuizzes(scope) }}
          onDeleted={() => { setQuizzes(prev => prev.filter(q => q.id !== editingQuiz.id)); setEditingQuiz(null) }}
        />
      )}

      <EvenimentCreateModal
        open={showEventCreate || !!editingEvent}
        onClose={() => { setShowEventCreate(false); setEditingEvent(null) }}
        initialEvent={editingEvent}
        onCreated={(ev) => setEvents(prev => [ev, ...prev])}
        onUpdated={(ev) => {
          setEvents(prev => prev.map(e => e.id === ev.id ? ev : e))
          setSelectedEvent(prev => prev?.id === ev.id ? { ...prev, ...ev } : prev)
          setEditingEvent(null)
        }}
      />

      {selectedEvent && profile && (
        <EvenimentDetailModal
          event={selectedEvent}
          currentUserId={profile.id}
          isAdmin={profile.role === 'admin'}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => { setEditingEvent(selectedEvent); setSelectedEvent(null) }}
          onDelete={() => {
            setEvents(prev => prev.filter(e => e.id !== selectedEvent.id))
            setSelectedEvent(null)
          }}
          onRsvpToggle={(attending) => {
            setEvents(prev => prev.map(e =>
              e.id === selectedEvent.id
                ? { ...e, attending, participant_count: attending ? e.participant_count + 1 : Math.max(0, e.participant_count - 1) }
                : e
            ))
          }}
        />
      )}
    </>
    </SchoolGate>
  )
}
