'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { X, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  defaultEmail?: string
}

const fieldStyle = {
  background: 'var(--cream2)',
  border: '1.5px solid var(--border)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
}

export function SchoolRequestModal({ open, onClose, defaultEmail = '' }: Props) {
  const [judete, setJudete] = useState<string[]>([])
  const [localitati, setLocalitati] = useState<string[]>([])
  const [scoli, setScoli] = useState<{ id: number; name: string }[]>([])
  const [judet, setJudet] = useState('')
  const [localitate, setLocalitate] = useState('')
  const [schoolId, setSchoolId] = useState<number | ''>('')
  const [email, setEmail] = useState(defaultEmail)
  const [message, setMessage] = useState('')
  const [loadingScoli, setLoadingScoli] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Reset and load judete when opened
  useEffect(() => {
    if (!open) return
    setJudet(''); setLocalitate(''); setSchoolId(''); setMessage(''); setSuccess(false); setError('')
    setEmail(defaultEmail)
    async function load() {
      const { data } = await getSupabase().rpc('get_judete')
      if (data) setJudete(data.map((r: { judet: string }) => r.judet))
    }
    load()
  }, [open, defaultEmail])

  // Cascade localitati
  useEffect(() => {
    if (!judet) { setLocalitati([]); setLocalitate(''); setScoli([]); setSchoolId(''); return }
    setLocalitate(''); setScoli([]); setSchoolId('')
    async function load() {
      const { data } = await getSupabase().rpc('get_localitati', { p_judet: judet })
      if (data) setLocalitati(data.map((r: { localitate: string }) => r.localitate))
    }
    load()
  }, [judet])

  // Cascade scoli (all schools, not filtered by enabled)
  useEffect(() => {
    if (!judet || !localitate) { setScoli([]); setSchoolId(''); return }
    setSchoolId('')
    setLoadingScoli(true)
    async function load() {
      const res = await fetch(
        `/api/schools?judet=${encodeURIComponent(judet)}&localitate=${encodeURIComponent(localitate)}`,
        { cache: 'no-store' }
      )
      if (res.ok) setScoli(await res.json())
      setLoadingScoli(false)
    }
    load()
  }, [judet, localitate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!schoolId) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/school-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, email, message: message || undefined }),
    })
    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'A apărut o eroare. Încearcă din nou.')
    }
    setSubmitting(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-5 space-y-4"
        style={{ background: 'var(--white)', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base" style={{ color: 'var(--ink)' }}>Solicită adăugarea școlii</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-sm"
            style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
          >
            <X size={15} />
          </button>
        </div>

        {success ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Cerere trimisă!</p>
            <p className="text-xs" style={{ color: 'var(--ink3)' }}>
              Un administrator va analiza solicitarea ta în curând.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-md text-xs font-semibold"
              style={{ background: 'var(--ink)', color: 'var(--white)' }}
            >
              Închide
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <p className="text-xs" style={{ color: 'var(--ink3)' }}>
              Selectează școala pe care vrei să o adaugi:
            </p>

            <select
              value={judet}
              onChange={e => setJudet(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm rounded-md outline-none appearance-none"
              style={fieldStyle}
            >
              <option value="">Selectează județul</option>
              {judete.map(j => <option key={j} value={j}>{j}</option>)}
            </select>

            <select
              value={localitate}
              onChange={e => setLocalitate(e.target.value)}
              required
              disabled={!judet}
              className="w-full px-3 py-2.5 text-sm rounded-md outline-none appearance-none disabled:opacity-40"
              style={fieldStyle}
            >
              <option value="">Selectează localitatea</option>
              {localitati.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <select
              value={schoolId}
              onChange={e => setSchoolId(Number(e.target.value) || '')}
              required
              disabled={!localitate || loadingScoli}
              className="w-full px-3 py-2.5 text-sm rounded-md outline-none appearance-none disabled:opacity-40"
              style={fieldStyle}
            >
              <option value="">
                {loadingScoli ? 'Se încarcă...' : 'Selectează liceul'}
              </option>
              {scoli.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email-ul tău"
              className="w-full px-3 py-2.5 text-sm rounded-md outline-none"
              style={fieldStyle}
            />

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Mesaj opțional..."
              rows={2}
              className="w-full px-3 py-2.5 text-sm rounded-md outline-none resize-none"
              style={fieldStyle}
            />

            {error && <p className="text-xs" style={{ color: 'var(--rose)' }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting || !schoolId}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'var(--ink)', fontFamily: 'inherit' }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Se trimite...' : 'Trimite cererea'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
