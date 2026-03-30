'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Shield, Search, Loader2, Check, X, Users, ChevronDown, ChevronUp, ArrowLeft, Inbox, SlidersHorizontal, HeartHandshake, FlaskConical } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TAXONOMY, TAXONOMY_BY_GROUP, extractSlugs, type TaxonomyGroup } from '@/lib/taxonomy'
import type { MentorshipConnection } from '@/app/api/config/mentorship-connections/route'

interface School {
  id: number
  denumire_lunga_unitate: string
  localitate_unitate: string
  judet_pj: string
  enabled: boolean
  member_count: number
  request_count: number
}

type StatusFilter = 'all' | 'enabled' | 'disabled'
type SortOrder = 'name_asc' | 'name_desc' | 'requests_desc' | 'requests_asc'

const COLLAPSED_KEY = 'config-schools-collapsed'
const TAXO_COLLAPSED_KEY = 'config-taxo-collapsed'

const GROUP_LABELS: Record<TaxonomyGroup, string> = {
  mentorat: 'Situații de mentorat',
  hobby: 'Hobby-uri',
  domeniu: 'Domenii profesionale',
  profesie: 'Profesii',
}

const GROUP_COLORS: Record<TaxonomyGroup, { bg: string; border: string; text: string }> = {
  mentorat: { bg: 'var(--amber-soft)', border: 'var(--amber)', text: 'var(--amber-dark)' },
  hobby:    { bg: 'rgba(91,142,109,0.12)', border: '#5B8E6D', text: '#3d6b4f' },
  domeniu:  { bg: 'var(--teal-soft)', border: 'var(--teal)', text: 'var(--teal)' },
  profesie: { bg: 'rgba(123,109,158,0.12)', border: '#7B6D9E', text: '#5a4e8a' },
}

