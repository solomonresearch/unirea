'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function AvatarSettingsButton() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) {
        setName(data.name || '')
        setAvatarUrl(data.avatar_url)
      }
    }
    load()
  }, [])

  const bg = name ? avatarColor(name) : 'var(--ink3)'
  const ini = name ? getInitials(name) : '?'

  return (
    <Link href="/setari" className="flex-shrink-0">
      <div
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-[0.65rem] font-bold"
        style={{ background: avatarUrl ? 'transparent' : bg }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : ini
        }
      </div>
    </Link>
  )
}
