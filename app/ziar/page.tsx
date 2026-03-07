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
import { Loader2, Plus, Trash2, ExternalLink, MapPin, Newspaper } from 'lucide-react'
import { relativeTime } from '@/lib/utils'

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
  const [submitError, setSubmitError] = useState('')

  const loadPosts = useCallback(async (categoryFilter?: string | null) => {
    const supabase = getSupabase()
    const cat = categoryFilter !== undefined ? categoryFilter : activeCategory
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('ziar_posts')
      .select('*')
      .is('deleted_at', null)
      .gte('created_at', threeDaysAgo)
      .order('created_at', { ascending: false })

    if (cat) query = query.eq('category', cat)

    const { data: fetchedPosts } = await query
    if (fetchedPosts) setPosts(fetchedPosts)

    const { data: { user } } = await supabase.auth.getUser()
    let canPostNow = true
    if (user) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('ziar_posts')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .gte('created_at', oneWeekAgo)
      if (count && count >= 1) canPostNow = false
    }
    setCanPost(canPostNow)
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
    setSubmitError('')

    const supabase = getSupabase()
    const filteredLinks = links.filter(l => l.trim())

    const { data: { user } } = await supabase.auth.getUser()

    let authorName = 'Anonim'
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      if (profile?.name) authorName = profile.name
    }

    const { error } = await supabase.from('ziar_posts').insert({
      title: title.trim(),
      body: body.trim(),
      category,
      links: filteredLinks.length > 0 ? filteredLinks : [],
      city: city.trim() || null,
      county: county.trim() || null,
      country: country.trim() || null,
      created_by: user?.id ?? null,
      author_name: authorName,
    })

    if (!error) {
      setDialogOpen(false)
      setTitle('')
      setBody('')
      setCategory('stiri')
      setLinks([''])
      await loadPosts()
    } else {
      setSubmitError(error.message || 'Eroare la publicare')
    }
    setSubmitting(false)
  }

  async function handleDelete(postId: string) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('ziar_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId)
    if (!error) {
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
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  const inputStyle = { border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }

  return (
    <>
      <AvizierTabBar />
      <main className="flex min-h-screen flex-col items-center px-6 pt-14 pb-24" style={{ background: 'var(--cream2)' }}>
        <div className="w-full max-w-sm space-y-3">
          {/* Header with post button */}
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Ziar</h1>
            {canPost && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ background: 'var(--ink)', color: 'var(--white)' }}
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
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={activeCategory === null
                ? { background: 'var(--ink)', color: 'var(--white)' }
                : { background: 'var(--cream)', color: 'var(--ink2)', border: '1px solid var(--border)' }
              }
            >
              Toate
            </button>
            {ZIAR_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleCategoryFilter(cat.value)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={activeCategory === cat.value
                  ? { background: 'var(--ink)', color: 'var(--white)' }
                  : { background: 'var(--cream)', color: 'var(--ink2)', border: '1px solid var(--border)' }
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Posts feed */}
          <div className="space-y-2">
            {posts.length === 0 && (
              <div className="flex flex-col items-center py-8 gap-2">
                <Newspaper size={32} style={{ color: 'var(--ink3)' }} />
                <p className="text-center text-sm" style={{ color: 'var(--ink3)' }}>
                  Nicio postare inca. Fii primul care scrie in ziar!
                </p>
              </div>
            )}
            {posts.map((post, i) => {
              const catMeta = getCategoryMeta(post.category)
              const location = [post.city, post.county].filter(Boolean).join(', ')
              return (
                <div key={post.id} className="feed-item rounded-lg px-4 py-3" style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)', animationDelay: `${Math.min(i, 10) * 50}ms` }}>
                  {/* Category badge + location */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${catMeta.color}`}>
                      {catMeta.label}
                    </span>
                    {location && (
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--ink3)' }}>
                        <MapPin size={10} />
                        {location}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{post.title}</h3>

                  {/* Body */}
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink2)' }}>{post.body}</p>

                  {/* Links */}
                  {post.links && post.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] transition-colors"
                          style={{ background: 'var(--cream2)', color: 'var(--ink2)', border: '1px solid var(--border)' }}
                        >
                          <ExternalLink size={10} />
                          {domainFromUrl(link)}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Author + time + delete */}
                  <div className="flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--ink3)' }}>
                      {post.author_name || 'Anonim'} &middot; {relativeTime(post.created_at)}
                    </span>
                    {userId && post.created_by === userId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="hover:text-red-500 transition-colors"
                        style={{ color: 'var(--border)' }}
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
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink2)' }}>Titlu</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Titlul postarii"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
              <span className="text-[10px]" style={{ color: 'var(--ink3)' }}>{title.length}/200</span>
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink2)' }}>Continut</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Scrie continutul..."
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={inputStyle}
              />
              <span className="text-[10px]" style={{ color: 'var(--ink3)' }}>{body.length}/2000</span>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink2)' }}>Categorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              >
                {ZIAR_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink2)' }}>Oras</label>
                <input
                  type="text"
                  list="cities-list"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Oras"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
                <datalist id="cities-list">
                  {ROMANIAN_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink2)' }}>Judet</label>
                <input
                  type="text"
                  list="counties-list"
                  value={county}
                  onChange={e => setCounty(e.target.value)}
                  placeholder="Judet"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
                <datalist id="counties-list">
                  {ROMANIAN_COUNTIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            {/* Links */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink2)' }}>Linkuri (optional)</label>
              {links.map((link, i) => (
                <div key={i} className="flex gap-1.5 mb-1.5">
                  <input
                    type="url"
                    value={link}
                    onChange={e => updateLink(i, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
                    style={inputStyle}
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="px-1"
                      style={{ color: 'var(--ink3)' }}
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
                  className="text-xs"
                  style={{ color: 'var(--ink2)' }}
                >
                  + Adauga link
                </button>
              )}
            </div>

            {/* Submit */}
            {submitError && (
              <p className="text-xs" style={{ color: 'var(--rose)' }}>{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full rounded-sm py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ background: 'var(--ink)', color: 'var(--white)' }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Publica'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