export default function ConfigPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [judet, setJudet] = useState('')
  const [localitate, setLocalitate] = useState('')
  const [judete, setJudete] = useState<string[]>([])
  const [localitati, setLocalitati] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>('name_asc')
  const [toggling, setToggling] = useState<number | null>(null)
  const [confirmEnableAll, setConfirmEnableAll] = useState(false)
  const [enablingAll, setEnablingAll] = useState(false)
  const [confirmDisableAll, setConfirmDisableAll] = useState(false)
  const [disablingAll, setDisablingAll] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [thresh, setThresh] = useState<number | ''>('')
  const [threshLoading, setThreshLoading] = useState(false)
  const [threshSaved, setThreshSaved] = useState(false)

  // Taxonomy & Mentorship section
  const [taxoCollapsed, setTaxoCollapsed] = useState(true)
  const [taxoTab, setTaxoTab] = useState<'categorii' | 'conexiuni'>('categorii')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [connections, setConnections] = useState<MentorshipConnection[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [connectionsFetched, setConnectionsFetched] = useState(false)
  const [testText, setTestText] = useState('')

  // Admin check
  useEffect(() => {
    async function checkAdmin() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/autentificare'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.replace('/avizier')
        return
      }

      setChecking(false)
    }
    checkAdmin()
  }, [router])

  // Restore collapsed state from localStorage
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true')
    setTaxoCollapsed(localStorage.getItem(TAXO_COLLAPSED_KEY) !== 'false')
  }, [])

  // Load threshold once admin is confirmed
  useEffect(() => {
    if (checking) return
    async function loadThresh() {
      const res = await fetch('/api/config/app-config')
      if (res.ok) {
        const data = await res.json()
        setThresh(data.thresh_enable_school)
      }
    }
    loadThresh()
  }, [checking])

  // Load judete once admin is confirmed
  useEffect(() => {
    if (checking) return
    async function loadJudete() {
      const { data } = await getSupabase().rpc('get_judete')
      if (data) setJudete(data.map((r: { judet: string }) => r.judet))
    }
    loadJudete()
  }, [checking])

  // Cascade: reload localitati when judet changes
  useEffect(() => {
    if (!judet) { setLocalitati([]); setLocalitate(''); return }
    setLocalitate('')
    async function loadLocalitati() {
      const { data } = await getSupabase().rpc('get_localitati', { p_judet: judet })
      if (data) setLocalitati(data.map((r: { localitate: string }) => r.localitate))
    }
    loadLocalitati()
  }, [judet])

  // Fetch schools whenever any filter/sort changes
  useEffect(() => {
    if (!checking) fetchSchools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, search, statusFilter, judet, localitate, sortOrder])

  async function fetchSchools() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('filter', statusFilter)
    if (judet) params.set('judet', judet)
    if (localitate) params.set('localitate', localitate)
    params.set('sort', sortOrder)

    const res = await fetch(`/api/config/schools?${params}`, { cache: 'no-store' })
    if (res.ok) setSchools(await res.json())
    setLoading(false)
  }

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(COLLAPSED_KEY, String(next))
  }

  function toggleTaxoCollapsed() {
    const next = !taxoCollapsed
    setTaxoCollapsed(next)
    localStorage.setItem(TAXO_COLLAPSED_KEY, String(next))
  }

  async function fetchConnections() {
    if (connectionsFetched) return
    setConnectionsLoading(true)
    const res = await fetch('/api/config/mentorship-connections')
    if (res.ok) {
      const { connections: data } = await res.json()
      setConnections(data ?? [])
    }
    setConnectionsLoading(false)
    setConnectionsFetched(true)
  }

  async function handleToggle(school: School) {
    setToggling(school.id)
    setSchools(prev => prev.map(s => s.id === school.id ? { ...s, enabled: !s.enabled } : s))

    const res = await fetch('/api/config/schools', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: school.id, enabled: !school.enabled }),
    })

    if (!res.ok) {
      setSchools(prev => prev.map(s => s.id === school.id ? { ...s, enabled: school.enabled } : s))
    }
    setToggling(null)
  }

  async function handleEnableAll() {
    setEnablingAll(true)
    const res = await fetch('/api/config/schools/enable-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judet: judet || undefined, localitate: localitate || undefined }),
    })
    if (res.ok) await fetchSchools()
    setEnablingAll(false)
    setConfirmEnableAll(false)
  }

  async function handleSaveThresh() {
    if (!thresh || typeof thresh !== 'number') return
    setThreshLoading(true)
    const res = await fetch('/api/config/app-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresh_enable_school: thresh }),
    })
    if (res.ok) {
      setThreshSaved(true)
      setTimeout(() => setThreshSaved(false), 2000)
      // Refresh schools in case some got auto-enabled
      await fetchSchools()
    }
    setThreshLoading(false)
  }

  async function handleDisableAll() {
    setDisablingAll(true)
    const res = await fetch('/api/config/schools/disable-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judet: judet || undefined, localitate: localitate || undefined }),
    })
    if (res.ok) await fetchSchools()
    setDisablingAll(false)
    setConfirmDisableAll(false)
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </div>
    )
  }

  const enabledCount = schools.filter(s => s.enabled).length
  const disabledCount = schools.length - enabledCount

  const selectStyle = {
    background: 'var(--cream2)',
    border: '1.5px solid var(--border)',
    color: 'var(--ink)',
    fontFamily: 'inherit',
  }

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-4xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)', color: 'var(--ink2)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}
          >
            <Shield size={18} style={{ color: 'var(--amber-dark)' }} />
          </div>
          <div>
            <h1 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Panou de configurare</h1>
            <p className="text-xs" style={{ color: 'var(--ink3)' }}>Gestionează școlile disponibile la înregistrare</p>
          </div>
        </div>

        {/* Schools section */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
        >
          {/* Section header — always visible */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ borderBottom: collapsed ? 'none' : '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Școli</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}
              >
                {loading ? '…' : `${enabledCount} active · ${disabledCount} inactive`}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setConfirmDisableAll(true)}
                disabled={disablingAll || enabledCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ background: 'var(--cream2)', border: '1px solid var(--border)', color: 'var(--ink2)' }}
              >
                {disablingAll ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                Dezactivează toate
              </button>
              <button
                type="button"
                onClick={() => setConfirmEnableAll(true)}
                disabled={enablingAll || disabledCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)', color: 'var(--amber-dark)' }}
              >
                {enablingAll ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Activează toate
              </button>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:opacity-70"
                style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}
                title={collapsed ? 'Extinde' : 'Restrânge'}
              >
                {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
          </div>

          {!collapsed && (
            <>
              {/* Filters */}
              <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
                {/* Row 1: search */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-[10px] pointer-events-none" style={{ color: 'var(--ink3)' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Caută după numele școlii..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none"
                    style={{ ...selectStyle, border: '1.5px solid var(--border)' }}
                  />
                </div>

                {/* Row 2: judet + localitate + status + sort */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={judet}
                    onChange={e => setJudet(e.target.value)}
                    className="w-full px-2 py-2 text-sm rounded-md outline-none appearance-none"
                    style={selectStyle}
                  >
                    <option value="">Toate județele</option>
                    {judete.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>

                  <select
                    value={localitate}
                    onChange={e => setLocalitate(e.target.value)}
                    disabled={!judet}
                    className="w-full px-2 py-2 text-sm rounded-md outline-none appearance-none disabled:opacity-40"
                    style={selectStyle}
                  >
                    <option value="">Toate localitățile</option>
                    {localitati.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                    className="w-full px-2 py-2 text-sm rounded-md outline-none appearance-none"
                    style={selectStyle}
                  >
                    <option value="all">Toate statusurile</option>
                    <option value="enabled">Active</option>
                    <option value="disabled">Inactive</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value as SortOrder)}
                    className="w-full px-2 py-2 text-sm rounded-md outline-none appearance-none"
                    style={selectStyle}
                  >
                    <option value="name_asc">Nume A→Z</option>
                    <option value="name_desc">Nume Z→A</option>
                    <option value="requests_desc">Cereri ↓</option>
                    <option value="requests_asc">Cereri ↑</option>
                  </select>
                </div>
              </div>

              {/* School list */}
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
                  </div>
                ) : schools.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm" style={{ color: 'var(--ink3)' }}>Nicio școală găsită</p>
                  </div>
                ) : (
                  schools.map(school => (
                    <div key={school.id} className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(school)}
                        disabled={toggling === school.id}
                        className="relative flex-shrink-0 w-10 h-6 rounded-full transition-colors disabled:opacity-50"
                        style={{
                          background: school.enabled ? 'var(--amber)' : 'var(--cream2)',
                          border: '1.5px solid',
                          borderColor: school.enabled ? 'var(--amber)' : 'var(--border)',
                        }}
                      >
                        <span
                          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                          style={{
                            background: school.enabled ? 'white' : 'var(--ink3)',
                            left: school.enabled ? 'calc(100% - 18px)' : '2px',
                          }}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
                          {school.denumire_lunga_unitate}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ink3)' }}>
                          {school.localitate_unitate}, {school.judet_pj}
                        </p>
                      </div>

                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: school.request_count > 0 ? 'rgba(239,107,74,0.08)' : 'var(--cream2)',
                          border: `1px solid ${school.request_count > 0 ? 'rgba(239,107,74,0.25)' : 'var(--border)'}`,
                        }}
                      >
                        <Inbox size={11} style={{ color: school.request_count > 0 ? '#ef6b4a' : 'var(--ink3)' }} />
                        <span className="text-xs font-semibold" style={{ color: school.request_count > 0 ? '#ef6b4a' : 'var(--ink3)' }}>
                          {school.request_count}
                        </span>
                      </div>

                      {school.member_count > 0 && (
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--cream2)', border: '1px solid var(--border)' }}
                        >
                          <Users size={11} style={{ color: 'var(--ink3)' }} />
                          <span className="text-xs font-semibold" style={{ color: 'var(--ink2)' }}>
                            {school.member_count}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Threshold section */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}
            >
              <SlidersHorizontal size={15} style={{ color: 'var(--amber-dark)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Prag de activare licee</p>
              <p className="text-xs" style={{ color: 'var(--ink3)' }}>
                Numărul minim de înscrieri necesar pentru activarea automată a unui liceu
              </p>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={thresh}
                onChange={e => setThresh(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-28 px-3 py-2 text-sm rounded-md outline-none"
                style={{
                  background: 'var(--cream2)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={handleSaveThresh}
                disabled={threshLoading || !thresh}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)', color: 'var(--amber-dark)' }}
              >
                {threshLoading ? <Loader2 size={13} className="animate-spin" /> : threshSaved ? <Check size={13} /> : null}
                {threshSaved ? 'Salvat!' : 'Salvează'}
              </button>
            </div>
          </div>
        </div>

        {/* Taxonomy & Mentorship section */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ borderBottom: taxoCollapsed ? 'none' : '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(91,142,109,0.12)', border: '1px solid #5B8E6D' }}
              >
                <HeartHandshake size={15} style={{ color: '#3d6b4f' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Taxonomie & Mentorat</p>
                <p className="text-xs" style={{ color: 'var(--ink3)' }}>
                  {TAXONOMY.length} categorii · potrivire bazată pe slug-uri
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTaxoCollapsed}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:opacity-70"
              style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}
              title={taxoCollapsed ? 'Extinde' : 'Restrânge'}
            >
              {taxoCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {!taxoCollapsed && (
            <>
              {/* Tab bar */}
              <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                {(['categorii', 'conexiuni'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setTaxoTab(tab)
                      if (tab === 'conexiuni') fetchConnections()
                    }}
                    className="px-4 py-2.5 text-xs font-semibold capitalize transition-colors"
                    style={{
                      background: taxoTab === tab ? 'var(--white)' : 'var(--cream2)',
                      color: taxoTab === tab ? 'var(--ink)' : 'var(--ink3)',
                      borderBottom: taxoTab === tab ? '2px solid #5B8E6D' : '2px solid transparent',
                    }}
                  >
                    {tab === 'categorii' ? `Categorii (${TAXONOMY.length})` : 'Conexiuni'}
                  </button>
                ))}
              </div>

              {/* ── Categorii tab ── */}
              {taxoTab === 'categorii' && (
                <div className="p-4 space-y-5">
                  {(['mentorat', 'hobby', 'domeniu', 'profesie'] as TaxonomyGroup[]).map(group => {
                    const cats = TAXONOMY_BY_GROUP[group]
                    const col = GROUP_COLORS[group]
                    return (
                      <div key={group}>
                        {/* Pillar header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                            style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text }}
                          >
                            {GROUP_LABELS[group]}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--ink3)' }}>{cats.length} categorii</span>
                        </div>

                        {/* Category rows */}
                        <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                          {cats.map((cat, idx) => (
                            <div
                              key={cat.slug}
                              style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)' }}
                            >
                              {/* Category header row */}
                              <button
                                type="button"
                                onClick={() => setExpandedSlug(expandedSlug === cat.slug ? null : cat.slug)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:opacity-80"
                                style={{ background: expandedSlug === cat.slug ? 'var(--cream2)' : 'transparent' }}
                              >
                                <code
                                  className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded"
                                  style={{ background: col.bg, color: col.text, fontFamily: 'monospace', fontSize: 11 }}
                                >
                                  {cat.slug}
                                </code>
                                <span className="text-xs font-medium flex-1" style={{ color: 'var(--ink)' }}>
                                  {cat.label}
                                </span>
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}
                                >
                                  {cat.keywords.length} kw
                                </span>
                                <ChevronDown
                                  size={13}
                                  style={{
                                    color: 'var(--ink3)',
                                    transform: expandedSlug === cat.slug ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.15s',
                                    flexShrink: 0,
                                  }}
                                />
                              </button>

                              {/* Keywords (expanded) */}
                              {expandedSlug === cat.slug && (
                                <div className="px-3 pb-3 flex flex-wrap gap-1">
                                  {cat.keywords.map(kw => (
                                    <span
                                      key={kw}
                                      className="px-2 py-0.5 rounded-full"
                                      style={{
                                        fontSize: 11,
                                        background: 'var(--cream)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--ink2)',
                                      }}
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Live test area */}
                  <div
                    className="rounded-lg p-3 space-y-2"
                    style={{ background: 'var(--cream2)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <FlaskConical size={13} style={{ color: 'var(--ink3)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>
                        Testează extragerea de slug-uri
                      </span>
                    </div>
                    <textarea
                      value={testText}
                      onChange={e => setTestText(e.target.value)}
                      rows={3}
                      placeholder="Scrie orice text... Ex: caut un job în tech după facultate, vreau să negociez salariul"
                      className="w-full px-3 py-2 text-sm rounded-md outline-none resize-none"
                      style={{
                        background: 'var(--white)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--ink)',
                        fontFamily: 'inherit',
                      }}
                    />
                    {testText.trim() && (
                      <div className="flex flex-wrap gap-1.5">
                        {extractSlugs(testText).length === 0 ? (
                          <span className="text-xs italic" style={{ color: 'var(--ink3)' }}>Niciun slug detectat</span>
                        ) : (
                          extractSlugs(testText).map(slug => {
                            const cat = TAXONOMY.find(c => c.slug === slug)
                            const col = cat ? GROUP_COLORS[cat.group] : GROUP_COLORS.mentorat
                            return (
                              <span
                                key={slug}
                                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text }}
                              >
                                {slug}
                              </span>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Conexiuni tab ── */}
              {taxoTab === 'conexiuni' && (
                <div className="p-4">
                  {connectionsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
                    </div>
                  ) : connections.length === 0 ? (
                    <p className="text-sm text-center py-8 italic" style={{ color: 'var(--ink3)' }}>
                      Nicio conexiune activă momentan.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs mb-3" style={{ color: 'var(--ink3)' }}>
                        {connections.length} {connections.length === 1 ? 'conexiune' : 'conexiuni'} active · sortat după scor Jaccard
                      </p>
                      {connections.map((conn, i) => {
                        const pct = Math.round(conn.score * 100)
                        const scoreStyle =
                          pct >= 60
                            ? { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }
                            : pct >= 30
                            ? { background: 'var(--teal-soft)', color: 'var(--teal)', border: '1px solid var(--teal)' }
                            : { background: 'var(--amber-soft)', color: 'var(--amber-dark)', border: '1px solid var(--amber)' }
                        return (
                          <div
                            key={i}
                            className="rounded-lg p-3 space-y-2"
                            style={{ background: 'var(--cream2)', border: '1px solid var(--border)' }}
                          >
                            {/* Names row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                                {conn.mentor_name}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)', border: '1px solid var(--amber)' }}>
                                mentor
                              </span>
                              <span className="text-xs" style={{ color: 'var(--ink3)' }}>→</span>
                              <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                                {conn.mentee_name}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--teal-soft)', color: 'var(--teal)', border: '1px solid var(--teal)' }}>
                                mentee
                              </span>
                              <span
                                className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                                style={scoreStyle}
                              >
                                {pct}%
                              </span>
                            </div>
                            {/* Shared slugs with keywords */}
                            <div className="flex flex-wrap gap-2">
                              {conn.slug_details.length === 0 && (
                                <span className="text-xs italic" style={{ color: 'var(--ink3)' }}>
                                  Activi, fără text completat încă
                                </span>
                              )}
                              {conn.slug_details.map(({ slug, mentorKeywords, menteeKeywords }) => {
                                const cat = TAXONOMY.find(c => c.slug === slug)
                                const col = cat ? GROUP_COLORS[cat.group] : GROUP_COLORS.mentorat
                                const allKeywords = [...new Set([...mentorKeywords, ...menteeKeywords])]
                                return (
                                  <div key={slug} className="flex flex-col gap-0.5">
                                    <span
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                                      style={{ fontSize: 11, background: col.bg, border: `1px solid ${col.border}`, color: col.text }}
                                    >
                                      <span className="font-semibold">{cat?.label ?? slug}</span>
                                      <code style={{ fontSize: 10, opacity: 0.7 }}>{slug}</code>
                                    </span>
                                    {allKeywords.length > 0 && (
                                      <span
                                        className="px-2 leading-tight"
                                        style={{ fontSize: 10, color: 'var(--ink3)' }}
                                      >
                                        {allKeywords.slice(0, 4).join(' · ')}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmEnableAll}
        onOpenChange={setConfirmEnableAll}
        title="Activează toate școlile"
        description={`Vei activa toate cele ${disabledCount} școli inactive${judet ? ` din ${localitate || judet}` : ''}. Utilizatorii lor vor putea accesa platforma imediat.`}
        confirmLabel="Activează toate"
        onConfirm={handleEnableAll}
      />

      <ConfirmDialog
        open={confirmDisableAll}
        onOpenChange={setConfirmDisableAll}
        title="Dezactivează toate școlile"
        description={`Vei dezactiva toate cele ${enabledCount} școli active${judet ? ` din ${localitate || judet}` : ''}. Utilizatorii lor nu vor mai putea accesa platforma.`}
        confirmLabel="Dezactivează toate"
        onConfirm={handleDisableAll}
      />
    </main>
  )
}
