'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Camera, Heart, MessageCircle, Share2, X, Image as ImageIcon, Loader2, Trash2, Search } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { NotificationBell } from '@/components/NotificationBell'
import { MentionInput } from '@/components/MentionInput'
import Link from 'next/link'
import { relativeTime, getInitials } from '@/lib/utils'
import { SchoolGate } from '@/components/SchoolGate'

type Scope = 'liceu' | 'promotie' | 'clasa'

const SCOPE_LABELS: Record<Scope, string> = {
  liceu: 'Liceu',
  promotie: 'Promotie',
  clasa: 'Clasa',
}

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

function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 7) - 3
}

export default function CaruselPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [posts, setPosts] = useState<CaruselPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [scope, setScope] = useState<Scope>('promotie')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [userHighschool, setUserHighschool] = useState('')

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadScope, setUploadScope] = useState<Scope>('promotie')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    const scopeMap: Record<Scope, string> = { clasa: 'class', promotie: 'promotion', liceu: 'school' }
    const dbScope = scopeMap[s]

    let query = supabase
      .from('carusel_posts')
      .select('id, caption, storage_path, user_id, created_at, scope, highschool, graduation_year, class, profiles!user_id(name, username)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (dbScope === 'school') {
      query = query.eq('highschool', profile.highschool)
        .in('scope', ['school', 'promotion', 'class'])
    } else if (dbScope === 'promotion') {
      query = query.eq('highschool', profile.highschool)
        .eq('graduation_year', profile.graduation_year)
        .in('scope', ['promotion', 'class'])
    } else {
      query = query.eq('highschool', profile.highschool)
        .eq('graduation_year', profile.graduation_year)
        .eq('class', profile.class)
        .eq('scope', 'class')
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

    const posts: CaruselPost[] = rawPosts.map(p => {
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
      }
    })

    setPosts(posts)
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setUploadPreview(URL.createObjectURL(file))
    setUploadError(null)
  }

  function clearUpload() {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setUploadFile(null)
    setUploadPreview(null)
    setUploadCaption('')
    setUploadScope('promotie')
    setUploadError(null)
    setShowUpload(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploading(true)
    setUploadError(null)

    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploadError('Nu esti autentificat'); setUploading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, username, highschool, graduation_year, class')
        .eq('id', user.id)
        .single()
      if (!profile) { setUploadError('Profil negasit'); setUploading(false); return }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(uploadFile.type)) { setUploadError('Format invalid. Doar JPEG, PNG sau WebP.'); setUploading(false); return }
      if (uploadFile.size > 4 * 1024 * 1024) { setUploadError('Fisierul depaseste 4MB.'); setUploading(false); return }

      const storagePath = `${user.id}/${Date.now()}-${uploadFile.name}`
      const { error: uploadErr } = await supabase.storage.from('carusel').upload(storagePath, uploadFile)
      if (uploadErr) { setUploadError(uploadErr.message || 'Eroare la incarcare'); setUploading(false); return }

      const scopeMap: Record<Scope, string> = { clasa: 'class', promotie: 'promotion', liceu: 'school' }
      const dbScope = scopeMap[uploadScope]

      const { data: inserted, error: insertErr } = await supabase
        .from('carusel_posts')
        .insert({
          user_id: user.id,
          caption: uploadCaption.trim() || null,
          storage_path: storagePath,
          original_filename: uploadFile.name,
          mime_type: uploadFile.type,
          file_size: uploadFile.size,
          scope: dbScope,
          highschool: profile.highschool,
          graduation_year: profile.graduation_year,
          class: profile.class,
        })
        .select('id, caption, storage_path, user_id, created_at')
        .single()

      if (insertErr || !inserted) {
        await supabase.storage.from('carusel').remove([storagePath])
        setUploadError(insertErr?.message || 'Eroare la salvare')
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('carusel').getPublicUrl(storagePath)

      const newPost: CaruselPost = {
        id: inserted.id,
        caption: inserted.caption,
        image_url: publicUrl,
        user_id: inserted.user_id,
        profiles: { name: profile.name, username: profile.username },
        likes: 0,
        liked: false,
        comments: [],
        created_at: inserted.created_at,
      }

      if (uploadScope === scope) {
        setPosts(prev => [newPost, ...prev])
      }
      clearUpload()
    } catch {
      setUploadError('Eroare la incarcare')
    }
    setUploading(false)
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
        const { error } = await supabase.from('carusel_likes').delete().eq('post_id', postId).eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('carusel_likes').insert({ post_id: postId, user_id: userId })
        if (error) throw error
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Sticky topbar */}
      <header
        className="sticky top-0 z-50 px-5 border-b"
        style={{
          background: 'var(--cream)',
          borderColor: 'var(--border)',
          paddingTop: '8px',
          paddingBottom: '12px',
        }}
      >
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>Amintiri</span>
            </div>
            {userHighschool && (
              <p className="text-xxs mt-1 ml-10" style={{ color: 'var(--ink3)' }}>
                {userHighschool}
              </p>
            )}
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

        {/* Scope selector */}
        <div className="max-w-sm mx-auto mt-3">
          <div
            className="flex rounded-md p-[3px]"
            style={{ background: 'var(--cream2)' }}
          >
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
                {SCOPE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-6 py-4 space-y-3">

        {/* Polaroid Carousel */}
        {posts.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ink3)' }}>
              Amintiri recente
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
              {posts.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => router.push(`/carusel/${photo.id}`)}
                  className="snap-center flex-shrink-0 w-44 rounded-sm p-2 pb-8 transition-transform polaroid-card"
                  style={{ background: 'var(--white)', boxShadow: 'var(--shadow-m)', border: '1px solid var(--border)', transform: `rotate(${getRotation(photo.id)}deg)` }}
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Amintire'}
                      className="h-full w-full object-cover sepia-[.3]"
                    />
                  </div>
                  <p className="mt-2 text-[10px] truncate text-left italic font-extrabold" style={{ color: 'var(--ink2)' }}>
                    {photo.caption || 'Fara descriere'}
                  </p>
                  <p className="text-[9px] mt-0.5 text-left" style={{ color: 'var(--ink3)' }}>{relativeTime(photo.created_at)}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Activity Feed */}
        {posts.length > 0 ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ink3)' }}>
              Activitate
            </h2>
            <div className="space-y-2">
              {posts.map((photo, i) => (
                <div
                  key={photo.id}
                  className="feed-item flex gap-3 rounded-lg p-2.5"
                  style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)', animationDelay: `${Math.min(i, 10) * 50}ms` }}
                >
                  <button
                    onClick={() => router.push(`/carusel/${photo.id}`)}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Amintire'}
                      className="h-full w-full object-cover sepia-[.2]"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/profil/${photo.profiles.username}`} className="flex items-center gap-2 min-w-0">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold flex-shrink-0" style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)' }}>
                          {getInitials(photo.profiles.name)}
                        </div>
                        <span className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{photo.profiles.name}</span>
                      </Link>
                      <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: 'var(--ink3)' }}>{relativeTime(photo.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--ink2)' }}>{photo.caption || 'Fara descriere'}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(photo.id)}
                        className="flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <Heart
                          size={13}
                          className={photo.liked ? 'fill-red-500 text-red-500' : ''}
                          style={!photo.liked ? { color: 'var(--ink3)' } : undefined}
                        />
                        <span style={{ color: photo.liked ? undefined : 'var(--ink3)' }} className={photo.liked ? 'text-red-500' : ''}>
                          {photo.likes}
                        </span>
                      </button>
                      <button
                        onClick={() => router.push(`/carusel/${photo.id}`)}
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: 'var(--ink3)' }}
                      >
                        <MessageCircle size={13} />
                        <span>{photo.comments.length}</span>
                      </button>
                      {(photo.user_id === userId || isAdmin) && (
                        <button
                          onClick={() => deletePost(photo.id)}
                          className="flex items-center gap-1 text-[11px] hover:text-red-500 transition-colors"
                          style={{ color: 'var(--ink3)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); navigator.share?.({ title: photo.caption || 'Amintire', url: `${window.location.origin}/carusel/${photo.id}` }).catch(() => {}) }}
                        className="flex items-center gap-1 text-[11px] ml-auto"
                        style={{ color: 'var(--ink3)' }}
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center py-8 gap-2">
            <Camera size={32} style={{ color: 'var(--ink3)' }} />
            <p className="text-center text-sm" style={{ color: 'var(--ink3)' }}>
              Inca nu exista amintiri. Fii primul care distribuie o fotografie!
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-xl p-6" style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-m)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Amintire noua</h2>
              <button
                onClick={clearUpload}
                className="p-1"
                style={{ color: 'var(--ink3)' }}
              >
                <X size={20} />
              </button>
            </div>

            {uploadPreview ? (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                <img src={uploadPreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  onClick={() => {
                    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
                    setUploadFile(null)
                    setUploadPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
                style={{ border: '2px dashed var(--border)', background: 'var(--cream2)' }}
              >
                <ImageIcon size={32} style={{ color: 'var(--ink3)' }} />
                <p className="text-sm" style={{ color: 'var(--ink2)' }}>Alege o fotografie</p>
                <p className="text-[11px]" style={{ color: 'var(--ink3)' }}>JPEG, PNG sau WebP (max 4MB)</p>
              </button>
            )}

            <div className="mt-4">
              <MentionInput
                value={uploadCaption}
                onChange={setUploadCaption}
                placeholder="Povesteste despre aceasta amintire..."
                rows={3}
                maxLength={500}
                multiline
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none"
                style={{ border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }}
              />
              <p className="text-right text-[10px] mt-1" style={{ color: 'var(--ink3)' }}>{uploadCaption.length}/500</p>
            </div>

            {/* Scope selector */}
            <div className="mt-3">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink2)' }}>Cine poate vedea?</p>
              <div
                className="flex rounded-md p-[3px]"
                style={{ background: 'var(--cream2)' }}
              >
                {(['liceu', 'promotie', 'clasa'] as Scope[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUploadScope(s)}
                    className="flex-1 py-[7px] rounded-sm text-xxs font-semibold transition-all"
                    style={uploadScope === s ? {
                      background: 'var(--white)',
                      color: 'var(--ink)',
                      boxShadow: 'var(--shadow-s)',
                    } : {
                      color: 'var(--ink3)',
                    }}
                  >
                    {SCOPE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {uploadError && (
              <p className="mt-2 text-sm text-red-500">{uploadError}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="mt-4 w-full rounded-sm py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{ background: 'var(--ink)', color: 'var(--white)' }}
            >
              {uploading && <Loader2 size={16} className="animate-spin" />}
              {uploading ? 'Se incarca...' : 'Distribuie amintirea'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
    </SchoolGate>
  )
}
