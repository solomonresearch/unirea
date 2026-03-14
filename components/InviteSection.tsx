'use client'

import { useState } from 'react'
import { Copy, Share2, Check, Users } from 'lucide-react'

interface InviteSectionProps {
  username: string
  inviteCount?: number
  highschool?: string
}

export function InviteSection({ username, inviteCount = 0, highschool }: InviteSectionProps) {
  const [copied, setCopied] = useState(false)
  const inviteLink = `unirea.space/i/${username}`
  const shareText = highschool
    ? `Alătură-te comunității de la ${highschool}! ${inviteLink}`
    : `Alătură-te pe Unirea! ${inviteLink}`

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'Unirea', text: shareText, url: `https://${inviteLink}` }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{ background: 'var(--cream2)', border: '1px solid var(--border)' }}
      >
        <span className="flex-1 text-sm font-mono truncate" style={{ color: 'var(--ink)' }}>
          {inviteLink}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ background: 'var(--white)', border: '1px solid var(--border)' }}
        >
          {copied ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} style={{ color: 'var(--ink2)' }} />}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ background: 'var(--ink)', color: 'var(--white)' }}
        >
          <Share2 size={14} />
        </button>
      </div>

      {inviteCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink3)' }}>
          <Users size={13} />
          Ai invitat <strong style={{ color: 'var(--ink)' }}>{inviteCount}</strong> {inviteCount === 1 ? 'coleg' : 'colegi'}
        </p>
      )}
    </div>
  )
}
