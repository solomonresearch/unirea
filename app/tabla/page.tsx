'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    name: string
  }
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

    const { data } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id, profiles(name)')
      .in('user_id', classmateIds)
      .order('created_at', { ascending: false })

    if (data) setPosts(data as unknown as Post[])
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
    const supabase = getSupabase()
    await supabase.from('posts').delete().eq('id', postId)
    await loadPosts(profile)
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
    <main className="flex min-h-screen flex-col items-center bg-gray-950 px-6 py-6">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-bold text-white">Tabla Clasei</span>
          </div>
          <Link
            href="/profil"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={16} />
            Profil
          </Link>
        </div>

        {/* Class info */}
        <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-center">
          <p className="text-sm font-medium text-gray-300">
            {profile.highschool} &bull; {profile.graduation_year} &bull; Clasa {profile.class}
          </p>
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
            <div key={post.id} className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-white">
                  {post.profiles?.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {relativeTime(post.created_at)}
                  </span>
                  {post.user_id === profile.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
