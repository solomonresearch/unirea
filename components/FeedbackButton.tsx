'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, Loader2 } from 'lucide-react'
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
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('feedback')
        .eq('id', user.id)
        .single()

      const existing: { id: number; msg: string; at: string; page?: string }[] =
        Array.isArray(profile?.feedback) ? profile.feedback : []
      const nextId = existing.length > 0 ? Math.max(...existing.map(e => e.id)) + 1 : 1
      const newEntry = {
        id: nextId,
        msg: message.trim(),
        at: new Date().toISOString(),
        ...(pathname ? { page: pathname } : {}),
      }

      const { error } = await supabase
        .from('profiles')
        .update({ feedback: [...existing, newEntry] })
        .eq('id', user.id)

      if (!error) {
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
      {/* Floating feedback icon button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-20 left-4 z-[140] w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{ background: 'var(--ink)', color: 'var(--white)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      >
        <MessageSquare size={18} />
        <span className="absolute left-full ml-2 whitespace-nowrap rounded px-2 py-1 text-xs font-semibold opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
          style={{ background: 'var(--ink)', color: 'var(--white)' }}>
          dă-ne feedback
        </span>
      </button>

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
              <p className="text-center py-4 text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                Mulțumim pentru feedback!
              </p>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Descrie funcționalitatea sau problema..."
                  rows={5}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none resize-none"
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
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-opacity"
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
