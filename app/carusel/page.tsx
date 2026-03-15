'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { Loader2, Search } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { NotificationBell } from '@/components/NotificationBell'
import Link from 'next/link'
import { getInitials } from '@/lib/utils'
import { SchoolGate } from '@/components/SchoolGate'
import { FilmStrip } from './components/FilmStrip'
import { FeedView } from './components/FeedView'
import { CronologieView } from './components/CronologieView'
import { UploadModal } from './components/UploadModal'
import { PostModal } from './components/PostModal'
import { SCOPE_LABELS, SCOPE_DB_MAP } from './types'
import type { Scope, CaruselPost, CaruselComment } from './types'

type View = 'feed' | 'cronologie'

function FeedIcon() {
  return (
    <motion.svg
      width="14" height="14" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      variants={{
        idle: { x: 0 },
        hover: { x: -3, transition: { type: 'spring', stiffness: 300, damping: 20 } },
      }}
    >
      {/* Strip */}
      <rect x="1" y="5" width="18" height="10" rx="1.5" />
      {/* Frames (portrait ratio) */}
      <rect x="4" y="6.5" width="4.5" height="7" rx="1" />
      <rect x="11.5" y="6.5" width="4.5" height="7" rx="1" />
      {/* Left perforations — top pair then bottom pair */}
      <line x1="1.5" y1="7.5" x2="3.5" y2="7.5" />
      <line x1="1.5" y1="9"   x2="3.5" y2="9"   />
      <line x1="1.5" y1="11"  x2="3.5" y2="11"  />
      <line x1="1.5" y1="12.5" x2="3.5" y2="12.5" />
      {/* Right perforations */}
      <line x1="16.5" y1="7.5"  x2="18.5" y2="7.5"  />
      <line x1="16.5" y1="9"    x2="18.5" y2="9"    />
      <line x1="16.5" y1="11"   x2="18.5" y2="11"   />
      <line x1="16.5" y1="12.5" x2="18.5" y2="12.5" />
    </motion.svg>
  )
}

function CronologieIcon() {
  // Clock centre (7, 10) in viewBox 0 0 20 20 → (4.9px, 7px) in 14×14 CSS px
  return (
    <motion.svg
      width="14" height="14" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
    >
      {/* Clock face */}
      <circle cx="7" cy="10" r="5" />
      {/* Hands — rotate around clock centre on hover */}
      <motion.g
        variants={{
          idle: { rotate: 0 },
          hover: { rotate: 360, transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } },
        }}
        style={{ transformOrigin: '4.9px 7px' }}
      >
        <line x1="7" y1="10" x2="7"  y2="5.5"  /> {/* 12 o'clock */}
        <line x1="7" y1="10" x2="10" y2="11.8" /> {/* ~4 o'clock  */}
      </motion.g>
      {/* Timeline arc opening right */}
      <path d="M 15 5 Q 21 10 15 15" fill="none" />
      {/* Event dots at arc endpoints */}
      <circle cx="15" cy="5"  r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </motion.svg>
  )
}

