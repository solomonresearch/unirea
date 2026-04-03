'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import {
  Loader2, ArrowLeft, MessageSquare, Trash2, Layers,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type ClusterCategory = 'design' | 'functional' | 'improvement' | 'other'

interface FeedbackItem {
  userId: string
  userName: string
  userUsername: string
  feedbackId: number
  message: string
  createdAt: string
  page: string | null
  category: ClusterCategory | null
  screenshotPath: string | null
  screenshotUrl: string | null
}

interface ClusteredFeedback {
  design: FeedbackItem[]
  functional: FeedbackItem[]
  improvement: FeedbackItem[]
  other: FeedbackItem[]
}

const DESIGN_KW = [
  'design', 'ui', 'ux', 'culoare', 'color', 'colour', 'font', 'text', 'layout',
  'arată', 'arata', 'aspect', 'vizual', 'visual', 'interfata', 'interfață', 'interfata',
  'buton', 'button', 'icon', 'iconita', 'iconiță', 'imagine', 'image', 'logo',
  'tema', 'temă', 'dark', 'light', 'stil', 'style', 'spacing', 'padding', 'margin',
  'aliniere', 'alignment', 'dimensiune', 'size', 'contrast', 'animatie', 'animație',
  'animation', 'transition', 'responsive', 'mobil', 'mobile', 'fundal', 'background',
  'umbra', 'umbră', 'shadow', 'border', 'chenar', 'rotunjit', 'rounded',
]
const FUNCTIONAL_KW = [
  'bug', 'eroare', 'error', 'crash', 'nu merge', 'nu functioneaza', 'nu funcționează',
  'broken', 'problem', 'problema', 'problemă', 'issue', 'fail', 'failed', 'eșuat', 'esuat',
  'lent', 'slow', 'loading', 'incarcare', 'încărcare', 'nu se incarca', 'nu se încarcă',
  'nu se afiseaza', 'nu se afișează', 'dispare', 'freezes', 'ingheata', 'înghețat',
  'login', 'autentificare', 'parola', 'parolă', 'cont', 'account', 'date', 'data',
  'salvare', 'save', 'trimite', 'send', 'upload', 'download', 'sync', 'refresh',
  'notificare', 'notification', 'mesaj', 'message', 'missing', 'lipseste', 'lipsește',
]
const IMPROVEMENT_KW = [
  'ar fi bine', 'ar fi util', 'ar fi misto', 'ar fi frumos', 'propun', 'propunere',
  'idee', 'idea', 'sugestie', 'suggestion', 'imbunatatire', 'îmbunătățire', 'improvement',
  'add', 'adauga', 'adaugă', 'adaugare', 'mai bun', 'better', 'enhance', 'enhancement',
  'feature request', 'feature', 'optiune', 'opțiune', 'option', 'posibilitate', 'ability',
  'permite', 'allow', 'wish', 'would be', 'could be', 'should be', 'poate ar',
  'mai multe', 'more', 'extinde', 'extend', 'integra', 'integrate', 'export', 'import',
  'filtru', 'filter', 'sortare', 'sort', 'cautare', 'căutare', 'search',
]

