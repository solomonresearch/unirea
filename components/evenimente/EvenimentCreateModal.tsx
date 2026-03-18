'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ImageIcon, Loader2 } from 'lucide-react'
import type { EvenimentDetail } from './types'

type Scope = 'clasa' | 'promotie' | 'liceu'

const SCOPE_LABELS: Record<Scope, string> = {
  clasa: 'Clasă',
  promotie: 'Promoție',
  liceu: 'Liceu',
}

const DB_SCOPE_MAP: Record<Scope, string> = {
  clasa: 'class',
  promotie: 'promotion',
  liceu: 'school',
}

const REVERSE_SCOPE_MAP: Record<string, Scope> = {
  class: 'clasa',
  promotion: 'promotie',
  school: 'liceu',
}

interface Props {
  open: boolean
  onClose: () => void
  initialEvent?: EvenimentDetail | null
  onCreated?: (event: any) => void
  onUpdated?: (event: any) => void
}

export function EvenimentCreateModal({ open, onClose, initialEvent, onCreated, onUpdated }: Props) {
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<Scope>('promotie')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!initialEvent

  useEffect(() => {
    if (open && initialEvent) {
      setTitle(initialEvent.title)
      setEventDate(initialEvent.event_date)
      setEventTime(initialEvent.event_time || '')
      setLocation(initialEvent.location || '')
      setDescription(initialEvent.description || '')
      setScope(REVERSE_SCOPE_MAP[initialEvent.scope] || 'promotie')
      setImagePreview(initialEvent.image_url || null)
    } else if (open && !initialEvent) {
      setTitle('')
      setEventDate('')
      setEventTime('')
      setLocation('')
      setDescription('')
      setScope('promotie')
      setImageFile(null)
      setImagePreview(null)
    }
    setError(null)
  }, [open, initialEvent])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Tip de fișier neacceptat. Folosește JPEG, PNG sau WebP.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Imaginea depășește 4MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !eventDate) return
    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.set('title', title.trim())
    formData.set('event_date', eventDate)
    if (eventTime) formData.set('event_time', eventTime)
    if (location.trim()) formData.set('location', location.trim())
    if (description.trim()) formData.set('description', description.trim())
    formData.set('scope', scope)
    if (imageFile) formData.set('file', imageFile)

    const url = isEditing ? `/api/evenimente/${initialEvent!.id}` : '/api/evenimente'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, { method, body: formData })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'A apărut o eroare.')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onClose()
    if (isEditing) onUpdated?.(json.event)
    else onCreated?.(json.event)
  }

  if (!open) return null

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl overflow-y-auto"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-m)',
          maxHeight: '92dvh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
          style={{ background: 'var(--white)', borderColor: 'var(--border)' }}
        >
          <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
            {isEditing ? 'Editează evenimentul' : 'Eveniment nou'}
          </span>
          <button type="button" onClick={onClose} style={{ color: 'var(--ink3)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          {/* Image picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed transition-opacity hover:opacity-80"
              style={{
                height: imagePreview ? '140px' : '80px',
                borderColor: 'var(--border)',
                background: 'var(--cream2)',
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon size={22} style={{ color: 'var(--ink3)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>Adaugă o imagine (opțional)</span>
                </div>
              )}
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xxs font-semibold mb-1" style={{ color: 'var(--ink3)' }}>
              Nume eveniment *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Seară de teatru"
              required
              maxLength={200}
              className="w-full rounded-sm px-3 py-2 text-xs outline-none"
              style={{
                background: 'var(--cream2)',
                border: '1.5px solid var(--border)',
                color: 'var(--ink)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Date + Time row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xxs font-semibold mb-1" style={{ color: 'var(--ink3)' }}>
                Data *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                min={todayStr}
                required
                className="w-full rounded-sm px-3 py-2 text-xs outline-none"
                style={{
                  background: 'var(--cream2)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label className="block text-xxs font-semibold mb-1" style={{ color: 'var(--ink3)' }}>
                Ora
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={e => setEventTime(e.target.value)}
                className="w-full rounded-sm px-3 py-2 text-xs outline-none"
                style={{
                  background: 'var(--cream2)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xxs font-semibold mb-1" style={{ color: 'var(--ink3)' }}>
              Locație
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="ex: Sala de festivități"
              maxLength={200}
              className="w-full rounded-sm px-3 py-2 text-xs outline-none"
              style={{
                background: 'var(--cream2)',
                border: '1.5px solid var(--border)',
                color: 'var(--ink)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xxs font-semibold mb-1" style={{ color: 'var(--ink3)' }}>
              Descriere
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalii despre eveniment..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-sm px-3 py-2 text-xs outline-none resize-none"
              style={{
                background: 'var(--cream2)',
                border: '1.5px solid var(--border)',
                color: 'var(--ink)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Scope selector */}
          <div>
            <label className="block text-xxs font-semibold mb-1" style={{ color: 'var(--ink3)' }}>
              Vizibil pentru
            </label>
            <div className="flex rounded-md p-[3px]" style={{ background: 'var(--cream2)' }}>
              {(['clasa', 'promotie', 'liceu'] as Scope[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className="flex-1 py-[7px] rounded-sm text-xxs font-semibold transition-all"
                  style={scope === s ? {
                    background: 'var(--white)',
                    color: 'var(--ink)',
                    boxShadow: 'var(--shadow-s)',
                  } : {
                    color: 'var(--ink3)',
                  }}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xxs" style={{ color: 'var(--rose)' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !title.trim() || !eventDate}
            className="w-full py-3 rounded-sm text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ background: 'var(--ink)' }}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin mx-auto" />
            ) : isEditing ? (
              'Salvează modificările'
            ) : (
              'Publică evenimentul'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