export default function CaruselPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [posts, setPosts] = useState<CaruselPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [scope, setScope] = useState<Scope>('promotie')
  const [view, setView] = useState<View>('feed')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [userHighschool, setUserHighschool] = useState('')

  const fetchPosts = useCallback(async (s: Scope) => {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('highschool, graduation_year, class')
      .eq('id', user.id)
      .single()
    if (!profile) return

    const dbScope = SCOPE_DB_MAP[s]

    let query = supabase
      .from('carusel_posts')
      .select('id, caption, storage_path, user_id, created_at, photo_date, location_text, scope, highschool, graduation_year, class, profiles!user_id(name, username)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (dbScope === 'school') {
      query = query.eq('highschool', profile.highschool).in('scope', ['school', 'promotion', 'class'])
    } else if (dbScope === 'promotion') {
      query = query.eq('highschool', profile.highschool).eq('graduation_year', profile.graduation_year).in('scope', ['promotion', 'class'])
    } else {
      query = query.eq('highschool', profile.highschool).eq('graduation_year', profile.graduation_year).eq('class', profile.class).eq('scope', 'class')
    }

    const { data: rawPosts } = await query
    if (!rawPosts) { setPosts([]); return }

    const postIds = rawPosts.map(p => p.id)

    const [{ data: allLikes }, { data: userLikes }, { data: allComments }] = await Promise.all([
      supabase.from('carusel_likes').select('post_id').in('post_id', postIds),
      supabase.from('carusel_likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
      supabase.from('carusel_comments').select('id, post_id, content, created_at, user_id, profiles!user_id(name, username)').in('post_id', postIds).is('deleted_at', null).order('created_at', { ascending: true }),
    ])

    const likeCounts: Record<string, number> = {}
    allLikes?.forEach(l => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1 })
    const userLikedSet = new Set(userLikes?.map(l => l.post_id))
    const commentsByPost: Record<string, CaruselComment[]> = {}
    allComments?.forEach(c => {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = []
      commentsByPost[c.post_id].push(c as unknown as CaruselComment)
    })

    const mapped: CaruselPost[] = rawPosts.map(p => {
      const { data: { publicUrl } } = supabase.storage.from('carusel').getPublicUrl(p.storage_path)
      return {
        id: p.id,
        caption: p.caption,
        image_url: publicUrl,
        user_id: p.user_id,
        profiles: p.profiles as unknown as { name: string; username: string },
        likes: likeCounts[p.id] || 0,
        liked: userLikedSet.has(p.id),
        comments: commentsByPost[p.id] || [],
        created_at: p.created_at,
        photo_date: p.photo_date ?? null,
        location_text: p.location_text ?? null,
      }
    })

    setPosts(mapped)
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url, highschool, role')
        .eq('id', user.id)
        .single()
      if (profile) {
        setUserName(profile.name || '')
        setUserAvatar(profile.avatar_url)
        setUserHighschool(profile.highschool || '')
        setIsAdmin(profile.role === 'admin')
      }

      await fetchPosts('promotie')
      setLoading(false)

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('open') === 'upload') {
          setShowUpload(true)
          window.history.replaceState({}, '', '/carusel')
        }
      }
    }
    init()
  }, [router, fetchPosts])

  useEffect(() => {
    function handler(e: Event) {
      if ((e as CustomEvent).detail?.action === 'upload') setShowUpload(true)
    }
    window.addEventListener('unirea:fab-action', handler)
    return () => window.removeEventListener('unirea:fab-action', handler)
  }, [])

  async function handleScopeChange(newScope: Scope) {
    setScope(newScope)
    setLoading(true)
    await fetchPosts(newScope)
    setLoading(false)
  }

  async function toggleLike(postId: string) {
    const post = posts.find(p => p.id === postId)
    if (!post || !userId) return

    const newLiked = !post.liked
    const newLikes = newLiked ? post.likes + 1 : post.likes - 1
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: newLiked, likes: newLikes } : p))

    try {
      const supabase = getSupabase()
      const { data: existing } = await supabase
        .from('carusel_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        await supabase.from('carusel_likes').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('carusel_likes').insert({ post_id: postId, user_id: userId })
      }
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: post.liked, likes: post.likes } : p))
    }
  }

  async function deletePost(postId: string) {
    const supabase = getSupabase()
    const { data: postData } = await supabase
      .from('carusel_posts')
      .select('storage_path')
      .eq('id', postId)
      .single()

    const { error } = await supabase
      .from('carusel_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId)

    if (!error) {
      if (postData?.storage_path) {
        await supabase.storage.from('carusel').remove([postData.storage_path])
      }
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
  }

  function handleCommentAdded(postId: string, comment: CaruselComment) {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
    ))
  }

  function handleCommentDeleted(postId: string, commentId: string) {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
    ))
  }

  const top8 = useMemo(
    () => [...posts].sort((a, b) => b.likes - a.likes).slice(0, 8),
    [posts]
  )
  const top8Ranks = useMemo(() => new Map(top8.map((p, i) => [p.id, i + 1])), [top8])
  const top8Ids = useMemo(() => new Set(top8.map(p => p.id)), [top8])

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) =>
      new Date(b.photo_date ?? b.created_at).getTime() -
      new Date(a.photo_date ?? a.created_at).getTime()
    ),
    [posts]
  )

  const postsByYear = useMemo(() => {
    const map = new Map<number, CaruselPost[]>()
    for (const p of posts) {
      const y = new Date(p.photo_date ?? p.created_at).getFullYear()
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(p)
    }
    return new Map([...map.entries()].sort((a, b) => b[0] - a[0]))
  }, [posts])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--ink3)' }} />
      </div>
    )
  }

  return (
    <SchoolGate>
      <div className="min-h-screen pb-24" style={{ background: 'var(--cream2)' }}>

        {/* Sticky header */}
        <header
          className="sticky top-0 z-50 border-b"
          style={{ background: 'var(--cream)', borderColor: 'var(--border)', paddingTop: '8px', paddingBottom: '10px' }}
        >
          <div className="max-w-sm mx-auto px-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Logo size={32} />
                <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>Amintiri</span>
              </div>
              {userHighschool && (
                <p className="text-xxs mt-1 ml-10" style={{ color: 'var(--ink3)' }}>{userHighschool}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/cauta"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xxs font-semibold"
                style={{ background: 'var(--white)', border: '1.5px solid var(--border)', color: 'var(--ink3)', boxShadow: 'var(--shadow-s)' }}
              >
                <Search size={14} strokeWidth={1.75} />
                Caută
              </Link>
              <NotificationBell />
              <Link href="/setari" className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden" style={{ border: '2px solid var(--border)' }}>
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xxs font-bold" style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}>
                    {getInitials(userName)}
                  </div>
                )}
              </Link>
            </div>
          </div>

          {/* Scope tabs */}
          <div className="max-w-sm mx-auto mt-3 px-4">
            <div className="flex rounded-md p-[3px]" style={{ background: 'var(--cream2)' }}>
              {(['liceu', 'promotie', 'clasa'] as Scope[]).map(s => (
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

        {/* Constrained content column */}
        <div className="max-w-sm mx-auto w-full">

        {/* Film strip */}
        <FilmStrip top8={top8} onFrameClick={p => setSelectedPostId(p.id)} />

        {/* View toggle bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px 6px',
          }}
        >
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              color: 'var(--ink3)',
              letterSpacing: '0.06em',
            }}
          >
            {top8.length} postări · {SCOPE_LABELS[scope]}
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--border)',
              borderRadius: '10px',
              padding: '3px',
              gap: '2px',
            }}
          >
            {(['feed', 'cronologie'] as View[]).map(v => (
              <motion.button
                key={v}
                onClick={() => setView(v)}
                initial="idle"
                whileHover="hover"
                style={{ position: 'relative', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {view === v && (
                  <motion.div
                    layoutId="view-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--white)',
                      borderRadius: '7px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-s)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: view === v ? 'var(--ink)' : 'var(--ink3)',
                    transition: 'color 0.15s',
                  }}
                >
                  {v === 'feed' ? <FeedIcon /> : <CronologieIcon />}
                  {v === 'feed' ? 'Feed' : 'Cronologie'}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Animated view swap */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          >
            {view === 'feed' ? (
              <FeedView
                posts={posts}
                userId={userId}
                isAdmin={isAdmin}
                top8Ids={top8Ids}
                top8Ranks={top8Ranks}
                onLike={toggleLike}
                onDelete={deletePost}
                onImageClick={p => setSelectedPostId(p.id)}
              />
            ) : (
              <CronologieView
                posts={sortedPosts}
                userId={userId}
                isAdmin={isAdmin}
                top8Ids={top8Ids}
                top8Ranks={top8Ranks}
                onLike={toggleLike}
                onDelete={deletePost}
                onImageClick={p => setSelectedPostId(p.id)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        </div>{/* end max-w-sm */}

        {/* Post detail modal */}
        {(() => {
          const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null
          return selectedPost ? (
            <PostModal
              post={selectedPost}
              rank={top8Ranks.get(selectedPost.id)}
              userId={userId}
              isAdmin={isAdmin}
              onClose={() => setSelectedPostId(null)}
              onLike={() => toggleLike(selectedPost.id)}
              onDelete={() => deletePost(selectedPost.id)}
              onCommentAdded={c => handleCommentAdded(selectedPost.id, c)}
              onCommentDeleted={cId => handleCommentDeleted(selectedPost.id, cId)}
            />
          ) : null
        })()}

        {/* Upload modal */}
        {showUpload && (
          <UploadModal
            currentScope={scope}
            onClose={() => setShowUpload(false)}
            onUploaded={newPost => {
              setPosts(prev => [newPost, ...prev])
              setShowUpload(false)
            }}
          />
        )}

        <BottomNav />
      </div>
    </SchoolGate>
  )
}
