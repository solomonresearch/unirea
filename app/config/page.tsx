'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Shield, Search, Loader2, Check, Users } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface School {
  id: number
  denumire_lunga_unitate: string
  localitate_unitate: string
  judet_pj: string
  enabled: boolean
  member_count: number
}

type Filter = 'all' | 'enabled' | 'disabled'

export default function ConfigPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [toggling, setToggling] = useState<number | null>(null)
  const [confirmEnableAll, setConfirmEnableAll] = useState(false)
  const [enablingAll, setEnablingAll] = useState(false)

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

  async function fetchSchools(s = search, f = filter) {
    setLoading(true)
    const params = new URLSearchParams()
    if (s) params.set('search', s)
    if (f !== 'all') params.set('filter', f)

    const res = await fetch(`/api/config/schools?${params}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setSchools(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!checking) fetchSchools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, search, filter])

  async function handleToggle(school: School) {
    setToggling(school.id)
    // Optimistic update
    setSchools(prev => prev.map(s => s.id === school.id ? { ...s, enabled: !s.enabled } : s))

    const res = await fetch('/api/config/schools', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: school.id, enabled: !school.enabled }),
    })

    if (!res.ok) {
      // Revert on failure
      setSchools(prev => prev.map(s => s.id === school.id ? { ...s, enabled: school.enabled } : s))
    }
    setToggling(null)
  }

  async function handleEnableAll() {
    setEnablingAll(true)
    const res = await fetch('/api/config/schools/enable-all', { method: 'POST' })
    if (res.ok) {
      await fetchSchools()
    }
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

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
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
          className="rounded-xl border"
          style={{ background: 'var(--white)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-s)' }}
        >
          <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Școli</p>
                <p className="text-xs" style={{ color: 'var(--ink3)' }}>
                  {enabledCount} active · {disabledCount} inactive
                </p>
              </div>
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
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-[10px] pointer-events-none" style={{ color: 'var(--ink3)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Caută după nume, localitate sau județ..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none"
                style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['all', 'enabled', 'disabled'] as Filter[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                  style={filter === f ? {
                    background: 'var(--ink)',
                    color: 'var(--white)',
                  } : {
                    background: 'var(--cream2)',
                    color: 'var(--ink2)',
                  }}
                >
                  {f === 'all' ? 'Toate' : f === 'enabled' ? 'Active' : 'Inactive'}
                </button>
              ))}
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
                <div
                  key={school.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
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
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
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
