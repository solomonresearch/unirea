'use client'

import { useState, useEffect } from 'react'
import { X, Gift } from 'lucide-react'
import { InviteSection } from '@/components/InviteSection'

interface InvitePromptProps {
  username: string
  highschool: string
}

const DISMISSED_KEY = 'unirea_invite_prompt_dismissed'

export function InvitePrompt({ username, highschool }: InvitePromptProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISSED_KEY)) return
    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={dismiss} />
      <div
        className="relative w-full max-w-sm rounded-t-2xl px-6 py-6 space-y-4 animate-in slide-in-from-bottom"
        style={{ background: 'var(--cream)' }}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4"
          style={{ color: 'var(--ink3)' }}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}
          >
            <Gift size={20} style={{ color: 'var(--amber-dark)' }} />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
              Invită-ți colegii
            </h3>
            <p className="text-xs" style={{ color: 'var(--ink3)' }}>
              Trimite-le link-ul tău de invitație
            </p>
          </div>
        </div>

        <InviteSection username={username} highschool={highschool} />
      </div>
    </div>
  )
}
