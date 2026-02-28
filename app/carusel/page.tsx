'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Camera, Heart, MessageCircle, Share2, X, Plus, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
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

function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 7) - 3
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function CaruselPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [posts, setPosts] = useState<CaruselPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = useCallback(async () => {
    const res = await fetch('/api/carusel')
    if (res.ok) {
      const data = await res.json()
      setPosts(data.posts)
    }
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setUserId(user.id)
      await fetchPosts()
      setLoading(false)
    }
    init()
  }, [router, fetchPosts])

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
    setUploadError(null)
    setShowUpload(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('caption', uploadCaption)

    const res = await fetch('/api/carusel', { method: 'POST', body: formData })

    if (!res.ok) {
      const err = await res.json()
      setUploadError(err.error || 'Eroare la incarcare')
      setUploading(false)
      return
    }

    const newPost = await res.json()
    setPosts(prev => [newPost, ...prev])
    clearUpload()
    setUploading(false)
  }

  async function toggleLike(postId: string) {
    const post = posts.find(p => p.id === postId)
    if (!post) return

    const newLiked = !post.liked
    const newLikes = newLiked ? post.likes + 1 : post.likes - 1

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: newLiked, likes: newLikes } : p))

    const res = await fetch(`/api/carusel/${postId}/like`, { method: 'POST' })
    if (!res.ok) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: post.liked, likes: post.likes } : p))
    }
  }

  async function deletePost(postId: string) {
    const res = await fetch(`/api/carusel/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Carusel</h1>
            <p className="text-xs text-gray-400">Amintiri din liceu</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            <Plus size={14} />
            Adauga
          </button>
        </div>

        {/* Quick upload CTA */}
        <button
          onClick={() => setShowUpload(true)}
          className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
            <Camera size={16} className="text-primary-700" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">Distribuie o amintire</p>
            <p className="text-[11px] text-gray-400">Incarca o fotografie din anii de liceu</p>
          </div>
        </button>

        {/* Polaroid Carousel */}
        {posts.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Amintiri recente
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
              {posts.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => router.push(`/carusel/${photo.id}`)}
                  className="snap-center flex-shrink-0 w-44 bg-white rounded-sm p-2 pb-8 shadow-md border border-gray-100 transition-transform hover:scale-105"
                  style={{ transform: `rotate(${getRotation(photo.id)}deg)` }}
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Amintire'}
                      className="h-full w-full object-cover sepia-[.3]"
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-gray-600 truncate text-left">
                    {photo.caption || 'Fara descriere'}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5 text-left">{relativeTime(photo.created_at)}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Activity Feed */}
        {posts.length > 0 ? (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Activitate
            </h2>
            <div className="space-y-3">
              {posts.map(photo => (
                <div
                  key={photo.id}
                  className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3"
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
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[8px] font-bold text-primary-700">
                        {getInitials(photo.profiles.name)}
                      </div>
                      <span className="text-xs font-medium text-gray-900">{photo.profiles.name}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{relativeTime(photo.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{photo.caption || 'Fara descriere'}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(photo.id)}
                        className="flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <Heart
                          size={13}
                          className={photo.liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                        />
                        <span className={photo.liked ? 'text-red-500' : 'text-gray-400'}>
                          {photo.likes}
                        </span>
                      </button>
                      <button
                        onClick={() => router.push(`/carusel/${photo.id}`)}
                        className="flex items-center gap-1 text-[11px] text-gray-400"
                      >
                        <MessageCircle size={13} />
                        <span>{photo.comments.length}</span>
                      </button>
                      {photo.user_id === userId && (
                        <button
                          onClick={() => deletePost(photo.id)}
                          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); navigator.share?.({ title: photo.caption || 'Amintire', url: `${window.location.origin}/carusel/${photo.id}` }).catch(() => {}) }}
                        className="flex items-center gap-1 text-[11px] text-gray-400 ml-auto"
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
          <div className="text-center py-8 text-gray-400 text-sm">
            Inca nu exista amintiri. Fii primul care distribuie o fotografie!
          </div>
        )}

        {/* Add memory prompt */}
        <button
          onClick={() => setShowUpload(true)}
          className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Camera size={24} className="text-primary-700" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Distribuie o amintire</p>
            <p className="text-xs text-gray-400 mt-1">
              Incarca o fotografie din anii de liceu
            </p>
          </div>
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Amintire noua</h2>
              <button
                onClick={clearUpload}
                className="p-1 text-gray-400 hover:text-gray-600"
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
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
              >
                <ImageIcon size={32} className="text-gray-400" />
                <p className="text-sm text-gray-500">Alege o fotografie</p>
                <p className="text-[11px] text-gray-400">JPEG, PNG sau WebP (max 4MB)</p>
              </button>
            )}

            <div className="mt-4">
              <textarea
                value={uploadCaption}
                onChange={e => setUploadCaption(e.target.value)}
                placeholder="Povesteste despre aceasta amintire..."
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
              <p className="text-right text-[10px] text-gray-400 mt-1">{uploadCaption.length}/500</p>
            </div>

            {uploadError && (
              <p className="mt-2 text-sm text-red-500">{uploadError}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {uploading && <Loader2 size={16} className="animate-spin" />}
              {uploading ? 'Se incarca...' : 'Distribuie amintirea'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
