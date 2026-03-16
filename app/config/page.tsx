'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Shield, Search, Loader2, Check, Users, ChevronDown, ChevronUp, ArrowLeft, Inbox } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

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
  const [collapsed, setCollapsed] = useState(false)

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
  }, [])

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
    const res = await fetch('/api/config/schools/enable-all', { method: 'POST' })
    if (res.ok) await fetchSchools()
    setEnablingAll(false)
    setConfirmEnableAll(false)
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
      </div>

      <ConfirmDialog
        open={confirmEnableAll}
        onOpenChange={setConfirmEnableAll}
        title="Activează toate școlile"
        description={`Vei activa toate cele ${disabledCount} școli inactive. Utilizatorii lor vor putea accesa platforma imediat.`}
        confirmLabel="Activează toate"
        onConfirm={handleEnableAll}
      />
    </main>
  )
}
