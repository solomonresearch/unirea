'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export function FeedbackButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await getSupabase().auth.getUser()
      setVisible(!!user)
    }
    checkAuth()
  }, [])

  if (!visible) return null

  async function handleSubmit() {
    if (!message.trim()) return
    setSaving(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message, page: pathname }),
      })
      if (res.ok) {
        setDone(true)
        setMessage('')
        setTimeout(() => {
          setDone(false)
          setOpen(false)
        }, 1500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Feedback banner — fixed pill at very top */}
      <div
        className="fixed top-0 left-0 right-0 z-[140] flex justify-center"
        style={{ height: '16px' }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 flex items-center justify-center text-[0.52rem] font-semibold tracking-wide animate-pulse select-none rounded-b-full leading-none"
          style={{ background: 'var(--ink)', color: 'var(--white)', height: '16px' }}
        >
          da-ne feedback, te rog
        </button>
      </div>
      {/* Spacer so page content isn't hidden behind the fixed banner */}
      <div style={{ height: '16px' }} />

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5 space-y-4"
            style={{ background: 'var(--white)', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[1.1rem]" style={{ color: 'var(--ink)' }}>
                Trimite feedback
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-sm"
                style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
              >
                <X size={15} />
              </button>
            </div>

            {done ? (
              <p className="text-center py-4 text-[0.9rem] font-semibold" style={{ color: 'var(--teal)' }}>
                Mulțumim pentru feedback!
              </p>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Descrie funcționalitatea sau problema..."
                  rows={5}
                  className="w-full rounded-sm px-3 py-2.5 text-[0.88rem] outline-none resize-none"
                  style={{
                    background: 'var(--cream2)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2.5 text-[0.88rem] font-bold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: '#DC2626' }}
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? 'Se trimite...' : 'OK'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
