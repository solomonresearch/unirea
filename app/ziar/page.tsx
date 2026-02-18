'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { AvizierTabBar } from '@/components/AvizierTabBar'
import { BottomNav } from '@/components/BottomNav'
import { ZIAR_CATEGORIES } from '@/lib/ziar-categories'
import { ROMANIAN_COUNTIES } from '@/lib/romanian-counties'
import { ROMANIAN_CITIES } from '@/lib/romanian-cities'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, ExternalLink, MapPin } from 'lucide-react'

interface ZiarPost {
  id: string
  title: string
  body: string
  city: string | null
  county: string | null
  country: string | null
  category: string
  links: string[]
  created_by: string | null
  author_name: string | null
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
  const d = Math.floor(diff / 86400)
  return `acum ${d} zile`
}

function getCategoryMeta(value: string) {
  return ZIAR_CATEGORIES.find(c => c.value === value) || ZIAR_CATEGORIES[0]
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export default function ZiarPage() {
  const [posts, setPosts] = useState<ZiarPost[]>([])
  const [canPost, setCanPost] = useState(true)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('stiri')
  const [city, setCity] = useState('')
  const [county, setCounty] = useState('')
  const [country, setCountry] = useState('Romania')
  const [links, setLinks] = useState<string[]>([''])

  const loadPosts = useCallback(async (categoryFilter?: string | null) => {
    const params = new URLSearchParams()
    const cat = categoryFilter !== undefined ? categoryFilter : activeCategory
    if (cat) params.set('category', cat)

    const res = await fetch(`/api/ziar${params.toString() ? '?' + params.toString() : ''}`)
    if (res.ok) {
      const data = await res.json()
      setPosts(data.posts)
      setCanPost(data.canPost)
    }
  }, [activeCategory])

  useEffect(() => {
    async function init() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setIsAuthenticated(true)

        // Prefill location from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('city, county, country')
          .eq('id', user.id)
          .single()

        if (profile) {
          if (profile.city) setCity(profile.city)
          if (profile.county) setCounty(profile.county)
          if (profile.country) setCountry(profile.country)
        }
      }
      await loadPosts(null)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCategoryFilter(cat: string | null) {
    setActiveCategory(cat)
    loadPosts(cat)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim() || submitting) return
    setSubmitting(true)

    const filteredLinks = links.filter(l => l.trim())

    const res = await fetch('/api/ziar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        category,
        city: city.trim() || undefined,
        county: county.trim() || undefined,
        country: country.trim() || undefined,
        links: filteredLinks.length > 0 ? filteredLinks : undefined,
      }),
    })

    if (res.ok) {
      setDialogOpen(false)
      setTitle('')
      setBody('')
      setCategory('stiri')
      setLinks([''])
      await loadPosts()
    } else {
      const data = await res.json()
      alert(data.error || 'Eroare la publicare')
    }
    setSubmitting(false)
  }

  async function handleDelete(postId: string) {
    const res = await fetch(`/api/ziar/${postId}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
  }

  function addLinkField() {
    if (links.length < 5) setLinks([...links, ''])
  }

  function updateLink(index: number, value: string) {
    const next = [...links]
    next[index] = value
    setLinks(next)
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </main>
    )
  }

  return (
    <>
      <AvizierTabBar />
      <main className="flex min-h-screen flex-col items-center bg-white px-6 pt-14 pb-24">
        <div className="w-full max-w-sm space-y-4">
          {/* Header with post button */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Ziar</h1>
            {canPost && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                <Plus size={16} />
                Posteaza
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => handleCategoryFilter(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Toate
            </button>
            {ZIAR_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleCategoryFilter(cat.value)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Posts feed */}
          <div className="space-y-3">
            {posts.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                Nicio postare inca. Fii primul care scrie in ziar!
              </p>
            )}
            {posts.map(post => {
              const catMeta = getCategoryMeta(post.category)
              const location = [post.city, post.county].filter(Boolean).join(', ')
              return (
                <div key={post.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                  {/* Category badge + location */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${catMeta.color}`}>
                      {catMeta.label}
                    </span>
                    {location && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <MapPin size={10} />
                        {location}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{post.title}</h3>

                  {/* Body */}
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{post.body}</p>

                  {/* Links */}
                  {post.links && post.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <ExternalLink size={10} />
                          {domainFromUrl(link)}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Author + time + delete */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {post.author_name || 'Anonim'} &middot; {relativeTime(post.created_at)}
                    </span>
                    {userId && post.created_by === userId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Bottom nav only for authenticated users */}
      {isAuthenticated && <BottomNav />}

      {/* Create post dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Postare noua</DialogTitle>
            <DialogDescription>Posteaza in ziarul comunitatii. Postarea expira dupa 3 zile.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Titlu</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Titlul postarii"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none"
              />
              <span className="text-[10px] text-gray-400">{title.length}/200</span>
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Continut</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Scrie continutul..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none resize-none"
              />
              <span className="text-[10px] text-gray-400">{body.length}/2000</span>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-gray-500 outline-none"
              >
                {ZIAR_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Oras</label>
                <input
                  type="text"
                  list="cities-list"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Oras"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none"
                />
                <datalist id="cities-list">
                  {ROMANIAN_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Judet</label>
                <input
                  type="text"
                  list="counties-list"
                  value={county}
                  onChange={e => setCounty(e.target.value)}
                  placeholder="Judet"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none"
                />
                <datalist id="counties-list">
                  {ROMANIAN_COUNTIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            {/* Links */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Linkuri (optional)</label>
              {links.map((link, i) => (
                <div key={i} className="flex gap-1.5 mb-1.5">
                  <input
                    type="url"
                    value={link}
                    onChange={e => updateLink(i, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="text-gray-400 hover:text-red-500 px-1"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              {links.length < 5 && (
                <button
                  type="button"
                  onClick={addLinkField}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  + Adauga link
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Publica'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