const BUCKETS = [
  { key: 'design' as ClusterCategory,      label: 'Probleme de design',   dot: '#7C3AED' },
  { key: 'functional' as ClusterCategory,  label: 'Probleme funcționale', dot: '#DC2626' },
  { key: 'improvement' as ClusterCategory, label: 'Idei de îmbunătățire', dot: '#059669' },
  { key: 'other' as ClusterCategory,       label: 'Neclasificat',         dot: '#9CA3AF' },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'acum'
  if (m < 60) return `acum ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `acum ${h}h`
  const d = Math.floor(h / 24)
  return `acum ${d}z`
}

export default function FeedbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [clustered, setClustered] = useState<ClusteredFeedback | null>(null)
  const [deletingItem, setDeletingItem] = useState<string | null>(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/tabla')
        return
      }

      setAllowed(true)
      setLoading(false)
      loadFeedback()
    }
    check()
  }, [router])

  async function loadFeedback(): Promise<FeedbackItem[]> {
    setDataLoading(true)
    try {
      const supabase = getSupabase()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, feedback')
        .not('feedback', 'eq', '[]')
        .not('feedback', 'is', null)

      const allFeedback: FeedbackItem[] = (profiles || []).flatMap(p => {
        const entries: { id: number; msg: string; at: string; page?: string; category?: string; screenshot_path?: string }[] =
          Array.isArray(p.feedback) ? p.feedback : []
        return entries.map(e => ({
          userId: p.id,
          userName: p.name,
          userUsername: p.username,
          feedbackId: e.id,
          message: e.msg,
          createdAt: e.at,
          page: e.page ?? null,
          category: (e.category as FeedbackItem['category']) ?? null,
          screenshotPath: e.screenshot_path ?? null,
          screenshotUrl: null,
        }))
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Resolve signed URLs for items that have screenshots
      const itemsWithScreenshots = allFeedback.filter(f => f.screenshotPath)
      if (itemsWithScreenshots.length > 0) {
        const urlResults = await Promise.all(
          itemsWithScreenshots.map(f =>
            supabase.storage.from('feedback').createSignedUrl(f.screenshotPath!, 3600)
          )
        )
        urlResults.forEach((result, i) => {
          if (!result.error && result.data?.signedUrl) {
            itemsWithScreenshots[i].screenshotUrl = result.data.signedUrl
          }
        })
      }

      setFeedbackList(allFeedback)
      return allFeedback
    } finally {
      setDataLoading(false)
    }
  }

  function runClustering(items?: FeedbackItem[]) {
    const source = items ?? feedbackList
    const result: ClusteredFeedback = { design: [], functional: [], improvement: [], other: [] }
    for (const item of source) {
      if (item.category) {
        result[item.category].push(item)
        continue
      }
      const lower = item.message.toLowerCase()
      if (DESIGN_KW.some(k => lower.includes(k))) result.design.push(item)
      else if (FUNCTIONAL_KW.some(k => lower.includes(k))) result.functional.push(item)
      else if (IMPROVEMENT_KW.some(k => lower.includes(k))) result.improvement.push(item)
      else result.other.push(item)
    }
    setClustered(result)
  }

  async function moveToCategory(item: FeedbackItem, from: ClusterCategory, to: ClusterCategory) {
    if (!clustered || from === to) return
    setClustered(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [from]: prev[from].filter(f => !(f.userId === item.userId && f.feedbackId === item.feedbackId)),
        [to]: [...prev[to], { ...item, category: to }],
      }
    })
    setFeedbackList(prev => prev.map(f =>
      f.userId === item.userId && f.feedbackId === item.feedbackId ? { ...f, category: to } : f
    ))

    const supabase = getSupabase()
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('feedback')
      .eq('id', item.userId)
      .single()

    const entries: { id: number; msg: string; at: string; page?: string; category?: string; screenshot_path?: string }[] =
      Array.isArray(targetProfile?.feedback) ? targetProfile.feedback : []
    const updatedEntries = entries.map(e => e.id === item.feedbackId ? { ...e, category: to } : e)

    await supabase
      .from('profiles')
      .update({ feedback: updatedEntries })
      .eq('id', item.userId)
  }

  async function deleteItem(userId: string, feedbackId: number) {
    const key = `${userId}-${feedbackId}`
    setDeletingItem(key)
    try {
      const res = await fetch(`/api/admin/feedback/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId }),
      })
      if (res.ok) {
        setFeedbackList(prev => prev.filter(f => !(f.userId === userId && f.feedbackId === feedbackId)))
        setClustered(prev => {
          if (!prev) return prev
          const next = { ...prev }
          for (const k of Object.keys(next) as ClusterCategory[]) {
            next[k] = next[k].filter(f => !(f.userId === userId && f.feedbackId === feedbackId))
          }
          return next
        })
      }
    } finally {
      setDeletingItem(null)
    }
  }

  async function deleteAll() {
    setDeletingAll(true)
    try {
      const res = await fetch('/api/admin/feedback', { method: 'DELETE' })
      if (res.ok) {
        setFeedbackList([])
        setClustered({ design: [], functional: [], improvement: [], other: [] })
      }
    } finally {
      setDeletingAll(false)
      setDeleteAllConfirm(false)
    }
  }

  // Page breakdown
  const pageBreakdown = feedbackList.reduce<Record<string, number>>((acc, f) => {
    if (f.page) acc[f.page] = (acc[f.page] || 0) + 1
    return acc
  }, {})
  const topPages = Object.entries(pageBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const oldest = feedbackList.length > 0 ? feedbackList[feedbackList.length - 1].createdAt : null
  const newest = feedbackList.length > 0 ? feedbackList[0].createdAt : null

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: '#f1f3f5' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  if (!allowed) return null

  return (
    <>
    <ConfirmDialog
      open={deleteAllConfirm}
      onOpenChange={open => { setDeleteAllConfirm(open); }}
      title="Ștergi tot feedback-ul?"
      description="Se vor șterge permanent toate mesajele de feedback. Acțiunea nu poate fi anulată."
      confirmLabel="Șterge tot"
      onConfirm={deleteAll}
    />
    <main className="min-h-screen pb-12" style={{ background: '#f1f3f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--white)', borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
          <button type="button" onClick={() => router.push('/setari')} style={{ color: 'var(--ink3)' }}>
            <ArrowLeft size={18} />
          </button>
          <MessageSquare size={20} style={{ color: 'var(--teal)' }} />
          <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--ink)' }}>Feedback</h1>
          <button
            type="button"
            onClick={() => loadFeedback()}
            disabled={dataLoading}
            className="text-xs font-medium disabled:opacity-50"
            style={{ color: 'var(--teal)' }}
          >
            {dataLoading ? <Loader2 size={14} className="animate-spin" /> : 'Reîncarcă'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-5 space-y-4">
        {/* Summary bar */}
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: 'var(--white)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{feedbackList.length}</p>
                <p className="text-xxs uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>mesaje</p>
              </div>
              {oldest && newest && oldest !== newest && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--ink2)' }}>
                    {new Date(oldest).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' – '}
                    {new Date(newest).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xxs" style={{ color: 'var(--ink3)' }}>interval</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (feedbackList.length === 0) {
                    const items = await loadFeedback()
                    runClustering(items)
                  } else {
                    runClustering()
                  }
                }}
                disabled={dataLoading}
                className="flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-bold text-white disabled:opacity-50 transition-opacity active:scale-95"
                style={{ background: '#DC2626' }}
              >
                {dataLoading && <Loader2 size={13} className="animate-spin" />}
                <Layers size={13} />
                RUN
              </button>
              <button
                type="button"
                onClick={() => setDeleteAllConfirm(true)}
                disabled={feedbackList.length === 0}
                className="flex items-center gap-1.5 rounded-sm px-3 py-2 text-xs font-semibold disabled:opacity-40 transition-opacity"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
              >
                <Trash2 size={13} />
                Șterge tot
              </button>
            </div>
          </div>

          {/* Per-bucket counts (if clustered) */}
          {clustered && (
            <div className="flex flex-wrap gap-3 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              {BUCKETS.map(({ key, label, dot }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                  <span className="text-xxs" style={{ color: 'var(--ink2)' }}>{label}</span>
                  <span className="text-xxs font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{clustered[key].length}</span>
                </div>
              ))}
            </div>
          )}

          {/* Page breakdown */}
          {topPages.length > 0 && (
            <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xxs uppercase tracking-wider mb-1.5" style={{ color: 'var(--ink3)' }}>Pagini cu cel mai mult feedback</p>
              <div className="flex flex-wrap gap-2">
                {topPages.map(([page, count]) => (
                  <span
                    key={page}
                    className="text-xxs font-mono px-2 py-0.5 rounded-xs flex items-center gap-1"
                    style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
                  >
                    {page}
                    <span className="font-bold" style={{ color: 'var(--ink)' }}>{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content: clustered buckets or flat list */}
        {!clustered ? (
          /* Flat list */
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--white)', borderColor: 'var(--border)' }}
          >
            {dataLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
              </div>
            ) : feedbackList.length === 0 ? (
              <p className="text-center text-sm py-10" style={{ color: 'var(--ink3)' }}>
                Niciun feedback primit
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {feedbackList.map(f => (
                  <FeedbackCard
                    key={`${f.userId}-${f.feedbackId}`}
                    item={f}
                    screenshotUrl={f.screenshotUrl}
                    currentCategory={null}
                    deleting={deletingItem === `${f.userId}-${f.feedbackId}`}
                    onDelete={() => deleteItem(f.userId, f.feedbackId)}
                    onMove={null}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Clustered buckets */
          <div className="space-y-3">
            {BUCKETS.map(({ key, label, dot }) => {
              const items = clustered[key]
              return (
                <div
                  key={key}
                  className="rounded-xl border overflow-hidden"
                  style={{ background: 'var(--white)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--cream2)' }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                    <span className="text-xs font-bold uppercase tracking-wider flex-1" style={{ color: 'var(--ink2)' }}>{label}</span>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink3)' }}>{items.length}</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="px-5 py-3 text-xs italic" style={{ color: 'var(--ink3)' }}>Niciun mesaj</p>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {items.map(f => (
                        <FeedbackCard
                          key={`${f.userId}-${f.feedbackId}`}
                          item={f}
                          screenshotUrl={f.screenshotUrl}
                          currentCategory={key}
                          deleting={deletingItem === `${f.userId}-${f.feedbackId}`}
                          onDelete={() => deleteItem(f.userId, f.feedbackId)}
                          onMove={(to) => moveToCategory(f, key, to)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
    </>
  )
}

function FeedbackCard({
  item,
  screenshotUrl,
  currentCategory,
  deleting,
  onDelete,
  onMove,
}: {
  item: FeedbackItem
  screenshotUrl: string | null
  currentCategory: ClusterCategory | null
  deleting: boolean
  onDelete: () => void
  onMove: ((to: ClusterCategory) => void) | null
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <>
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Ștergi feedback-ul?"
      description="Mesajul va fi șters permanent."
      onConfirm={onDelete}
    />
    <div className="px-5 py-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/profil/${item.userUsername}`}
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--ink)' }}
          >
            {item.userName}
          </Link>
          <span className="text-xxs ml-1.5" style={{ color: 'var(--ink3)' }}>@{item.userUsername}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onMove && currentCategory && (
            <select
              value={currentCategory}
              onChange={e => onMove(e.target.value as ClusterCategory)}
              className="text-xxs rounded-xs px-1 py-0.5 outline-none cursor-pointer"
              style={{
                background: 'var(--cream2)',
                border: '1px solid var(--border)',
                color: 'var(--ink2)',
                fontFamily: 'inherit',
              }}
            >
              <option value="design">Design</option>
              <option value="functional">Funcțional</option>
              <option value="improvement">Îmbunătățire</option>
              <option value="other">Neclasificat</option>
            </select>
          )}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="w-6 h-6 flex items-center justify-center rounded transition-opacity disabled:opacity-40"
            style={{ color: 'var(--rose)' }}
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xxs" style={{ color: 'var(--ink3)' }}>
          {relativeTime(item.createdAt)}
        </span>
        {item.page && (
          <span className="text-xxs font-mono px-1.5 py-0.5 rounded-xs" style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}>
            {item.page}
          </span>
        )}
      </div>
      <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--ink2)' }}>
        {item.message}
      </p>
      {screenshotUrl && (
        <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt="captură ecran"
            className="max-h-48 rounded-sm object-cover border"
            style={{ borderColor: 'var(--border)' }}
          />
          <span className="text-xxs mt-0.5 block" style={{ color: 'var(--ink3)' }}>
            captură atașată · click pentru mărire
          </span>
        </a>
      )}
    </div>
    </>
  )
}
