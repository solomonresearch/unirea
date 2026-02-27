'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Quiz {
  id: string
  title: string
  description: string | null
  expires_at: string | null
  reveal_threshold: number
  active: boolean
}

interface Props {
  quiz: Quiz
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function QuizEditDialog({ quiz, open, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState(quiz.title)
  const [description, setDescription] = useState(quiz.description || '')
  const [expiresAt, setExpiresAt] = useState(
    quiz.expires_at ? new Date(quiz.expires_at).toISOString().slice(0, 16) : ''
  )
  const [revealThreshold, setRevealThreshold] = useState(quiz.reveal_threshold)
  const [active, setActive] = useState(quiz.active)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  async function handleSave() {
    if (!title.trim()) { setError('Titlul este obligatoriu'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/sondaje/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          expires_at: expiresAt || null,
          reveal_threshold: Math.min(100, Math.max(2, revealThreshold)),
          active,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }
      onSaved()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editează sondajul</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titlu *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere (opțional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiră la</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deblochează după</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                max={100}
                value={revealThreshold}
                onChange={e => setRevealThreshold(Math.min(100, Math.max(2, parseInt(e.target.value) || 2)))}
                className={`${inputCls} w-24`}
              />
              <span className="text-sm text-gray-500">răspunsuri</span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-700">Activ</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Anulează
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
