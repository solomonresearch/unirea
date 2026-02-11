'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface AvatarProps {
  name: string
  avatarUrl: string | null
  userId: string
  onUpload: (url: string) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, avatarUrl, userId, onUpload }: AvatarProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Fisierul este prea mare. Maxim 2MB.')
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      alert('Format invalid. Foloseste JPG, PNG sau WebP.')
      return
    }

    setUploading(true)
    const path = `${userId}/avatar.${ext}`

    const { error } = await getSupabase().storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) {
      alert('Eroare la incarcare. Incearca din nou.')
      setUploading(false)
      return
    }

    const { data } = getSupabase().storage
      .from('avatars')
      .getPublicUrl(path)

    const url = `${data.publicUrl}?t=${Date.now()}`

    await getSupabase()
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId)

    onUpload(url)
    setUploading(false)
  }

  return (
    <div className="relative inline-block">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative w-24 h-24 rounded-full overflow-hidden group"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700">
              {getInitials(name || '?')}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : (
            <Camera size={24} className="text-white" />
          )}
        </div>
      </button>
    </div>
  )
}
