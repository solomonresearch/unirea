'use client'

import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { MentionInput } from '@/components/MentionInput'
import { SCOPE_LABELS, SCOPE_DB_MAP } from '../types'
import type { Scope, CaruselPost } from '../types'

interface UploadModalProps {
  currentScope: Scope
  onClose: () => void
  onUploaded: (post: CaruselPost) => void
}

export function UploadModal({ currentScope, onClose, onUploaded }: UploadModalProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadScope, setUploadScope] = useState<Scope>(currentScope)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setUploadPreview(URL.createObjectURL(file))
    setUploadError(null)
  }

  function clearPreview() {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setUploadFile(null)
    setUploadPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploading(true)
    setUploadError(null)

    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUploadError('Nu ești autentificat'); setUploading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, username, highschool, graduation_year, class')
        .eq('id', user.id)
        .single()
      if (!profile) { setUploadError('Profil negăsit'); setUploading(false); return }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(uploadFile.type)) {
        setUploadError('Format invalid. Doar JPEG, PNG sau WebP.')
        setUploading(false)
        return
      }
      if (uploadFile.size > 4 * 1024 * 1024) {
        setUploadError('Fișierul depășește 4MB.')
        setUploading(false)
        return
      }

      const storagePath = `${user.id}/${Date.now()}-${uploadFile.name}`
      const { error: uploadErr } = await supabase.storage.from('carusel').upload(storagePath, uploadFile)
      if (uploadErr) { setUploadError(uploadErr.message || 'Eroare la încărcare'); setUploading(false); return }

      const dbScope = SCOPE_DB_MAP[uploadScope]

      const { data: inserted, error: insertErr } = await supabase
        .from('carusel_posts')
        .insert({
          user_id: user.id,
          caption: uploadCaption.trim() || null,
          storage_path: storagePath,
          original_filename: uploadFile.name,
          mime_type: uploadFile.type,
          file_size: uploadFile.size,
          scope: dbScope,
          highschool: profile.highschool,
          graduation_year: profile.graduation_year,
          class: profile.class,
        })
        .select('id, caption, storage_path, user_id, created_at')
        .single()

      if (insertErr || !inserted) {
        await supabase.storage.from('carusel').remove([storagePath])
        setUploadError(insertErr?.message || 'Eroare la salvare')
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('carusel').getPublicUrl(storagePath)

      onUploaded({
        id: inserted.id,
        caption: inserted.caption,
        image_url: publicUrl,
        user_id: inserted.user_id,
        profiles: { name: profile.name, username: profile.username },
        likes: 0,
        liked: false,
        comments: [],
        created_at: inserted.created_at,
      })
    } catch {
      setUploadError('Eroare la încărcare')
    }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="w-full max-w-sm rounded-xl p-6" style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-m)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Amintire nouă</h2>
          <button onClick={onClose} className="p-1" style={{ color: 'var(--ink3)' }}>
            <X size={20} />
          </button>
        </div>

        {uploadPreview ? (
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
            <img src={uploadPreview} alt="Preview" className="h-full w-full object-cover" />
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
            style={{ border: '2px dashed var(--border)', background: 'var(--cream2)' }}
          >
            <ImageIcon size={32} style={{ color: 'var(--ink3)' }} />
            <p className="text-sm" style={{ color: 'var(--ink2)' }}>Alege o fotografie</p>
            <p className="text-[11px]" style={{ color: 'var(--ink3)' }}>JPEG, PNG sau WebP (max 4MB)</p>
          </button>
        )}

        <div className="mt-4">
          <MentionInput
            value={uploadCaption}
            onChange={setUploadCaption}
            placeholder="Povestește despre această amintire..."
            rows={3}
            maxLength={500}
            multiline
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink)' }}
          />
          <p className="text-right text-[10px] mt-1" style={{ color: 'var(--ink3)' }}>{uploadCaption.length}/500</p>
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink2)' }}>Cine poate vedea?</p>
          <div className="flex rounded-md p-[3px]" style={{ background: 'var(--cream2)' }}>
            {(['liceu', 'promotie', 'clasa'] as Scope[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setUploadScope(s)}
                className="flex-1 py-[7px] rounded-sm text-xxs font-semibold transition-all"
                style={uploadScope === s ? {
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

        {uploadError && (
          <p className="mt-2 text-sm text-red-500">{uploadError}</p>
        )}

        <button
          onClick={handleUpload}
          disabled={!uploadFile || uploading}
          className="mt-4 w-full rounded-sm py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          style={{ background: 'var(--ink)', color: 'var(--white)' }}
        >
          {uploading && <Loader2 size={16} className="animate-spin" />}
          {uploading ? 'Se încarcă...' : 'Distribuie amintirea'}
        </button>
      </div>
    </div>
  )
}
