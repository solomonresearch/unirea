'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { MentionInput } from '@/components/MentionInput'
import { SCOPE_LABELS, SCOPE_DB_MAP } from '../types'
import type { Scope, CaruselPost } from '../types'

const SCOPE_DB_REVERSE: Record<string, Scope> = {
  school: 'liceu',
  promotion: 'promotie',
  class: 'clasa',
}

interface EditPostModalProps {
  post: CaruselPost
  userId: string
  onClose: () => void
  onSaved: (updates: Partial<CaruselPost>) => void
}

export function EditPostModal({ post, userId, onClose, onSaved }: EditPostModalProps) {
  const [caption, setCaption] = useState(post.caption ?? '')
  const [scope, setScope] = useState<Scope>(SCOPE_DB_REVERSE[post.scope] ?? 'promotie')
  const [photoDate, setPhotoDate] = useState(post.photo_date ? post.photo_date.slice(0, 10) : '')
  const [locationText, setLocationText] = useState(post.location_text ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    const supabase = getSupabase()

    const { data: profile } = await supabase
      .from('profiles')
      .select('highschool, graduation_year, class')
      .eq('id', userId)
      .single()

    if (!profile) {
      setError('Nu s-a putut încărca profilul.')
      setSaving(false)
      return
    }

    const updates = {
      caption: caption.trim() || null,
      scope: SCOPE_DB_MAP[scope],
      photo_date: photoDate ? new Date(photoDate).toISOString() : null,
      location_text: locationText.trim() || null,
      highschool: profile.highschool,
      graduation_year: profile.graduation_year,
      class: profile.class,
    }

    const { error: err } = await supabase
      .from('carusel_posts')
      .update(updates)
      .eq('id', post.id)
      .eq('user_id', userId)

    if (err) {
      setError('Eroare la salvare. Încearcă din nou.')
      setSaving(false)
      return
    }

    onSaved({
      caption: updates.caption,
      scope: updates.scope,
      photo_date: updates.photo_date,
      location_text: updates.location_text,
      // keep these in sync so post disappears from current scope view immediately
    })
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl overflow-y-auto"
        style={{
          background: 'var(--white)',
          maxHeight: '90dvh',
          boxShadow: 'var(--shadow-m)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>Editează amintirea</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Caption */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink2)' }}>
              Text <span style={{ color: 'var(--ink3)' }}>(opțional)</span>
            </label>
            <MentionInput
              value={caption}
              onChange={setCaption}
              placeholder="Povestește despre această amintire..."
              rows={3}
              maxLength={500}
              multiline
              className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }}
            />
            <p className="text-right text-[10px] mt-1" style={{ color: 'var(--ink3)' }}>{caption.length}/500</p>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink2)' }}>
              Data fotografiei
            </label>
            <input
              type="date"
              value={photoDate}
              onChange={e => setPhotoDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink2)' }}>
              Locație <span style={{ color: 'var(--ink3)' }}>(opțional)</span>
            </label>
            <input
              type="text"
              value={locationText}
              onChange={e => setLocationText(e.target.value)}
              placeholder="Cluj-Napoca, Munții Apuseni…"
              maxLength={100}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }}
            />
          </div>

          {/* Scope */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink2)' }}>Cine poate vedea?</p>
            <div className="flex rounded-md p-[3px]" style={{ background: 'var(--cream2)' }}>
              {(['liceu', 'promotie', 'clasa'] as Scope[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className="flex-1 py-[7px] rounded-sm text-xxs font-semibold transition-all"
                  style={scope === s ? {
                    background: 'var(--white)',
                    color: 'var(--ink)',
                    boxShadow: 'var(--shadow-s)',
                  } : { color: 'var(--ink3)' }}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-sm text-xs font-semibold"
              style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-sm text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--ink)', color: 'var(--white)' }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Se salvează…' : 'Salvează'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
