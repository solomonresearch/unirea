'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'

interface Suggestion {
  id: string
  name: string
  username: string
  avatar_url: string | null
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  rows?: number
  maxLength?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
  multiline?: boolean
  autoFocus?: boolean
  disabled?: boolean
}

function avatarColor(name: string): string {
  const colors = ['#5B8E6D', '#7B6D9E', '#4A7B9A', '#C4634A', '#8E6B4A', '#4A8E6B', '#9E5A8A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  style,
  rows,
  maxLength,
  onKeyDown: parentOnKeyDown,
  multiline,
  autoFocus,
  disabled,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState<number>(-1)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const searchUsers = useCallback(async (query: string) => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(5)

    setSuggestions(data || [])
    setShowSuggestions((data || []).length > 0)
    setSelectedIndex(0)
  }, [])

  function checkForMention(inputEl: HTMLInputElement | HTMLTextAreaElement) {
    const cursorPos = inputEl.selectionStart ?? 0
    const currentValue = inputEl.value
    const textBeforeCursor = currentValue.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@([a-z0-9._]{3,})$/i)

    if (mentionMatch) {
      const start = cursorPos - mentionMatch[0].length
      setMentionStart(start)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        searchUsers(mentionMatch[1])
      }, 300)
    } else {
      setShowSuggestions(false)
      setMentionStart(-1)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function selectSuggestion(suggestion: Suggestion) {
    if (mentionStart < 0) return
    const currentValue = inputRef.current?.value ?? value
    const cursorPos = inputRef.current?.selectionStart ?? currentValue.length
    const before = currentValue.slice(0, mentionStart)
    const after = currentValue.slice(cursorPos)
    const newValue = `${before}@${suggestion.username} ${after}`
    onChange(newValue)
    setShowSuggestions(false)
    setMentionStart(-1)

    requestAnimationFrame(() => {
      const newPos = mentionStart + suggestion.username.length + 2
      inputRef.current?.setSelectionRange(newPos, newPos)
      inputRef.current?.focus()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        selectSuggestion(suggestions[selectedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
    }
    parentOnKeyDown?.(e)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(e.target.value)
    requestAnimationFrame(() => {
      if (inputRef.current) checkForMention(inputRef.current)
    })
  }

  const sharedProps = {
    ref: inputRef as any,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    className,
    style,
    maxLength,
    autoFocus,
    disabled,
  }

  return (
    <div className="relative">
      {multiline ? (
        <textarea {...sharedProps} rows={rows} />
      ) : (
        <input {...sharedProps} type="text" />
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 bottom-full mb-1 rounded-lg overflow-hidden z-50"
          style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-m, 0 2px 12px rgba(0,0,0,0.1))' }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
              style={{ background: i === selectedIndex ? 'var(--cream2)' : 'transparent' }}
            >
              <div
                className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[0.55rem] font-bold flex-shrink-0"
                style={{ background: s.avatar_url ? 'transparent' : avatarColor(s.name) }}
              >
                {s.avatar_url
                  ? <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                  : getInitials(s.name)
                }
              </div>
              <div className="min-w-0">
                <p className="text-[0.78rem] font-medium leading-tight truncate" style={{ color: 'var(--ink)' }}>{s.name}</p>
                <p className="text-[0.65rem]" style={{ color: 'var(--ink3)' }}>@{s.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
