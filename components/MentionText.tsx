'use client'

const MENTION_REGEX = /@([a-z0-9._]+)/g

interface MentionTextProps {
  text: string
  className?: string
}

export function MentionText({ text, className }: MentionTextProps) {
  const parts: (string | { username: string })[] = []
  let lastIndex = 0

  for (const match of text.matchAll(MENTION_REGEX)) {
    const idx = match.index!
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx))
    }
    parts.push({ username: match[1] })
    lastIndex = idx + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  if (parts.length === 0) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <span key={i} style={{ color: 'var(--teal)', fontWeight: 600 }}>
            @{part.username}
          </span>
        )
      )}
    </span>
  )
}
